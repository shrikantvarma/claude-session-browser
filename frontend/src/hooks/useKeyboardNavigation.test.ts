import { describe, it, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useKeyboardNavigation } from "./useKeyboardNavigation";

function fireKey(key: string, target?: EventTarget | null) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  if (target) {
    Object.defineProperty(event, "target", { value: target });
  }
  document.dispatchEvent(event);
}

describe("useKeyboardNavigation", () => {
  const defaultOpts = {
    itemCount: 5,
    onSelect: vi.fn(),
    onSearch: vi.fn(),
    onBack: vi.fn(),
  };

  it("starts with focusedIndex at -1", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    expect(result.current.focusedIndex).toBe(-1);
  });

  it("increments focusedIndex on j key", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    act(() => fireKey("j"));
    expect(result.current.focusedIndex).toBe(0);
    act(() => fireKey("j"));
    expect(result.current.focusedIndex).toBe(1);
  });

  it("caps focusedIndex at itemCount - 1", () => {
    const opts = { ...defaultOpts, itemCount: 2 };
    const { result } = renderHook(() => useKeyboardNavigation(opts));
    act(() => fireKey("j"));
    act(() => fireKey("j"));
    act(() => fireKey("j"));
    expect(result.current.focusedIndex).toBe(1);
  });

  it("decrements focusedIndex on k key", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    act(() => fireKey("j"));
    act(() => fireKey("j"));
    act(() => fireKey("k"));
    expect(result.current.focusedIndex).toBe(0);
  });

  it("does not decrement focusedIndex below 0", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    act(() => fireKey("j")); // 0
    act(() => fireKey("k")); // try to go below 0
    expect(result.current.focusedIndex).toBe(0);
  });

  it("calls onSelect with focusedIndex on Enter", () => {
    const onSelect = vi.fn();
    const opts = { ...defaultOpts, onSelect };
    const { result } = renderHook(() => useKeyboardNavigation(opts));
    act(() => fireKey("j"));
    act(() => fireKey("j"));
    act(() => fireKey("Enter"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("does not call onSelect on Enter when focusedIndex is -1", () => {
    const onSelect = vi.fn();
    const opts = { ...defaultOpts, onSelect };
    renderHook(() => useKeyboardNavigation(opts));
    act(() => fireKey("Enter"));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("calls onSearch on / key", () => {
    const onSearch = vi.fn();
    const opts = { ...defaultOpts, onSearch };
    renderHook(() => useKeyboardNavigation(opts));
    act(() => fireKey("/"));
    expect(onSearch).toHaveBeenCalled();
  });

  it("calls onBack on Escape key", () => {
    const onBack = vi.fn();
    const opts = { ...defaultOpts, onBack };
    renderHook(() => useKeyboardNavigation(opts));
    act(() => fireKey("Escape"));
    expect(onBack).toHaveBeenCalled();
  });

  it("ignores keys when target is an INPUT element", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    const input = document.createElement("input");
    act(() => fireKey("j", input));
    expect(result.current.focusedIndex).toBe(-1);
  });

  it("ignores keys when target is a TEXTAREA element", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    const textarea = document.createElement("textarea");
    act(() => fireKey("j", textarea));
    expect(result.current.focusedIndex).toBe(-1);
  });

  it("ignores keys when target is a SELECT element", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    const select = document.createElement("select");
    act(() => fireKey("j", select));
    expect(result.current.focusedIndex).toBe(-1);
  });

  it("allows Escape even when target is an INPUT (blurs it)", () => {
    const onBack = vi.fn();
    const opts = { ...defaultOpts, onBack };
    renderHook(() => useKeyboardNavigation(opts));
    const input = document.createElement("input");
    input.blur = vi.fn();
    document.body.appendChild(input);
    act(() => fireKey("Escape", input));
    expect(input.blur).toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("allows setFocusedIndex to manually set the index", () => {
    const { result } = renderHook(() => useKeyboardNavigation(defaultOpts));
    act(() => result.current.setFocusedIndex(3));
    expect(result.current.focusedIndex).toBe(3);
  });
});
