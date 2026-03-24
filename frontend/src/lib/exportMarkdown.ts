import type { SessionRow, MessageRow } from "../api/types";

export function exportAsMarkdown(
  session: SessionRow,
  messages: MessageRow[],
): string {
  const date = session.started_at.slice(0, 10);
  const lines: string[] = [
    `# ${session.project_name}`,
    "",
    `- **Project:** ${session.project_path}`,
    `- **Date:** ${date}`,
    `- **Messages:** ${session.message_count} messages`,
    session.model ? `- **Model:** ${session.model}` : "",
    session.git_branch ? `- **Branch:** ${session.git_branch}` : "",
    "",
    "---",
    "",
  ];

  for (const msg of messages) {
    const speaker = msg.role === "user" ? "You" : "Claude";
    lines.push(`### ${speaker}`, "", msg.content, "");
  }

  return lines.filter((line, i, arr) => {
    // Remove consecutive empty lines beyond 1, but keep the structure
    if (line === "" && i > 0 && arr[i - 1] === "") return false;
    return true;
  }).join("\n");
}

export function downloadMarkdown(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
