import { Link } from "react-router";
import type { SessionRow } from "../api/types";
import { formatDuration } from "../lib/dates";

interface SessionCardProps {
  session: SessionRow;
}

export function SessionCard({ session }: SessionCardProps) {
  const startDate = new Date(session.started_at);
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <Link
      to={`/session/${session.id}`}
      className="block border-b border-border px-6 py-4 transition-colors hover:bg-bg-tertiary"
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="truncate font-medium text-text-primary">
          {session.project_dir}
        </span>
        <span className="shrink-0 text-xs text-text-secondary">{timeStr}</span>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-text-tertiary">
        <span>{session.message_count} messages</span>
        <span>{formatDuration(session.duration_ms)}</span>
        {session.git_branch && <span>{session.git_branch}</span>}
      </div>
    </Link>
  );
}
