import { useState, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { useSessions, useUpdateSession } from "../api/queries";
import { groupByDay, formatRelativeDay } from "../lib/dates";
import { useKeyboardNavigation } from "../hooks/useKeyboardNavigation";
import { SessionCard } from "./SessionCard";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { FilterBar } from "./FilterBar";
import type { SessionRow } from "../api/types";

function PinToggle({ session }: { session: SessionRow }) {
  const mutation = useUpdateSession(session.id);
  return (
    <SessionCard
      session={session}
      onPin={(pinned) => mutation.mutate({ is_pinned: pinned })}
    />
  );
}

function PinToggleWithFocus({
  session,
  isFocused,
}: {
  session: SessionRow;
  isFocused: boolean;
}) {
  const mutation = useUpdateSession(session.id);
  return (
    <SessionCard
      session={session}
      isFocused={isFocused}
      onPin={(pinned) => mutation.mutate({ is_pinned: pinned })}
    />
  );
}

export function SessionList() {
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [dateStart, setDateStart] = useState<string | null>(null);
  const [dateEnd, setDateEnd] = useState<string | null>(null);
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  const pinned = useMemo(
    () => filteredSessions.filter((s) => s.is_pinned === 1),
    [filteredSessions],
  );

  const unpinned = useMemo(
    () => filteredSessions.filter((s) => s.is_pinned !== 1),
    [filteredSessions],
  );

  // Build flat array for keyboard navigation: pinned first, then unpinned
  const flatSessions = useMemo(
    () => [...pinned, ...unpinned],
    [pinned, unpinned],
  );

  const onSelect = useCallback(
    (index: number) => {
      const session = flatSessions[index];
      if (session) {
        void navigate(`/session/${session.id}`);
      }
    },
    [flatSessions, navigate],
  );

  const onSearch = useCallback(() => {
    // Focus the search input in the header via DOM query
    const input = document.querySelector<HTMLInputElement>(
      'header input[type="text"]',
    );
    if (input) {
      input.focus();
    }
  }, []);

  const onBack = useCallback(() => {
    // No-op on list view
  }, []);

  const { focusedIndex } = useKeyboardNavigation({
    itemCount: flatSessions.length,
    onSelect,
    onSearch,
    onBack,
  });

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
  const grouped = groupByDay(unpinned);

  function handleDateRangeChange(start: string | null, end: string | null) {
    setDateStart(start);
    setDateEnd(end);
  }

  // Calculate flat index offset: pinned sessions take indices 0..pinned.length-1
  let unpinnedOffset = pinned.length;

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
          title={
            hasRawData
              ? "No sessions match your filters"
              : "No sessions found"
          }
          description={
            hasRawData
              ? "Try adjusting the filters above."
              : "Claude Code sessions will appear here once indexed."
          }
        />
      ) : (
        <>
          {pinned.length > 0 && (
            <div>
              <div className="sticky top-0 z-10 bg-bg-secondary px-6 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                Pinned
              </div>
              {pinned.map((session, i) => (
                <PinToggleWithFocus
                  key={session.id}
                  session={session}
                  isFocused={focusedIndex === i}
                />
              ))}
            </div>
          )}
          {[...grouped.entries()].map(([dayKey, daySessions]) => {
            const startOffset = unpinnedOffset;
            const elements = daySessions.map((session, i) => (
              <PinToggleWithFocus
                key={session.id}
                session={session}
                isFocused={focusedIndex === startOffset + i}
              />
            ));
            unpinnedOffset += daySessions.length;
            return (
              <div key={dayKey}>
                <div className="sticky top-0 z-10 bg-bg-secondary px-6 py-2 text-xs font-medium uppercase tracking-wider text-text-tertiary">
                  {formatRelativeDay(dayKey)}
                </div>
                {elements}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
