import type { AppState } from "@/types/schema";

export function serializeState(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

export function downloadStateAsJson(state: AppState): void {
  const json = serializeState(state);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);
  const safeName = state.meta.campaignName.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
  const a = document.createElement("a");
  a.href = url;
  a.download = `shipping-${safeName || "campaign"}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
