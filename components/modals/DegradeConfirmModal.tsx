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
    (s) => Object.values(s.state.relationships).filter((r) => r.value !== 0).length,
  );
  const apply = useStore((s) => s.applyDegradeAll);
  const pushToast = useStore((s) => s.pushToast);

  const [amount, setAmount] = useState(defaultAmount);
  useEffect(() => {
    if (open) setAmount(defaultAmount);
  }, [open, defaultAmount]);

  const onConfirm = () => {
    const n = apply(amount);
    pushToast(`Degraded ${n} relationships toward neutral`);
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
          toward neutral. Relationships already at 0 will not change.
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
