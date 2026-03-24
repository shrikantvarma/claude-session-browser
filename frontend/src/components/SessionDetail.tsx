import { useParams, Link } from "react-router";
import { useSession } from "../api/queries";
import { formatDuration } from "../lib/dates";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useSession(id ?? "");

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isError) {
    return (
      <EmptyState
        title="Failed to load session"
        description={error?.message ?? "Session not found"}
      />
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Session not found"
        description="This session may have been removed."
      />
    );
  }

  const { session, messages } = data;
  const startDate = new Date(session.started_at);
  const dateStr = startDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = startDate.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-10 border-b border-border bg-bg-primary px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-1">
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
              Back
            </Link>
          </div>
          <h2 className="text-lg font-semibold text-text-primary">
            {session.project_dir}
          </h2>
          <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
            <span>{dateStr} at {timeStr}</span>
            <span>{formatDuration(session.duration_ms)}</span>
            <span>{session.message_count} messages</span>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto px-6 py-6">
        <div className="mx-auto max-w-3xl">
          {messages.map((message) => (
            <MessageBubble key={message.uuid} message={message} />
          ))}
        </div>
      </div>
    </div>
  );
}
