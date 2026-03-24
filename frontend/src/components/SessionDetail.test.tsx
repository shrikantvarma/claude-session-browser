import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router";
import { describe, it, expect, vi } from "vitest";
import { SessionDetail } from "./SessionDetail";
import type { SessionDetailResponse } from "../api/types";

// Mock the query hooks
vi.mock("../api/queries", () => ({
  useSession: vi.fn(),
  useUpdateSession: vi.fn(() => ({
    mutate: vi.fn(),
    isPending: false,
  })),
}));

import { useSession } from "../api/queries";

const mockUseSession = vi.mocked(useSession);

const mockSessionData: SessionDetailResponse = {
  session: {
    id: "session-abc",
    project_path: "users-code-my-project",
    project_dir: "my-project",
    project_name: "my-project",
    started_at: "2026-03-20T10:00:00Z",
    last_active_at: "2026-03-20T11:30:00Z",
    duration_ms: 5400000,
    message_count: 4,
    model: "claude-opus-4",
    cwd: "/home/user/code/my-project",
    git_branch: "main",
  },
  messages: [
    {
      uuid: "msg-1",
      session_id: "session-abc",
      parent_uuid: null,
      role: "user",
      content: "Hello, can you help me?",
      timestamp: "2026-03-20T10:00:00Z",
      model: null,
    },
    {
      uuid: "msg-2",
      session_id: "session-abc",
      parent_uuid: "msg-1",
      role: "assistant",
      content: "Of course! What do you need help with?",
      timestamp: "2026-03-20T10:00:30Z",
      model: "claude-opus-4",
    },
    {
      uuid: "msg-3",
      session_id: "session-abc",
      parent_uuid: "msg-2",
      role: "user",
      content: "I need to fix a bug.",
      timestamp: "2026-03-20T10:01:00Z",
      model: null,
    },
    {
      uuid: "msg-4",
      session_id: "session-abc",
      parent_uuid: "msg-3",
      role: "assistant",
      content: "Sure, let me take a look.",
      timestamp: "2026-03-20T10:01:30Z",
      model: "claude-opus-4",
    },
  ],
};

function renderWithRouter(sessionId: string) {
  return render(
    <MemoryRouter initialEntries={[`/session/${sessionId}`]}>
      <Routes>
        <Route path="session/:id" element={<SessionDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("SessionDetail", () => {
  it("renders loading spinner when session data is loading", () => {
    mockUseSession.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("renders session project_dir as title in the header", () => {
    mockUseSession.mockReturnValue({
      data: mockSessionData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    expect(screen.getByText("my-project")).toBeInTheDocument();
  });

  it("renders all messages from the session as MessageBubble components", () => {
    mockUseSession.mockReturnValue({
      data: mockSessionData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    expect(screen.getByText("Hello, can you help me?")).toBeInTheDocument();
    expect(
      screen.getByText("Of course! What do you need help with?"),
    ).toBeInTheDocument();
    expect(screen.getByText("I need to fix a bug.")).toBeInTheDocument();
    expect(
      screen.getByText("Sure, let me take a look."),
    ).toBeInTheDocument();
  });

  it('user messages have "You" label, assistant messages have "Claude" label', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    const youLabels = screen.getAllByText("You");
    const claudeLabels = screen.getAllByText("Claude");
    expect(youLabels).toHaveLength(2);
    expect(claudeLabels).toHaveLength(2);
  });

  it("shows error state when session fetch fails", () => {
    mockUseSession.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Session not found"),
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    expect(screen.getByText(/failed to load session/i)).toBeInTheDocument();
  });

  it('back link navigates to "/"', () => {
    mockUseSession.mockReturnValue({
      data: mockSessionData,
      isLoading: false,
      isError: false,
      error: null,
    } as ReturnType<typeof useSession>);

    renderWithRouter("session-abc");
    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink).toHaveAttribute("href", "/");
  });
});
