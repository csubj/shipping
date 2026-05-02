import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { CharacterEditor } from "@/components/editors/CharacterEditor";
import { useStore } from "@/state/store";

beforeEach(() => {
  cleanup();
  useStore.getState().resetState();
});

describe("CharacterEditor", () => {
  it("creates a new PC on save", () => {
    render(
      <CharacterEditor
        open={true}
        initialKind="pc"
        onOpenChange={() => {}}
      />,
    );
    const inputs = screen.getAllByRole("textbox");
    fireEvent.change(inputs[0], { target: { value: "Test" } });
    fireEvent.change(inputs[1], { target: { value: "Person" } });
    fireEvent.click(screen.getByText("Save"));
    const chars = Object.values(useStore.getState().state.characters);
    expect(chars).toHaveLength(1);
    expect(chars[0].firstName).toBe("Test");
    expect(chars[0].kind).toBe("pc");
  });
});
