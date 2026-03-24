import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodePath, discoverSessions, parseSessionFile } from "./parser.js";

describe("decodePath", () => {
  it("converts dash-encoded dir name back to absolute path", () => {
    expect(decodePath("-home-user-projects-foo")).toBe(
      "/home/user/projects/foo"
    );
  });

  it("handles single-level path", () => {
    expect(decodePath("-tmp")).toBe("/tmp");
  });

  it("handles root-level dash-encoded name", () => {
    expect(decodePath("-")).toBe("/");
  });
});

describe("discoverSessions", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "parser-test-"));
    // Create project directories with JSONL files
    const projDir = join(tmpDir, "-Users-test-Code-myproject");
    mkdirSync(projDir);
    writeFileSync(
      join(projDir, "abc-123.jsonl"),
      '{"type":"user","sessionId":"abc-123","timestamp":"2024-01-01T00:00:00Z","message":{"role":"user","content":"hello"}}\n'
    );
    writeFileSync(
      join(projDir, "def-456.jsonl"),
      '{"type":"user","sessionId":"def-456","timestamp":"2024-01-01T00:00:00Z","message":{"role":"user","content":"hi"}}\n'
    );

    // Create subagents directory (should be skipped)
    const subagentDir = join(projDir, "subagents");
    mkdirSync(subagentDir);
    writeFileSync(
      join(subagentDir, "sub-789.jsonl"),
      '{"type":"user","sessionId":"sub-789","timestamp":"2024-01-01T00:00:00Z","message":{"role":"user","content":"subagent"}}\n'
    );
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds .jsonl files in project directories", async () => {
    const sessions = await discoverSessions(tmpDir);
    expect(sessions.length).toBe(2);
    expect(sessions.every((s) => s.filePath.endsWith(".jsonl"))).toBe(true);
  });

  it("returns correct projectDir and sessionId", async () => {
    const sessions = await discoverSessions(tmpDir);
    const sorted = sessions.sort((a, b) => a.sessionId.localeCompare(b.sessionId));
    expect(sorted[0].projectDir).toBe("-Users-test-Code-myproject");
    expect(sorted[0].sessionId).toBe("abc-123");
    expect(sorted[1].sessionId).toBe("def-456");
  });

  it("skips subagent subdirectories", async () => {
    const sessions = await discoverSessions(tmpDir);
    expect(sessions.every((s) => !s.sessionId.includes("sub-789"))).toBe(true);
  });

  it("returns empty array for nonexistent directory", async () => {
    const sessions = await discoverSessions("/nonexistent/path");
    expect(sessions).toEqual([]);
  });
});

describe("parseSessionFile", () => {
  let tmpDir: string;
  let filePath: string;
  const projectDir = "-Users-test-Code-myproject";

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), "parser-test-"));
    filePath = join(tmpDir, "session-001.jsonl");
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it("extracts session metadata from user and assistant messages", async () => {
    const lines = [
      JSON.stringify({
        type: "user",
        sessionId: "session-001",
        timestamp: "2024-06-01T10:00:00Z",
        uuid: "u1",
        parentUuid: null,
        cwd: "/Users/test/Code/myproject",
        gitBranch: "main",
        message: { role: "user", content: "What is TypeScript?" },
      }),
      JSON.stringify({
        type: "assistant",
        sessionId: "session-001",
        timestamp: "2024-06-01T10:01:00Z",
        uuid: "a1",
        parentUuid: "u1",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "TypeScript is a typed superset of JavaScript." }],
          model: "claude-sonnet-4-20250514",
          usage: { input_tokens: 10, output_tokens: 50 },
        },
      }),
    ];
    writeFileSync(filePath, lines.join("\n") + "\n");

    const result = await parseSessionFile(filePath, projectDir);
    expect(result.session.id).toBe("session-001");
    expect(result.session.projectPath).toBe("/Users/test/Code/myproject");
    expect(result.session.cwd).toBe("/Users/test/Code/myproject");
    expect(result.session.gitBranch).toBe("main");
    expect(result.session.model).toBe("claude-sonnet-4-20250514");
    expect(result.session.messageCount).toBe(2);
    expect(result.session.durationMs).toBe(60000);
    expect(result.messages.length).toBe(2);
  });

  it("extracts text content from assistant messages (array format)", async () => {
    const lines = [
      JSON.stringify({
        type: "user",
        sessionId: "s1",
        timestamp: "2024-06-01T10:00:00Z",
        uuid: "u1",
        message: { role: "user", content: "hello" },
      }),
      JSON.stringify({
        type: "assistant",
        sessionId: "s1",
        timestamp: "2024-06-01T10:01:00Z",
        uuid: "a1",
        parentUuid: "u1",
        message: {
          role: "assistant",
          content: [
            { type: "text", text: "Part 1. " },
            { type: "tool_use", id: "tool1" },
            { type: "text", text: "Part 2." },
          ],
          model: "claude-sonnet-4-20250514",
        },
      }),
    ];
    writeFileSync(filePath, lines.join("\n") + "\n");

    const result = await parseSessionFile(filePath, projectDir);
    expect(result.messages[1].content).toBe("Part 1. Part 2.");
  });

  it("skips queue-operation and file-history-snapshot lines", async () => {
    const lines = [
      JSON.stringify({
        type: "user",
        sessionId: "s1",
        timestamp: "2024-06-01T10:00:00Z",
        uuid: "u1",
        message: { role: "user", content: "hello" },
      }),
      JSON.stringify({
        type: "queue-operation",
        sessionId: "s1",
        timestamp: "2024-06-01T10:00:30Z",
      }),
      JSON.stringify({
        type: "file-history-snapshot",
        sessionId: "s1",
        timestamp: "2024-06-01T10:00:45Z",
      }),
      JSON.stringify({
        type: "assistant",
        sessionId: "s1",
        timestamp: "2024-06-01T10:01:00Z",
        uuid: "a1",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "hi" }],
          model: "claude-sonnet-4-20250514",
        },
      }),
    ];
    writeFileSync(filePath, lines.join("\n") + "\n");

    const result = await parseSessionFile(filePath, projectDir);
    expect(result.session.messageCount).toBe(2);
    expect(result.messages.length).toBe(2);
  });

  it("skips malformed lines without throwing", async () => {
    const lines = [
      "this is not json",
      '{"type":"user","sessionId":"s1","timestamp":"2024-06-01T10:00:00Z","uuid":"u1","message":{"role":"user","content":"hello"}}',
      "{broken json here",
      '{"type":"assistant","sessionId":"s1","timestamp":"2024-06-01T10:01:00Z","uuid":"a1","message":{"role":"assistant","content":[{"type":"text","text":"world"}],"model":"claude-sonnet-4-20250514"}}',
    ];
    writeFileSync(filePath, lines.join("\n") + "\n");

    const result = await parseSessionFile(filePath, projectDir);
    expect(result.session.messageCount).toBe(2);
    expect(result.messages.length).toBe(2);
  });
});
