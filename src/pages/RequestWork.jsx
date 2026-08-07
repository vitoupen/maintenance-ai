import { useEffect, useRef, useState } from "react";
import ChatWindow from "../components/ChatWindow.jsx";
import ChatInput from "../components/ChatInput.jsx";
import Button from "../components/Button.jsx";
import { getAgentResponse, EMPTY_DRAFT } from "../services/aiAgent.js";
import { addWorkOrder } from "../services/workOrders.js";

let nextId = 1;

export default function RequestWork() {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [isTyping, setIsTyping] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    greet();
  }, []);

  const greet = async () => {
    setIsTyping(true);
    const { reply, draft: nextDraft } = await getAgentResponse({ messages: [], draft: EMPTY_DRAFT });
    setIsTyping(false);
    setDraft(nextDraft);
    setMessages([{ id: nextId++, role: "assistant", content: reply }]);
  };

  const handleSend = async (text) => {
    const userMessage = { id: nextId++, role: "user", content: text };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    setIsTyping(true);
    const { reply, draft: nextDraft, complete, workOrder } = await getAgentResponse({
      messages: nextMessages,
      draft,
    });
    setIsTyping(false);
    setDraft(nextDraft);
    setMessages((prev) => [...prev, { id: nextId++, role: "assistant", content: reply }]);

    if (complete && workOrder) {
      addWorkOrder(workOrder);
      setSubmitted(true);
    }
  };

  const handleNewRequest = () => {
    setMessages([]);
    setDraft(EMPTY_DRAFT);
    setSubmitted(false);
    greet();
  };

  return (
    <div className="flex h-screen flex-col bg-surface">
      <header className="flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-800">Maintenance AI Assistant</h1>
            <p className="text-xs text-slate-500">Submit a work request — no account needed</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {submitted && (
            <Button variant="secondary" size="sm" onClick={handleNewRequest}>
              New Request
            </Button>
          )}
          <a href="#/login" className="text-xs text-slate-400 hover:text-slate-600">
            Admin
          </a>
        </div>
      </header>

      <ChatWindow messages={messages} isTyping={isTyping} />
      <ChatInput onSend={handleSend} disabled={isTyping || submitted} />
    </div>
  );
}
