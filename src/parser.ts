import { readdir, readFile, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createInterface } from "node:readline";
import { join, basename } from "node:path";
import { homedir } from "node:os";
import type { Session, Message, ParsedLine } from "./types.js";

/**
 * Convert a dash-encoded directory name back to an absolute path.
 * The encoding replaces `/` with `-` and prepends a leading `-`.
 * Example: "-Users-shrikantvarma-Code-foo" -> "/Users/shrikantvarma/Code/foo"
 */
export function decodePath(dirName: string): string {
  // Remove the leading dash, then replace all remaining dashes with /
  const withoutLeadingDash = dirName.slice(1);
  if (withoutLeadingDash === "") return "/";
  return "/" + withoutLeadingDash.replaceAll("-", "/");
}

/**
 * Discover all JSONL session files under the Claude projects directory.
 * Skips subdirectories like subagents/.
 */
export async function discoverSessions(
  claudeDir?: string
): Promise<Array<{ filePath: string; projectDir: string; sessionId: string }>> {
  const baseDir = claudeDir ?? join(homedir(), ".claude", "projects");

  let projectDirs: string[];
  try {
    const entries = await readdir(baseDir, { withFileTypes: true });
    projectDirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }

  const results: Array<{ filePath: string; projectDir: string; sessionId: string }> = [];

  for (const projectDir of projectDirs) {
    const projPath = join(baseDir, projectDir);
    let files: string[];
    try {
      const entries = await readdir(projPath, { withFileTypes: true });
      files = entries
        .filter((e) => e.isFile() && e.name.endsWith(".jsonl"))
        .map((e) => e.name);
    } catch {
      continue;
    }

    for (const file of files) {
      const sessionId = file.replace(/\.jsonl$/, "");
      results.push({
        filePath: join(projPath, file),
        projectDir,
        sessionId,
      });
    }
  }

  return results;
}

/**
 * Extract text content from a message's content field.
 * User messages have content as a string.
 * Assistant messages have content as an array of {type, text} objects.
 */
function extractContent(content: string | Array<{ type: string; text?: string }>): string {
  if (typeof content === "string") {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .filter((item) => item.type === "text" && item.text)
      .map((item) => item.text!)
      .join("");
  }
  return "";
}

/**
 * Parse a single JSONL session file into structured Session + Message data.
 */
export async function parseSessionFile(
  filePath: string,
  projectDir: string
): Promise<{ session: Session; messages: Message[] }> {
  const messages: Message[] = [];
  let firstUserCwd = "";
  let firstUserGitBranch: string | null = null;
  let firstAssistantModel: string | null = null;
  let sessionId = basename(filePath, ".jsonl");

  const rl = createInterface({
    input: createReadStream(filePath),
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    if (!line.trim()) continue;

    let parsed: ParsedLine;
    try {
      parsed = JSON.parse(line);
    } catch {
      // Skip malformed lines
      continue;
    }

    // Skip non-conversation types
    if (parsed.type !== "user" && parsed.type !== "assistant") {
      continue;
    }

    // Capture sessionId from data
    if (parsed.sessionId) {
      sessionId = parsed.sessionId;
    }

    const role = parsed.type as "user" | "assistant";
    const content = parsed.message
      ? extractContent(parsed.message.content)
      : "";

    // Extract metadata from first user message
    if (role === "user" && !firstUserCwd && parsed.cwd) {
      firstUserCwd = parsed.cwd;
      firstUserGitBranch = parsed.gitBranch ?? null;
    }

    // Extract model from first assistant message
    if (role === "assistant" && !firstAssistantModel && parsed.message?.model) {
      firstAssistantModel = parsed.message.model;
    }

    messages.push({
      uuid: parsed.uuid ?? crypto.randomUUID(),
      sessionId,
      parentUuid: parsed.parentUuid ?? null,
      role,
      content,
      timestamp: parsed.timestamp,
      model: role === "assistant" ? (parsed.message?.model ?? null) : null,
    });
  }

  // Sort messages by timestamp
  messages.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const startedAt = messages.length > 0 ? messages[0].timestamp : "";
  const lastActiveAt = messages.length > 0 ? messages[messages.length - 1].timestamp : "";
  const durationMs =
    startedAt && lastActiveAt
      ? new Date(lastActiveAt).getTime() - new Date(startedAt).getTime()
      : 0;

  const session: Session = {
    id: sessionId,
    projectPath: decodePath(projectDir),
    projectDir,
    startedAt,
    lastActiveAt,
    durationMs,
    messageCount: messages.length,
    model: firstAssistantModel,
    cwd: firstUserCwd,
    gitBranch: firstUserGitBranch,
  };

  return { session, messages };
}
