import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, it, expect, vi } from "vitest";
import { SearchResults } from "./SearchResults";
import type { SearchResponse } from "../api/types";

vi.mock("../api/queries", () => ({
  useSearch: vi.fn(),
}));

import { useSearch } from "../api/queries";

const mockUseSearch = vi.mocked(useSearch);

const mockSearchData: SearchResponse = {
  results: [
    {
      uuid: "msg-1",
      sessionId: "session-abc",
      role: "user",
      snippet: "How do I fix <mark>authentication</mark> issues?",
      timestamp: "2026-03-20T10:00:00Z",
      session: {
        projectPath: "users-code-my-project",
        projectDir: "my-project",
        startedAt: "2026-03-20T09:00:00Z",
        lastActiveAt: "2026-03-20T11:00:00Z",
        messageCount: 12,
      },
    },
    {
      uuid: "msg-2",
      sessionId: "session-def",
      role: "assistant",
      snippet: "The <mark>authentication</mark> module needs a token refresh.",
      timestamp: "2026-03-19T14:00:00Z",
      session: {
        projectPath: "users-code-api",
        projectDir: "api",
        startedAt: "2026-03-19T13:00:00Z",
        lastActiveAt: "2026-03-19T15:00:00Z",
        messageCount: 8,
      },
    },
  ],
  total: 2,
  query: "authentication",
};

function renderWithRouter(query: string) {
  return render(
    <MemoryRouter initialEntries={[`/search?q=${encodeURIComponent(query)}`]}>
      <Routes>
        <Route path="search" element={<SearchResults />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SearchResults", () => {
  it("renders empty state when search returns empty array", () => {
    mockUseSearch.mockReturnValue({
      data: { results: [], total: 0, query: "nothing" },
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSearch>);

    renderWithRouter("nothing");
    expect(screen.getByText(/no results/i)).toBeInTheDocument();
  });

  it("renders result count when results exist", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSearch>);

    renderWithRouter("authentication");
    expect(screen.getByText(/2 results for/i)).toBeInTheDocument();
  });

  it("each result shows the project directory name as a clickable link to /session/:id", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSearch>);

    renderWithRouter("authentication");
    const projectLink = screen.getByRole("link", { name: /my-project/i });
    expect(projectLink).toHaveAttribute("href", "/session/session-abc");
    const apiLink = screen.getByRole("link", { name: /^api$/i });
    expect(apiLink).toHaveAttribute("href", "/session/session-def");
  });

  it("each result renders the snippet HTML with mark tags via dangerouslySetInnerHTML", () => {
    mockUseSearch.mockReturnValue({
      data: mockSearchData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSearch>);

    renderWithRouter("authentication");
    const marks = screen.getAllByText("authentication");
    // mark elements are rendered from innerHTML
    expect(marks.length).toBeGreaterThanOrEqual(2);
    expect(marks[0].tagName).toBe("MARK");
  });

  it("shows loading spinner while search is in progress", () => {
    mockUseSearch.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useSearch>);

    renderWithRouter("authentication");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
