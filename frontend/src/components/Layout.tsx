import { Outlet } from "react-router";

export function Layout() {
  return (
    <div className="flex h-screen flex-col bg-bg-primary">
      <header className="flex h-14 items-center border-b border-border px-6">
        <h1 className="text-lg font-semibold text-text-primary">
          Claude Sessions
        </h1>
      </header>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
