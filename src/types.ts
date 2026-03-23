export interface Session {
  id: string;           // UUID from filename
  projectPath: string;  // decoded path from directory name (e.g., /Users/shrikantvarma/Code/revops-product)
  projectDir: string;   // dash-encoded directory name
  startedAt: string;    // ISO timestamp of first message
  lastActiveAt: string; // ISO timestamp of last message
  durationMs: number;   // lastActiveAt - startedAt in milliseconds
  messageCount: number; // total user + assistant messages
  model: string | null; // model from first assistant message
  cwd: string;          // working directory from first user message
  gitBranch: string | null; // git branch from first user message
}

export interface Message {
  uuid: string;
  sessionId: string;
  parentUuid: string | null;
  role: "user" | "assistant";
  content: string;      // extracted text content
  timestamp: string;    // ISO timestamp
  model: string | null; // only for assistant messages
}

export interface ParsedLine {
  type: "user" | "assistant" | "queue-operation" | "file-history-snapshot";
  sessionId: string;
  timestamp: string;
  uuid?: string;
  parentUuid?: string | null;
  cwd?: string;
  gitBranch?: string;
  message?: {
    role: string;
    content: string | Array<{ type: string; text?: string }>;
    model?: string;
    usage?: { input_tokens: number; output_tokens: number };
  };
}
