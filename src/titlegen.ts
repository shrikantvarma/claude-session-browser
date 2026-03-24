/**
 * Generate a display title from session messages.
 * Uses the first user message content, with truncation for long messages.
 */
export function generateTitle(
  messages: { role: string; content: string }[]
): string {
  const firstUser = messages.find((m) => m.role === "user");

  if (!firstUser) {
    return "Untitled Session";
  }

  const trimmed = firstUser.content.trim();

  if (trimmed.length < 10) {
    return "Untitled Session";
  }

  // Take only the first line
  const firstLine = trimmed.split("\n")[0].trim();

  if (firstLine.length <= 80) {
    return firstLine;
  }

  // Truncate to 77 chars + "..."
  return firstLine.slice(0, 77) + "...";
}
