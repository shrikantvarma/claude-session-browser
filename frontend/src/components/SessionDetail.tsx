import { useState, useCallback, useMemo } from "react";
import { useParams, Link } from "react-router";
import { useSession, useUpdateSession } from "../api/queries";
import { formatDuration } from "../lib/dates";
import { exportAsMarkdown, downloadMarkdown } from "../lib/exportMarkdown";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";
import { MessageBubble } from "./MessageBubble";
import { EditableTitle } from "./EditableTitle";
import { TagInput } from "./TagInput";

export function SessionDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, error } = useSession(id ?? "");
  const mutation = useUpdateSession(id ?? "");
  const [copied, setCopied] = useState(false);

  const handleResume = useCallback(async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(`claude -r "${data.session.id}"`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  }, [data]);

  const handleExport = useCallback(() => {
    if (!data) return;
    const md = exportAsMarkdown(data.session, data.messages);
    const filename = `session-${data.session.id.slice(0, 8)}.md`;
    downloadMarkdown(filename, md);
  }, [data]);

  const handleTitleSave = useCallback(
    (title: string) => {
      mutation.mutate({ title });
    },
    [mutation],
  );

  const tags = useMemo(() => {
    if (!data?.session.tags) return [];
    try {
      return JSON.parse(data.session.tags) as string[];
    } catch {
      return [];
    }
  }, [data?.session.tags]);

  const handleTagsUpdate = useCallback(
    (newTags: string[]) => {
      mutation.mutate({ tags: newTags });
    },
    [mutation],
  );

  const handlePinToggle = useCallback(() => {
    if (!data) return;
    mutation.mutate({ is_pinned: data.session.is_pinned !== 1 });
  }, [data, mutation]);

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
  const displayTitle =
    session.display_title ?? session.auto_title ?? session.project_name;
  const showSecondary = displayTitle !== session.project_name;
  const isPinned = session.is_pinned === 1;

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
          <EditableTitle value={displayTitle} onSave={handleTitleSave} />
          {showSecondary && (
            <div className="mt-0.5 text-sm text-text-tertiary">
              {session.project_name}
            </div>
          )}
          <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
            <span>
              {dateStr} at {timeStr}
            </span>
            <span>{formatDuration(session.duration_ms)}</span>
            <span>{session.message_count} messages</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={handlePinToggle}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors hover:bg-bg-secondary hover:text-text-primary ${
                isPinned ? "text-accent" : "text-text-secondary"
              }`}
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
              {isPinned ? "Pinned" : "Pin"}
            </button>
            <button
              onClick={handleResume}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184"
                />
              </svg>
              {copied ? "Copied!" : "Resume"}
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs text-text-secondary transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <svg
                className="h-3.5 w-3.5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Export
            </button>
          </div>
          <div className="mt-2 border-t border-border pt-2">
            <TagInput tags={tags} onUpdate={handleTagsUpdate} />
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
