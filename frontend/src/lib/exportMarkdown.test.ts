import { describe, it, expect } from "vitest";
import { exportAsMarkdown } from "./exportMarkdown";
import type { SessionRow, MessageRow } from "../api/types";

const session: SessionRow = {
  id: "abc123-def456",
  project_path: "/home/user/my-project",
  project_dir: "home-user-my-project",
  project_name: "my-project",
  started_at: "2026-03-23T10:00:00Z",
  last_active_at: "2026-03-23T11:30:00Z",
  duration_ms: 5400000,
  message_count: 4,
  model: "claude-sonnet-4-20250514",
  cwd: "/home/user/my-project",
  git_branch: "main",
};

const messages: MessageRow[] = [
  {
    uuid: "msg-1",
    session_id: "abc123-def456",
    parent_uuid: null,
    role: "user",
    content: "Hello, how do I sort an array?",
    timestamp: "2026-03-23T10:00:00Z",
    model: null,
  },
  {
    uuid: "msg-2",
    session_id: "abc123-def456",
    parent_uuid: "msg-1",
    role: "assistant",
    content: "You can use `array.sort()` in JavaScript.",
    timestamp: "2026-03-23T10:01:00Z",
    model: "claude-sonnet-4-20250514",
  },
];

describe("exportAsMarkdown", () => {
  it("starts with project name as heading", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md.startsWith("# my-project")).toBe(true);
  });

  it("includes project path in metadata", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("/home/user/my-project");
  });

  it("includes date in metadata", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("2026-03-23");
  });

  it("includes message count in metadata", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("4 messages");
  });

  it("has '### You' header for user messages", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("### You");
  });

  it("has '### Claude' header for assistant messages", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("### Claude");
  });

  it("includes message content verbatim", () => {
    const md = exportAsMarkdown(session, messages);
    expect(md).toContain("Hello, how do I sort an array?");
    expect(md).toContain("You can use `array.sort()` in JavaScript.");
  });

  it("returns a valid string", () => {
    const md = exportAsMarkdown(session, messages);
    expect(typeof md).toBe("string");
    expect(md.length).toBeGreaterThan(0);
  });

  it("handles empty messages array", () => {
    const md = exportAsMarkdown(session, []);
    expect(md).toContain("# my-project");
    expect(typeof md).toBe("string");
  });
});
