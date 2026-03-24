import { describe, it, expect } from "vitest";
import { generateTitle } from "./titlegen.js";

describe("generateTitle", () => {
  it("returns the first user message as title", () => {
    expect(
      generateTitle([{ role: "user", content: "Fix the login bug" }])
    ).toBe("Fix the login bug");
  });

  it("returns 'Untitled Session' when content is shorter than 10 chars", () => {
    expect(
      generateTitle([{ role: "user", content: "short" }])
    ).toBe("Untitled Session");
  });

  it("truncates messages longer than 80 chars with ellipsis", () => {
    const longMsg =
      "A very long first message that exceeds 80 characters and should be truncated at the first line boundary";
    const result = generateTitle([{ role: "user", content: longMsg }]);
    expect(result.length).toBeLessThanOrEqual(80);
    expect(result).toMatch(/\.\.\.$/);
  });

  it("returns only the first line of multiline content", () => {
    expect(
      generateTitle([
        { role: "user", content: "Line one\nLine two\nLine three" },
      ])
    ).toBe("Line one");
  });

  it("returns 'Untitled Session' when no user message exists", () => {
    expect(
      generateTitle([{ role: "assistant", content: "Hello" }])
    ).toBe("Untitled Session");
  });

  it("returns 'Untitled Session' for empty array", () => {
    expect(generateTitle([])).toBe("Untitled Session");
  });

  it("uses the first user message even if assistant comes first", () => {
    expect(
      generateTitle([
        { role: "assistant", content: "Hi there" },
        { role: "user", content: "Help me with authentication" },
      ])
    ).toBe("Help me with authentication");
  });
});
