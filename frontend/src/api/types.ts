// Match snake_case from SQLite API responses
export interface SessionRow {
  id: string;
  project_path: string;
  project_dir: string;
  project_name: string;
  started_at: string;
  last_active_at: string;
  duration_ms: number;
  message_count: number;
  model: string | null;
  cwd: string;
  git_branch: string | null;
  // Forward-compatible fields for Phase 3 organization features
  display_title?: string;
  title?: string | null;
  auto_title?: string | null;
  tags?: string;
  is_pinned?: number;
}

export interface MessageRow {
  uuid: string;
  session_id: string;
  parent_uuid: string | null;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model: string | null;
}

// Search results are camelCase (mapped by routes.ts)
export interface SearchResult {
  uuid: string;
  sessionId: string;
  role: string;
  snippet: string;
  timestamp: string;
  session: {
    projectPath: string;
    projectDir: string;
    projectName: string;
    startedAt: string;
    lastActiveAt: string;
    messageCount: number;
  };
}

export interface SessionsResponse {
  sessions: SessionRow[];
  total: number;
}

export interface SessionDetailResponse {
  session: SessionRow;
  messages: MessageRow[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
}

export interface StatsResponse {
  totalSessions: number;
  totalMessages: number;
  projects: { dir: string; name: string }[];
}
