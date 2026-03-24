import { useState, useMemo } from "react";
import { useSessions } from "../api/queries";
import { groupByDay, formatRelativeDay } from "../lib/dates";
import { SessionCard } from "./SessionCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";

export function SessionList() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);

  const { data, isLoading, error } = useSessions({
    limit: 100,
    project: selectedProject ?? undefined,
  });

  const sessions = data?.sessions ?? [];

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (dateStart && s.last_active_at < dateStart) return false;
      if (dateEnd && s.last_active_at > dateEnd + "T23:59:59") return false;
      return true;
    });
  }, [sessions, dateStart, dateEnd]);

  if (isLoading) return <LoadingSpinner />;

  if (error) {
    return (
      <EmptyState
        title="Failed to load sessions"
        description={error.message}
      />
    );
  }

  const hasRawData = sessions.length > 0;
  const grouped = groupByDay(filteredSessions);

  function handleDateRangeChange(start: string | null, end: string | null) {
    setDateStart(start);
    setDateEnd(end);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="px-6 py-4">
        <FilterBar
          onProjectChange={setSelectedProject}
          onDateRangeChange={handleDateRangeChange}
          selectedProject={selectedProject}
          dateStart={dateStart}
          dateEnd={dateEnd}
        />
      </div>

      {filteredSessions.length === 0 ? (
        <EmptyState
          title={hasRawData ? "No sessions match your filters" : "No sessions found"}
          description={hasRawData ? "Try adjusting the filters above." : "Claude Code sessions will appear here once indexed."}
        />
      ) : (
        [...grouped.entries()].map(([dayKey, daySessions]) => (
          <div key={dayKey}>
            <div className="sticky top-0 z-10 bg-bg-secondary px-6 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
              {formatRelativeDay(dayKey)}
            </div>
            {daySessions.map((session) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ))
      )}
    </div>
  );
}
