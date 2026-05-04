import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useStore } from "@/state/store";

export function DegradeConfirmModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const defaultAmount = useStore((s) => s.state.settings.degrade.amount);
  const relCount = useStore(
    (s) =>
      Object.values(s.state.relationships).filter(
        (r) => r.value !== 0 && r.value > -10 && r.value < 10,
      ).length,
  );
  const apply = useStore((s) => s.applyDegradeAll);
  const pushToast = useStore((s) => s.pushToast);

  const [amount, setAmount] = useState(defaultAmount);
  useEffect(() => {
    if (open) setAmount(defaultAmount);
  }, [open, defaultAmount]);

  const onConfirm = () => {
    const { degraded, deleted } = apply(amount);
    const parts: string[] = [];
    if (degraded > 0) parts.push(`degraded ${degraded}`);
    if (deleted > 0) parts.push(`removed ${deleted}`);
    pushToast(parts.length > 0 ? `${parts.join(", ")} relationship${degraded + deleted !== 1 ? "s" : ""}` : "No relationships changed");
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Time Passes…">
      <div className="space-y-3 text-sm">
        <p>
          Decrease all <strong>{relCount}</strong> non-neutral relationships by{" "}
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
            className="inline-block w-20 align-baseline"
          />{" "}
          toward neutral. Relationships that reach 0 will be deleted.
        </p>
        <p className="text-xs text-[var(--muted)]">
          Only relationships with a value strictly between −10 and 10 are
          affected. Stronger relationships (|value| ≥ 10) are considered
          entrenched and will not degrade. Relationships that degrade to
          exactly 0 are removed entirely.
        </p>
        <p className="text-xs text-[var(--muted)]">
          (This does not change the permanent default in Settings.)
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="primary" onClick={onConfirm}>Confirm</Button>
        </div>
      </div>
    </Modal>
  );
}
