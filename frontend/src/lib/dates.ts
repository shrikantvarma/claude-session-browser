/**
 * Groups sessions by date string (YYYY-MM-DD) derived from last_active_at.
 * Returns a Map with keys in insertion order (most recent first if input is sorted).
 */
export function groupByDay<T extends { last_active_at: string }>(
  sessions: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();

  for (const session of sessions) {
    const dayKey = session.last_active_at.slice(0, 10);
    const existing = map.get(dayKey);
    if (existing) {
      existing.push(session);
    } else {
      map.set(dayKey, [session]);
    }
  }

  return map;
}

/**
 * Returns "Today", "Yesterday", or a formatted date string like "Friday, Mar 20".
 */
export function formatRelativeDay(dateStr: string): string {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  if (dateStr === todayStr) return "Today";

  const yesterday = new Date(today.getTime() - 86400000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (dateStr === yesterdayStr) return "Yesterday";

  const date = new Date(dateStr + "T00:00:00");
  const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();

  return `${dayName}, ${month} ${day}`;
}

/**
 * Formats milliseconds into a human-readable duration like "2h 15m" or "5m".
 */
export function formatDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);

  if (totalMinutes < 1) return "<1m";

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
}
