import { useRef, useState } from "react";
import Button from "./Button.jsx";
import { getAdminAgentResponse } from "../services/adminAgent.js";

function makeId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

// Floating chat widget on the admin dashboard — lets the admin ask the AI to
// make changes ("mark HS-003 in progress", "assign Riley Chen to the urinal
// ticket") instead of clicking through the tables. Changes it makes show up
// live in the dashboard, same as any manual edit.
export default function AdminChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  // A ref (not state) so a second rapid-fire send is rejected immediately,
  // before React has had a chance to re-render with isThinking === true.
  const sendingRef = useRef(false);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sendingRef.current) return;
    sendingRef.current = true;

    const userMessage = { id: makeId(), role: "user", content: text };
    const next = [...messages, userMessage];
    setMessages(next);
    setInput("");
    setIsThinking(true);

    const reply = await getAdminAgentResponse(next.map(({ role, content }) => ({ role, content })));

    setIsThinking(false);
    sendingRef.current = false;
    setMessages((prev) => [...prev, { id: makeId(), role: "assistant", content: reply }]);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full
          bg-primary text-2xl text-white shadow-card transition-transform hover:scale-105 hover:bg-primary-700"
        aria-label="Ask AI to make changes"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[28rem] w-96 max-w-[calc(100vw-3rem)] flex-col
      rounded-2xl border border-slate-200 bg-white shadow-card">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Ask AI to make changes</p>
          <p className="text-xs text-slate-400">No clicking required</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto scrollbar-thin px-4 py-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-400">
            Try: "mark HS-003 as in progress" or "assign Riley Chen to the urinal ticket"
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "self-end bg-primary text-white"
                : "self-start bg-slate-100 text-slate-700"
            }`}
          >
            {m.content}
          </div>
        ))}
        {isThinking && (
          <div className="self-start rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-400">
            Thinking…
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          placeholder="e.g. mark HS-003 resolved"
          disabled={isThinking}
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm
            focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary
            disabled:bg-slate-50"
        />
        <Button size="sm" onClick={handleSend} disabled={isThinking || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
