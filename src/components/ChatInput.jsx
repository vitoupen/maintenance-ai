import { useState } from "react";
import Button from "./Button.jsx";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-slate-100 bg-white/80 backdrop-blur px-4 py-4 sm:px-8">
      <div className="mx-auto flex max-w-3xl items-end gap-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe the issue or ask a question..."
          rows={1}
          className="max-h-40 flex-1 resize-none rounded-xl border border-slate-200 bg-white px-4 py-3
            text-sm text-slate-800 placeholder:text-slate-400 shadow-sm
            focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary"
        />
        <Button onClick={handleSend} disabled={disabled || !value.trim()} className="h-11">
          Send
        </Button>
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-slate-400">
        Maintenance AI can make mistakes. Verify critical safety information.
      </p>
    </div>
  );
}
