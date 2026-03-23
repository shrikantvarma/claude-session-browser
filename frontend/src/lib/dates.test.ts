import { describe, it, expect } from "vitest";
import { groupByDay, formatRelativeDay, formatDuration } from "./dates";

describe("groupByDay", () => {
  it("groups sessions by date from last_active_at", () => {
    const sessions = [
      { id: "1", last_active_at: "2026-03-23T10:00:00Z" },
      { id: "2", last_active_at: "2026-03-23T08:00:00Z" },
      { id: "3", last_active_at: "2026-03-22T15:00:00Z" },
      { id: "4", last_active_at: "2026-03-20T12:00:00Z" },
    ];

    const grouped = groupByDay(sessions);
    const keys = [...grouped.keys()];

    expect(keys).toEqual(["2026-03-23", "2026-03-22", "2026-03-20"]);
    expect(grouped.get("2026-03-23")).toHaveLength(2);
    expect(grouped.get("2026-03-22")).toHaveLength(1);
    expect(grouped.get("2026-03-20")).toHaveLength(1);
  });

  it("returns empty Map for empty input", () => {
    const grouped = groupByDay([]);
    expect(grouped.size).toBe(0);
  });

  it("preserves insertion order (most recent first if input sorted)", () => {
    const sessions = [
      { id: "1", last_active_at: "2026-03-23T10:00:00Z" },
      { id: "2", last_active_at: "2026-03-21T10:00:00Z" },
      { id: "3", last_active_at: "2026-03-19T10:00:00Z" },
    ];

    const keys = [...groupByDay(sessions).keys()];
    expect(keys).toEqual(["2026-03-23", "2026-03-21", "2026-03-19"]);
  });
});

describe("formatRelativeDay", () => {
  it("returns 'Today' for today's date", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(formatRelativeDay(today)).toBe("Today");
  });

  it("returns 'Yesterday' for yesterday's date", () => {
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);
    expect(formatRelativeDay(yesterday)).toBe("Yesterday");
  });

  it("returns formatted date string for older dates", () => {
    const result = formatRelativeDay("2026-03-20");
    // Should contain day name and date like "Friday, Mar 20"
    expect(result).toMatch(/\w+, \w+ \d+/);
  });
});

describe("formatDuration", () => {
  it("formats hours and minutes", () => {
    expect(formatDuration(2 * 3600000 + 15 * 60000)).toBe("2h 15m");
  });

  it("formats minutes only", () => {
    expect(formatDuration(5 * 60000)).toBe("5m");
  });

  it("formats short sessions as <1m", () => {
    expect(formatDuration(30000)).toBe("<1m");
  });

  it("formats zero duration", () => {
    expect(formatDuration(0)).toBe("<1m");
  });
});
