import LoadingDots from "./LoadingDots.jsx";
import TypingText from "./TypingText.jsx";

export default function MessageBubble({ role, content, isLoading = false, onUpdate }) {
  const isUser = role === "user";

  return (
    <div className={`flex w-full animate-fadeIn ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[80%] gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isUser ? "bg-primary text-white" : "bg-slate-200 text-slate-600"
          }`}
        >
          {isUser ? "U" : "🛠️"}
        </div>
        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft whitespace-pre-wrap ${
            isUser
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-white text-slate-700 border border-slate-100 rounded-tl-sm"
          }`}
        >
          {isLoading ? (
            <LoadingDots />
          ) : isUser ? (
            content
          ) : (
            <TypingText text={content} onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
}
