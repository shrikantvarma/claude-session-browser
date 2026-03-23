import { useSessions } from "../api/queries";
import { groupByDay, formatRelativeDay } from "../lib/dates";
import { SessionCard } from "./SessionCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function SessionList() {
  const { data, isLoading, error } = useSessions({ limit: 100 });

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <EmptyState
        title="Failed to load sessions"
        description={error.message}
      />
    );
  }

  const sessions = data?.sessions ?? [];

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No sessions found"
        description="Claude Code sessions will appear here once indexed."
      />
    );
  }

  const grouped = groupByDay(sessions);

  return (
    <div className="mx-auto max-w-3xl">
      {[...grouped.entries()].map(([dayKey, daySessions]) => (
        <div key={dayKey}>
          <div className="sticky top-0 z-10 bg-bg-secondary px-6 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
            {formatRelativeDay(dayKey)}
          </div>
          {daySessions.map((session) => (
            <SessionCard key={session.id} session={session} />
          ))}
        </div>
      ))}
    </div>
  );
}
