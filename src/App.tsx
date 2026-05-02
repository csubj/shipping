import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { GraphView } from "@/components/graph/GraphView";
import { TableView } from "@/components/table/TableView";
import { FactionsView } from "@/components/FactionsView";
import { Settings } from "@/components/Settings";
import { useHashRoute, type RouteName } from "@/hooks/useHashRoute";
import { useStore } from "@/state/store";
import { Toasts } from "@/components/ui/Toasts";
import { CharacterEditor } from "@/components/editors/CharacterEditor";
import { RelationshipEditor } from "@/components/editors/RelationshipEditor";
import { DegradeConfirmModal } from "@/components/modals/DegradeConfirmModal";
import { PropagationPreviewModal } from "@/components/modals/PropagationPreviewModal";
import { ImportConfirmModal } from "@/components/modals/ImportConfirmModal";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { downloadStateAsJson } from "@/io/export";
import { parseAndValidate, pickJsonFile } from "@/io/import";
import type { AppState } from "@/types/schema";

export type ModalsState = {
  characterEditor: { open: boolean; characterId?: string; initialKind?: "pc" | "npc" };
  relationshipEditor: { open: boolean; relationshipId?: string; aId?: string; bId?: string };
  degradeConfirm: boolean;
  importConfirm: { open: boolean; incoming?: AppState };
};

export function App() {
  const [route, navigate] = useHashRoute();
  const state = useStore((s) => s.state);
  const pendingPropagation = useStore((s) => s.pendingPropagation);
  const pushToast = useStore((s) => s.pushToast);
  const replaceState = useStore((s) => s.replaceState);

  const [modals, setModals] = useState<ModalsState>({
    characterEditor: { open: false },
    relationshipEditor: { open: false },
    degradeConfirm: false,
    importConfirm: { open: false },
  });

  const openCharacterEditor = (characterId?: string, initialKind: "pc" | "npc" = "pc") =>
    setModals((m) => ({ ...m, characterEditor: { open: true, characterId, initialKind } }));

  const openRelationshipEditor = (relationshipId?: string, aId?: string, bId?: string) =>
    setModals((m) => ({
      ...m,
      relationshipEditor: { open: true, relationshipId, aId, bId },
    }));

  const handleExport = () => {
    downloadStateAsJson(state);
    pushToast("Exported campaign JSON");
  };

  const handleImport = async () => {
    const text = await pickJsonFile();
    if (!text) return;
    try {
      const incoming = await parseAndValidate(text);
      const empty =
        Object.keys(state.characters).length === 0 &&
        Object.keys(state.relationships).length === 0;
      if (empty) {
        replaceState(incoming);
        pushToast("Imported campaign");
      } else {
        setModals((m) => ({ ...m, importConfirm: { open: true, incoming } }));
      }
    } catch (err) {
      pushToast(`Import failed: ${(err as Error).message}`);
    }
  };

  useGlobalShortcuts({
    g: () => navigate("graph"),
    t: () => navigate("table"),
    f: () => navigate("factions"),
    s: () => navigate("settings"),
    n: () => openCharacterEditor(),
    r: () => openRelationshipEditor(),
    d: () => setModals((m) => ({ ...m, degradeConfirm: true })),
    e: () => handleExport(),
    i: () => handleImport(),
  });

  const renderRoute = (r: RouteName) => {
    switch (r) {
      case "graph":
        return (
          <GraphView
            onEditRelationship={openRelationshipEditor}
            onEditCharacter={(id) => openCharacterEditor(id)}
          />
        );
      case "table":
        return (
          <TableView
            onEditCharacter={openCharacterEditor}
            onEditRelationship={openRelationshipEditor}
            onOpenInGraph={(_id) => navigate("graph")}
          />
        );
      case "factions":
        return <FactionsView />;
      case "settings":
        return <Settings />;
    }
  };

  return (
    <>
      <AppShell
        route={route}
        navigate={navigate}
        onAddPC={() => openCharacterEditor(undefined, "pc")}
        onAddNPC={() => openCharacterEditor(undefined, "npc")}
        onAddRelationship={() => openRelationshipEditor()}
        onDegradeAll={() => setModals((m) => ({ ...m, degradeConfirm: true }))}
        onImport={handleImport}
        onExport={handleExport}
      >
        {renderRoute(route)}
      </AppShell>

      <CharacterEditor
        open={modals.characterEditor.open}
        characterId={modals.characterEditor.characterId}
        initialKind={modals.characterEditor.initialKind ?? "pc"}
        onOpenChange={(open) =>
          setModals((m) => ({ ...m, characterEditor: { ...m.characterEditor, open } }))
        }
      />
      <RelationshipEditor
        open={modals.relationshipEditor.open}
        relationshipId={modals.relationshipEditor.relationshipId}
        aId={modals.relationshipEditor.aId}
        bId={modals.relationshipEditor.bId}
        onOpenChange={(open) =>
          setModals((m) => ({
            ...m,
            relationshipEditor: { ...m.relationshipEditor, open },
          }))
        }
      />
      <DegradeConfirmModal
        open={modals.degradeConfirm}
        onOpenChange={(open) => setModals((m) => ({ ...m, degradeConfirm: open }))}
      />
      <PropagationPreviewModal
        open={!!pendingPropagation}
      />
      <ImportConfirmModal
        open={modals.importConfirm.open}
        incoming={modals.importConfirm.incoming}
        onOpenChange={(open) =>
          setModals((m) => ({ ...m, importConfirm: { open, incoming: m.importConfirm.incoming } }))
        }
      />

      <Toasts />
    </>
  );
}
