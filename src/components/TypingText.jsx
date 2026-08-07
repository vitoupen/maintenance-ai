import { useEffect, useState } from "react";

// Reveals `text` a few characters at a time, like a typing AI reply. Runs
// once per mount — since messages already in the list keep a stable `key`
// and never remount, only a newly-appended message actually plays this.
const CHARS_PER_TICK = 2;
const TICK_MS = 20;

export default function TypingText({ text, onUpdate }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    setVisibleCount(0);
    if (!text) return;

    const interval = setInterval(() => {
      setVisibleCount((count) => {
        const next = count + CHARS_PER_TICK;
        if (next >= text.length) {
          clearInterval(interval);
          return text.length;
        }
        return next;
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [text]);

  // Let the parent know the bubble grew (e.g. to keep it scrolled into view)
  // as text is revealed, not just when the message first appears.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onUpdate?.();
  }, [visibleCount]);

  return <>{text.slice(0, visibleCount)}</>;
}
