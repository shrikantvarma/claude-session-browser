import { useStats } from "../api/queries";

interface FilterBarProps {
  onProjectChange: (project: string | null) => void;
  onDateRangeChange: (start: string | null, end: string | null) => void;
  selectedProject: string | null;
  dateStart: string | null;
  dateEnd: string | null;
}

export function FilterBar({
  onProjectChange,
  onDateRangeChange,
  selectedProject,
  dateStart,
  dateEnd,
}: FilterBarProps) {
  const { data: stats } = useStats();
  const projects = stats?.projects ?? [];
  const hasActiveFilter = selectedProject !== null || dateStart !== null || dateEnd !== null;

  function handleClear() {
    onProjectChange(null);
    onDateRangeChange(null, null);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={selectedProject ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          onProjectChange(val === "" ? null : val);
        }}
        className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary"
      >
        <option value="">All Projects</option>
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        <label htmlFor="filter-date-from" className="text-xs text-text-tertiary">
          From
        </label>
        <input
          id="filter-date-from"
          type="date"
          value={dateStart ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            onDateRangeChange(val, dateEnd);
          }}
          style={{ colorScheme: "dark" }}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary"
        />
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="filter-date-to" className="text-xs text-text-tertiary">
          To
        </label>
        <input
          id="filter-date-to"
          type="date"
          value={dateEnd ?? ""}
          onChange={(e) => {
            const val = e.target.value || null;
            onDateRangeChange(dateStart, val);
          }}
          style={{ colorScheme: "dark" }}
          className="rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary"
        />
      </div>

      {hasActiveFilter && (
        <button
          type="button"
          onClick={handleClear}
          className="text-sm text-text-tertiary hover:text-text-secondary"
        >
          Clear
        </button>
      )}
    </div>
  );
}
