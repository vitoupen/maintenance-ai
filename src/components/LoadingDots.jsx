export default function LoadingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-2">
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-blink [animation-delay:-0.32s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-blink [animation-delay:-0.16s]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-blink" />
    </div>
  );
}
