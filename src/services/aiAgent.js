// ============================================================================
// PLUG-AND-PLAY MODEL HOOK
// ============================================================================
// This is the ONLY file you need to edit to connect a real (local) LLM.
// Everything else (the chat UI, work order storage, admin dashboard) talks
// to the agent only through the `getAgentResponse()` function below, so the
// rest of the app never has to change.
//
// Contract — keep the input/output shape identical when you swap the body:
//
//   input:  {
//     messages: [{ role: "user" | "assistant", content: string }, ...],
//     draft: {
//       requesterName: string,
//       location: string,
//       description: string,
//       awaitingConfirmation: boolean,
//     },
//   }
//
//   output: {
//     reply: string,              // what the assistant says next
//     draft: <same shape as input.draft, updated>,
//     complete: boolean,          // true once a work order is ready to submit
//     workOrder?: {                // only present when complete === true
//       requesterName, location, description, priority
//     },
//   }
//
// Example swap-in using a local Ollama server (https://ollama.com):
//
//   export async function getAgentResponse({ messages, draft }) {
//     const res = await fetch("http://localhost:11434/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         model: "llama3",
//         stream: false,
//         messages: [
//           { role: "system", content: SYSTEM_PROMPT }, // instruct it to
//           //   collect requesterName/location/description, then ask for
//           //   confirmation, then respond with a JSON block once submitted.
//           ...messages,
//         ],
//       }),
//     });
//     const data = await res.json();
//     // Parse data.message.content into { reply, draft, complete, workOrder }
//     // however your prompt format encodes it (e.g. ask the model to end
//     // its reply with a fenced ```json {...}``` block once complete).
//     return parseModelReply(data.message.content, draft);
//   }
//
// Until then, the simulated "agentic" version below fills the same contract
// with simple rule-based slot-filling — no network calls, no dependencies.
// ============================================================================

export const EMPTY_DRAFT = {
  requesterName: "",
  location: "",
  description: "",
  awaitingConfirmation: false,
};

const REQUIRED_FIELDS = [
  {
    key: "requesterName",
    question: "Hi! I can help you submit a maintenance request. What's your name?",
  },
  {
    key: "location",
    question: "Thanks, {name}. Where is the issue located? (e.g. Building 2, Room 104)",
  },
  {
    key: "description",
    question: "Got it. Can you describe the issue in a bit more detail?",
  },
];

function nextEmptyField(draft) {
  return REQUIRED_FIELDS.find((field) => !draft[field.key]);
}

function guessPriority(description = "") {
  const text = description.toLowerCase();
  if (/(fire|smoke|gas leak|flood|electrical|spark|unsafe)/.test(text)) return "High";
  if (/(leak|broken|not working|noise|vibrat|stuck)/.test(text)) return "Medium";
  return "Low";
}

function simulateThinkingDelay(min = 500, max = 1100) {
  const ms = Math.floor(Math.random() * (max - min)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getAgentResponse({ messages, draft }) {
  await simulateThinkingDelay();

  const lastUserMessage =
    [...messages].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";

  // Case 1: we just asked "should I submit this?" — handle the yes/no.
  if (draft.awaitingConfirmation) {
    const confirmed = /^(y|yes|yep|yeah|confirm|correct|sounds good)/i.test(lastUserMessage);

    if (confirmed) {
      const workOrder = {
        requesterName: draft.requesterName,
        location: draft.location,
        description: draft.description,
        priority: guessPriority(draft.description),
      };
      return {
        reply: `Done! I've submitted your work order (priority: ${workOrder.priority}). A technician will follow up soon.`,
        draft: { ...draft, awaitingConfirmation: false },
        complete: true,
        workOrder,
      };
    }

    return {
      reply: "No problem — let's redo that. Can you describe the issue again?",
      draft: { ...draft, description: "", awaitingConfirmation: false },
      complete: false,
    };
  }

  // Case 2: fill in whichever field we were waiting on with the user's answer.
  const updatedDraft = { ...draft };
  const pending = nextEmptyField(draft);
  if (pending && lastUserMessage) {
    updatedDraft[pending.key] = lastUserMessage;
  }

  // Case 3: still missing fields — ask the next question.
  const stillMissing = nextEmptyField(updatedDraft);
  if (stillMissing) {
    const question = stillMissing.question.replace("{name}", updatedDraft.requesterName || "there");
    return { reply: question, draft: updatedDraft, complete: false };
  }

  // Case 4: everything collected — summarize and ask for confirmation.
  const summary =
    `Here's what I've got:\n` +
    `• Name: ${updatedDraft.requesterName}\n` +
    `• Location: ${updatedDraft.location}\n` +
    `• Issue: ${updatedDraft.description}\n\n` +
    `Should I submit this work order? (yes/no)`;

  return {
    reply: summary,
    draft: { ...updatedDraft, awaitingConfirmation: true },
    complete: false,
  };
}
