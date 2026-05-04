import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { DegradeConfirmModal } from "@/components/modals/DegradeConfirmModal";
import { useStore } from "@/state/store";
import { emptyState } from "@/types/schema";

beforeEach(() => {
  cleanup();
  useStore.getState().resetState();
});

describe("DegradeConfirmModal", () => {
  it("shows the count of non-zero relationships", () => {
    const next = emptyState();
    next.characters["a"] = { id: "a", kind: "pc", firstName: "A", lastName: "X", class: "F", notes: "", factionIds: [] };
    next.characters["b"] = { id: "b", kind: "pc", firstName: "B", lastName: "Y", class: "F", notes: "", factionIds: [] };
    next.relationships["a::b"] = { id: "a::b", a: "a", b: "b", value: 5, notes: "", history: [] };
    useStore.getState().replaceState(next);

    render(<DegradeConfirmModal open={true} onOpenChange={() => {}} />);
    expect(screen.getByText("1", { selector: "strong" })).toBeInTheDocument();
  });

  it("applies degrade on confirm", () => {
    const next = emptyState();
    next.characters["a"] = { id: "a", kind: "pc", firstName: "A", lastName: "X", class: "F", notes: "", factionIds: [] };
    next.characters["b"] = { id: "b", kind: "pc", firstName: "B", lastName: "Y", class: "F", notes: "", factionIds: [] };
    next.relationships["a::b"] = { id: "a::b", a: "a", b: "b", value: 5, notes: "", history: [] };
    useStore.getState().replaceState(next);

    render(<DegradeConfirmModal open={true} onOpenChange={() => {}} />);
    fireEvent.click(screen.getByText("Confirm"));
    expect(useStore.getState().state.relationships["a::b"].value).toBe(4);
  });
});
