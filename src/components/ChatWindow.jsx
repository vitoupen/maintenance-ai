import { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";

export default function ChatWindow({ messages, isTyping }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="flex h-full flex-col items-center justify-center text-center px-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-2xl">
          🛠️
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-800">
          Maintenance AI Assistant
        </h2>
        <p className="mt-1.5 max-w-sm text-sm text-slate-500">
          Ask about equipment issues, maintenance schedules, or open a work
          order — I'm here to help.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-6 sm:px-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} content={msg.content} />
        ))}
        {isTyping && <MessageBubble role="assistant" isLoading />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
