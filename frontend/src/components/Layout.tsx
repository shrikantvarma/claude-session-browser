import { Outlet, useNavigate } from "react-router";
import { useCallback } from "react";
import { SearchBar } from "./SearchBar";

export function Layout() {
  const navigate = useNavigate();

  const handleSearch = useCallback(
    (query: string) => {
      if (query.length > 1) {
        void navigate(`/search?q=${encodeURIComponent(query)}`);
      }
    },
    [navigate],
  );

  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <header className="flex h-14 items-center gap-4 border-b border-border px-6">
        <h1 className="shrink-0 text-lg font-semibold text-text-primary">
          Claude Sessions
        </h1>
        <div className="ml-auto w-64">
          <SearchBar onSearch={handleSearch} />
        </div>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
