import { useState, useEffect, useCallback } from "react";

interface UseKeyboardNavigationOptions {
  itemCount: number;
  onSelect: (index: number) => void;
  onSearch: () => void;
  onBack: () => void;
}

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardNavigation({
  itemCount,
  onSelect,
  onSearch,
  onBack,
}: UseKeyboardNavigationOptions) {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tagName = target?.tagName ?? "";

      // Escape always works -- blurs active input if in a form field
      if (e.key === "Escape") {
        if (IGNORED_TAGS.has(tagName) && target) {
          target.blur();
        }
        onBack();
        return;
      }

      // All other shortcuts are ignored when typing in form fields
      if (IGNORED_TAGS.has(tagName)) {
        return;
      }

      switch (e.key) {
        case "j":
          setFocusedIndex((prev) => Math.min(prev + 1, itemCount - 1));
          break;
        case "k":
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          setFocusedIndex((current) => {
            if (current >= 0) {
              onSelect(current);
            }
            return current;
          });
          break;
        case "/":
          e.preventDefault();
          onSearch();
          break;
      }
    },
    [itemCount, onSelect, onSearch, onBack],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { focusedIndex, setFocusedIndex };
}
