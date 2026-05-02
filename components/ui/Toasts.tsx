import { useStore } from "@/state/store";
import { useEffect } from "react";

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((t) => setTimeout(() => dismiss(t.id), 3000));
    return () => timers.forEach(clearTimeout);
  }, [toasts, dismiss]);

  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="rounded-md border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
