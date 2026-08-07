// Admin chat agent — lets an admin make changes to work orders through
// natural language instead of clicking through the dashboard. Uses Ollama's
// native tool-calling: the model decides which tool(s) to call, we execute
// them against workOrders.js (via agentTools.js) and feed the results back,
// looping until it gives a plain-text answer.
//
// Every change goes through the exact same functions the dashboard's buttons
// use, so the Admin page's existing live-update subscription picks up
// anything this agent does automatically — no extra wiring needed there.

import { TOOL_DEFINITIONS, executeTool } from "./agentTools.js";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "maintenance-llama";
const MAX_TOOL_ROUNDS = 6;

const SYSTEM_PROMPT = `You are an assistant helping a facilities admin manage maintenance work
orders through conversation. Use the available tools to look up and modify work orders.

Always call find_work_orders first if you don't already know a work order's exact ID from earlier
in this conversation — never guess an ID. If a request could match multiple work orders, ask a
short clarifying question instead of picking one. After making changes, briefly confirm what you
did in plain, friendly language — don't mention tool names or internal details.`;

const TOOL_NAMES = new Set(TOOL_DEFINITIONS.map((t) => t.function.name));

// Small local models occasionally leak a bare tool name as their "content"
// instead of either calling it properly or writing a sentence (e.g. just
// "find_work_orders"). Treat anything that looks like a lone identifier —
// no spaces, no punctuation — as not-a-real-answer rather than showing it.
function looksLikeJunkContent(content) {
  const trimmed = content.trim();
  if (!trimmed) return true;
  if (TOOL_NAMES.has(trimmed)) return true;
  return /^[a-z_]+$/i.test(trimmed) && trimmed.length < 40;
}

// Sometimes the model writes out what it *meant* as a real tool_calls entry
// as plain JSON text instead — e.g. {"name": "find_work_orders", "parameters":
// {...}}. Recognize and execute that intent rather than either crashing on it
// or showing the raw JSON to the admin.
function tryParsePseudoToolCall(content) {
  const trimmed = content.trim();
  if (!trimmed.startsWith("{")) return null;
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return null;
  }
  const name = parsed.name ?? parsed.function?.name;
  if (!name || !TOOL_NAMES.has(name)) return null;
  const rawArgs = parsed.parameters ?? parsed.arguments ?? parsed.function?.arguments ?? {};
  const args = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs;
  return { name, args };
}

export async function getAdminAgentResponse(messages) {
  const conversation = [{ role: "system", content: SYSTEM_PROMPT }, ...messages];
  const toolResultLog = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let data;
    try {
      const res = await fetch(OLLAMA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          stream: false,
          messages: conversation,
          tools: TOOL_DEFINITIONS,
        }),
      });
      if (!res.ok) throw new Error(`Ollama responded with ${res.status}`);
      data = await res.json();
    } catch {
      return `I can't reach the local model right now. Make sure Ollama is running and "${MODEL}" is available.`;
    }

    const message = data.message ?? {};
    conversation.push(message);

    if (message.tool_calls?.length) {
      for (const call of message.tool_calls) {
        const rawArgs = call.function?.arguments;
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs || "{}") : rawArgs ?? {};
        const result = executeTool(call.function?.name, args);
        toolResultLog.push(String(result));
        conversation.push({ role: "tool", content: String(result) });
      }
      continue; // give the model another turn with the tool results in context
    }

    const pseudoCall = tryParsePseudoToolCall(message.content ?? "");
    if (pseudoCall) {
      const result = executeTool(pseudoCall.name, pseudoCall.args);
      toolResultLog.push(String(result));
      conversation.push({ role: "tool", content: String(result) });
      continue;
    }

    if (!looksLikeJunkContent(message.content ?? "")) {
      return message.content.trim();
    }

    // The model didn't give a real answer this round. If it actually did
    // something (tool results exist), report that plainly instead of
    // showing garbage or silently trying again.
    if (toolResultLog.length > 0) {
      return toolResultLog[toolResultLog.length - 1];
    }
  }

  return toolResultLog.length > 0
    ? toolResultLog[toolResultLog.length - 1]
    : "I made some changes but wasn't able to fully confirm everything — check the dashboard to be sure.";
}
