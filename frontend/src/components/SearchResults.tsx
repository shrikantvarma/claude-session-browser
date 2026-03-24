import { useSearchParams, Link } from "react-router";
import { useSearch } from "../api/queries";
import { LoadingSpinner } from "./LoadingSpinner";
import { EmptyState } from "./EmptyState";

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const { data, isLoading } = useSearch(query);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!data || data.results.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description={query ? `Nothing matched "${query}".` : "Enter a search query to find sessions."}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-6">
      <p className="mb-4 text-sm text-text-secondary">
        {data.total} results for &ldquo;{data.query}&rdquo;
      </p>
      <div className="flex flex-col gap-3">
        {data.results.map((result) => (
          <div
            key={result.uuid}
            className="rounded-lg border border-border bg-bg-secondary p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <Link
                to={`/session/${result.sessionId}`}
                className="font-medium text-text-primary hover:text-accent"
              >
                {result.session.projectDir}
              </Link>
              <span className="text-xs text-text-tertiary">
                {new Date(result.session.lastActiveAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="mb-1">
              <span className="rounded bg-bg-tertiary px-1.5 py-0.5 text-xs text-text-tertiary">
                {result.role === "user" ? "You" : "Claude"}
              </span>
            </div>
            <div
              className="text-sm leading-relaxed text-text-secondary"
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
