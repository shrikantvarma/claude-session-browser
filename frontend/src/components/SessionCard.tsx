import { Link } from "react-router";
import type { SessionRow } from "../api/types";
import { formatDuration } from "../lib/dates";

interface SessionCardProps {
  session: SessionRow;
  isFocused?: boolean;
  onPin?: (pinned: boolean) => void;
}

export function SessionCard({ session, isFocused, onPin }: SessionCardProps) {
  const startDate = new Date(session.started_at);
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const displayTitle =
    session.display_title ?? session.auto_title ?? session.project_name;
  const showSecondary = displayTitle !== session.project_name;
  const isPinned = session.is_pinned === 1;

  return (
    <Link
      to={`/session/${session.id}`}
      className={`block border-b border-border px-6 py-4 transition-colors hover:bg-bg-tertiary ${
        isFocused ? "ring-1 ring-accent bg-bg-tertiary" : ""
      }`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate font-medium text-text-primary inline-flex items-center gap-1.5">
          {isPinned && (
            <svg
              className="h-3.5 w-3.5 shrink-0 text-accent"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M16 3a1 1 0 0 1 .707.293l4 4a1 1 0 0 1-.187 1.55l-3.11 2.073-.536 2.68a1 1 0 0 1-.473.625l-3.4 2.04V19a1 1 0 0 1-.293.707l-1 1a1 1 0 0 1-1.414 0L8 18.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L6.586 17 4.293 14.707a1 1 0 0 1 0-1.414l1-1A1 1 0 0 1 6 12h2.739l2.04-3.4a1 1 0 0 1 .625-.473l2.68-.536L17.157 4.48a1 1 0 0 1 1.55-.187L16 3Z" />
            </svg>
          )}
          {displayTitle}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {onPin && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onPin(!isPinned);
              }}
              className="text-text-tertiary hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label={isPinned ? "Unpin session" : "Pin session"}
            >
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={isPinned ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={isPinned ? 0 : 1.5}
              >
                <path d="M16 3a1 1 0 0 1 .707.293l4 4a1 1 0 0 1-.187 1.55l-3.11 2.073-.536 2.68a1 1 0 0 1-.473.625l-3.4 2.04V19a1 1 0 0 1-.293.707l-1 1a1 1 0 0 1-1.414 0L8 18.414l-3.293 3.293a1 1 0 0 1-1.414-1.414L6.586 17 4.293 14.707a1 1 0 0 1 0-1.414l1-1A1 1 0 0 1 6 12h2.739l2.04-3.4a1 1 0 0 1 .625-.473l2.68-.536L17.157 4.48a1 1 0 0 1 1.55-.187L16 3Z" />
              </svg>
            </button>
          )}
          <span className="text-xs text-text-secondary">{timeStr}</span>
        </div>
      </div>
      {showSecondary && (
        <div className="mt-0.5 text-xs text-text-tertiary">
          {session.project_name}
        </div>
      )}
      <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
        <span>{session.message_count} messages</span>
        <span>{formatDuration(session.duration_ms)}</span>
        {session.git_branch && <span>{session.git_branch}</span>}
      </div>
    </Link>
  );
}
