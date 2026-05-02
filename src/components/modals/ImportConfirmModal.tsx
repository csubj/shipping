import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/state/store";
import type { AppState } from "@/types/schema";

export function ImportConfirmModal({
  open,
  incoming,
  onOpenChange,
}: {
  open: boolean;
  incoming?: AppState;
  onOpenChange: (open: boolean) => void;
}) {
  const current = useStore((s) => s.state);
  const replace = useStore((s) => s.replaceState);
  const pushToast = useStore((s) => s.pushToast);

  if (!incoming) return null;

  const cur = {
    chars: Object.keys(current.characters).length,
    rels: Object.keys(current.relationships).length,
  };
  const next = {
    chars: Object.keys(incoming.characters).length,
    rels: Object.keys(incoming.relationships).length,
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Replace current campaign?">
      <div className="space-y-3 text-sm">
        <p>This will replace your current campaign data with the imported file.</p>
        <table className="w-full text-sm">
          <thead className="text-[var(--muted)]">
            <tr>
              <th className="text-left">&nbsp;</th>
              <th className="text-right">Current</th>
              <th className="text-right">Incoming</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Campaign</td>
              <td className="text-right">{current.meta.campaignName}</td>
              <td className="text-right">{incoming.meta.campaignName}</td>
            </tr>
            <tr>
              <td>Characters</td>
              <td className="text-right">{cur.chars}</td>
              <td className="text-right">{next.chars}</td>
            </tr>
            <tr>
              <td>Relationships</td>
              <td className="text-right">{cur.rels}</td>
              <td className="text-right">{next.rels}</td>
            </tr>
          </tbody>
        </table>
        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              replace(incoming);
              pushToast("Imported campaign");
              onOpenChange(false);
            }}
          >
            Replace
          </Button>
        </div>
      </div>
    </Modal>
  );
}
