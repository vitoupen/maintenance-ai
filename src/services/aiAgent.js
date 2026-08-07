// ============================================================================
// AGENT — now backed by a local Ollama model (maintenance-llama, see
// ../../Modelfile — a llama3.1 base with a lower temperature for more
// reliable structured output)
// ============================================================================
// This is still the ONLY file the rest of the app talks to. Everything else
// (the chat UI, work order storage, admin dashboard) calls `getAgentResponse()`
// and only cares about its return shape, so nothing else had to change to
// swap the old rule-based simulation for a real model here.
//
// Contract:
//
//   input:  {
//     messages: [{ role: "user" | "assistant", content: string }, ...],
//     draft: {
//       requesterName: string,
//       location: string,
//       description: string,
//       awaitingConfirmation: boolean, // unused now — kept for shape stability
//     },
//   }
//
//   output: {
//     reply: string,              // what the assistant says next
//     draft: <same shape as input.draft, updated>,
//     complete: boolean,          // true once a work order is ready to submit
//     workOrder?: {                // only present when complete === true
//       requesterName, location, description, priority, category
//     },
//   }
//
// How this works: the model is instructed (via the system prompt built in
// buildSystemPrompt()) to collect requesterName/location/description, ask for
// confirmation, and end every reply with a fenced ```json {...}``` block
// carrying its current understanding of the draft plus a `complete` flag and,
// once complete, a `priority` code and `category` — both drawn from the real
// lists in src/data/priorities.js and src/data/categories.js, which are
// interpolated directly into the prompt so the model only ever sees valid
// options. That JSON block is parsed out below and stripped from what's
// shown to the user; if the model ever fails to include a valid block, we
// just show its reply as-is and keep the conversation going rather than
// crashing.
//
// Requires Ollama running locally (`ollama serve`, usually automatic after
// install) with the model built from the Modelfile at the project root:
//   ollama pull llama3.1
//   ollama create maintenance-llama -f Modelfile
// ============================================================================

import { PRIORITIES } from "../data/priorities.js";
import { CATEGORIES } from "../data/categories.js";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "maintenance-llama";

const PRIORITY_CODES = new Set(PRIORITIES.map((p) => p.code));
const CATEGORY_SET = new Set(CATEGORIES);

export const EMPTY_DRAFT = {
  requesterName: "",
  location: "",
  description: "",
  awaitingConfirmation: false,
};

function buildSystemPrompt() {
  const priorityLines = PRIORITIES.map(
    (p) => `- ${p.code} (${p.name}): ${p.description}. Response time: ${p.responseTime}.`
  ).join("\n");

  return `You are a friendly maintenance request intake assistant for a facilities team.

Your job: collect three things from the user, in any order, possibly across several messages:
- requesterName: the person's name
- location: where the issue is (building and area/room)
- description: what the issue is

Once you have all three, summarize them back to the user in a couple of lines and ask them to
confirm submission (they should reply "yes" or "no"). If they say no, ask them to describe the
issue again. Once they confirm with something affirmative, tell them it's been submitted and
mention the priority you assigned.

Priority scale — pick exactly one code once the request is confirmed:
${priorityLines}

Categories — pick exactly one once the request is confirmed, or "General Maintenance" if nothing
else fits well: ${CATEGORIES.join(", ")}

CRITICAL OUTPUT FORMAT: end every single reply with a fenced code block exactly like this, with
nothing else inside the fence:

\`\`\`json
{"requesterName": "", "location": "", "description": "", "complete": false, "priority": null, "category": null}
\`\`\`

Rules for that block:
- Always fill requesterName/location/description with your best current understanding (empty
  string "" for anything not yet known), even before you have all three.
- Set "complete" to true only on the reply where the user has just confirmed submission.
  Otherwise it must be false.
- When "complete" is true, "priority" must be one of the exact codes above and "category" one of
  the exact category names above — never invent a new value.
- Never mention or refer to the JSON block in your natural-language reply — it's parsed out and
  hidden from the user, so anything they should see must be in the text before the fence.`;
}

// Prefer the fenced ```json block the prompt asks for, but the model doesn't
// always include the fence — fall back to the last {...} in the text so a
// missing fence doesn't silently drop the whole turn (and the work order
// along with it).
function findJsonSpan(text) {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  if (fenced) return { raw: fenced[1], start: fenced.index, end: fenced.index + fenced[0].length };

  const start = text.lastIndexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return null;
  return { raw: text.slice(start, end + 1), start, end: end + 1 };
}

function extractJsonBlock(text) {
  const span = findJsonSpan(text);
  if (!span) return null;
  try {
    return JSON.parse(span.raw);
  } catch {
    return null;
  }
}

function stripJsonBlock(text) {
  const span = findJsonSpan(text);
  if (!span) return text.trim();
  return (text.slice(0, span.start) + text.slice(span.end)).trim();
}

// Some models leak a literal role-label ("assistant\n\n...") when given a
// prompt with no prior user turn — most commonly the very first greeting.
// Cheap defense-in-depth on top of skipping the model call for that case below.
function stripLeakedRoleLabel(text) {
  return text.replace(/^(assistant|system)\s*\n+/i, "");
}

export async function getAgentResponse({ messages, draft }) {
  // Nothing for the model to react to yet — the opening question is always
  // the same, so skip the round trip (and sidesteps models that leak a
  // literal "assistant" role label when given a system-only prompt).
  if (messages.length === 0) {
    return {
      reply: "Hi! I can help you submit a maintenance request. What's your name?",
      draft,
      complete: false,
    };
  }

  let data;
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
      }),
    });
    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
    data = await res.json();
  } catch {
    return {
      reply:
        `I can't reach the local model right now. Make sure Ollama is running and that "${MODEL}" ` +
        `is pulled (\`ollama pull ${MODEL}\`), then try again.`,
      draft,
      complete: false,
    };
  }

  const rawReply = data.message?.content ?? "";
  const parsed = extractJsonBlock(rawReply);
  const reply = stripLeakedRoleLabel(stripJsonBlock(rawReply)) || "Sorry, could you say that again?";

  if (!parsed) {
    // Model didn't include a parseable block this turn — keep the conversation
    // going rather than losing track of what's already been collected.
    return { reply, draft, complete: false };
  }

  const nextDraft = {
    requesterName: parsed.requesterName || draft.requesterName || "",
    location: parsed.location || draft.location || "",
    description: parsed.description || draft.description || "",
    awaitingConfirmation: false,
  };

  const priority = PRIORITY_CODES.has(parsed.priority) ? parsed.priority : "P3";
  const category = CATEGORY_SET.has(parsed.category) ? parsed.category : "General Maintenance";

  if (parsed.complete) {
    return {
      reply,
      draft: nextDraft,
      complete: true,
      workOrder: {
        requesterName: nextDraft.requesterName,
        location: nextDraft.location,
        description: nextDraft.description,
        priority,
        category,
      },
    };
  }

  return { reply, draft: nextDraft, complete: false };
}

// Used by the post-submission ticket popup: the requester thinks the
// assigned priority is wrong and explains why. Asks the model to weigh that
// reason against the real priority scale and decide (it may keep the same
// priority). Returns null on failure so the caller can show a clear error
// instead of silently doing nothing.
export async function reconsiderPriority({ location, description, category, priority, reason }) {
  const priorityLines = PRIORITIES.map((p) => `- ${p.code} (${p.name}): ${p.description}`).join("\n");

  const prompt = `A facilities work order was assigned priority ${priority}.

Location: ${location}
Category: ${category}
Description: ${description}

The requester thinks the priority should be reconsidered, for this reason: "${reason}"

Priority scale:
${priorityLines}

Decide the correct priority code — it's fine to keep the same one if the original assignment was
already right. Respond with ONLY this fenced json block, nothing else:

\`\`\`json
{"priority": "P2", "explanation": "one short sentence explaining the decision"}
\`\`\``;

  let data;
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        stream: false,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
    data = await res.json();
  } catch {
    return null;
  }

  const parsed = extractJsonBlock(data.message?.content ?? "");
  if (!parsed) return null;

  return {
    priority: PRIORITY_CODES.has(parsed.priority) ? parsed.priority : priority,
    explanation: parsed.explanation || "No explanation was given.",
  };
}
