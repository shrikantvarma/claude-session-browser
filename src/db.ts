import Database from "better-sqlite3";
import { statSync } from "node:fs";
import type { Session, Message } from "./types.js";
import { discoverSessions, parseSessionFile } from "./parser.js";
import { generateTitle } from "./titlegen.js";

let _db: Database.Database | null = null;

/**
 * Initialize the SQLite database with all required tables and indexes.
 */
export function initDb(dbPath?: string): Database.Database {
  const db = new Database(dbPath ?? "sessions.db");

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      project_path TEXT NOT NULL,
      project_dir TEXT NOT NULL,
      project_name TEXT NOT NULL DEFAULT '',
      started_at TEXT NOT NULL,
      last_active_at TEXT NOT NULL,
      duration_ms INTEGER NOT NULL,
      message_count INTEGER NOT NULL,
      model TEXT,
      cwd TEXT NOT NULL,
      git_branch TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      uuid TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES sessions(id),
      parent_uuid TEXT,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      model TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active_at DESC);
    CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      session_id UNINDEXED,
      uuid UNINDEXED,
      content=messages,
      content_rowid=rowid
    );

    CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
      INSERT INTO messages_fts(rowid, content, session_id, uuid)
      VALUES (new.rowid, new.content, new.session_id, new.uuid);
    END;

    CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, content, session_id, uuid)
      VALUES ('delete', old.rowid, old.content, old.session_id, old.uuid);
    END;

    CREATE TABLE IF NOT EXISTS file_meta (
      file_path TEXT PRIMARY KEY,
      mtime_ms INTEGER NOT NULL
    );
  `);

  migrateSchema(db);

  _db = db;
  return db;
}

/**
 * Idempotently add organization columns to the sessions table.
 */
export function migrateSchema(db: Database.Database): void {
  const columns = db.pragma("table_info(sessions)") as { name: string }[];
  const existing = new Set(columns.map((c) => c.name));

  const migrations: [string, string][] = [
    ["title", "ALTER TABLE sessions ADD COLUMN title TEXT DEFAULT NULL"],
    ["auto_title", "ALTER TABLE sessions ADD COLUMN auto_title TEXT DEFAULT NULL"],
    ["tags", "ALTER TABLE sessions ADD COLUMN tags TEXT DEFAULT '[]'"],
    ["is_pinned", "ALTER TABLE sessions ADD COLUMN is_pinned INTEGER DEFAULT 0"],
  ];

  for (const [col, sql] of migrations) {
    if (!existing.has(col)) {
      db.exec(sql);
    }
  }
}

/**
 * Get the module-level singleton database instance.
 */
export function getDb(): Database.Database {
  if (!_db) {
    throw new Error("Database not initialized. Call initDb() first.");
  }
  return _db;
}

/**
 * Insert a session row, preserving user-set title/tags/pin on re-index.
 */
export function insertSession(db: Database.Database, session: Session): void {
  const stmt = db.prepare(`
    INSERT INTO sessions (
      id, project_path, project_dir, project_name, started_at, last_active_at,
      duration_ms, message_count, model, cwd, git_branch, auto_title
    ) VALUES (
      @id, @projectPath, @projectDir, @projectName, @startedAt, @lastActiveAt,
      @durationMs, @messageCount, @model, @cwd, @gitBranch, @autoTitle
    )
    ON CONFLICT(id) DO UPDATE SET
      project_path = excluded.project_path,
      project_dir = excluded.project_dir,
      project_name = excluded.project_name,
      started_at = excluded.started_at,
      last_active_at = excluded.last_active_at,
      duration_ms = excluded.duration_ms,
      message_count = excluded.message_count,
      model = excluded.model,
      cwd = excluded.cwd,
      git_branch = excluded.git_branch,
      auto_title = excluded.auto_title
  `);

  stmt.run({
    id: session.id,
    projectPath: session.projectPath,
    projectDir: session.projectDir,
    projectName: session.projectName,
    startedAt: session.startedAt,
    lastActiveAt: session.lastActiveAt,
    durationMs: session.durationMs,
    messageCount: session.messageCount,
    model: session.model,
    cwd: session.cwd,
    gitBranch: session.gitBranch,
    autoTitle: session.autoTitle ?? null,
  });
}

/**
 * Batch insert messages using a prepared statement in a transaction.
 */
export function insertMessages(db: Database.Database, messages: Message[]): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO messages (
      uuid, session_id, parent_uuid, role, content, timestamp, model
    ) VALUES (
      @uuid, @sessionId, @parentUuid, @role, @content, @timestamp, @model
    )
  `);

  const insertMany = db.transaction((msgs: Message[]) => {
    for (const msg of msgs) {
      stmt.run({
        uuid: msg.uuid,
        sessionId: msg.sessionId,
        parentUuid: msg.parentUuid,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        model: msg.model,
      });
    }
  });

  insertMany(messages);
}

/**
 * Index all sessions from the Claude projects directory.
 * Uses file modification times for incremental re-indexing.
 */
export async function indexAllSessions(
  db: Database.Database,
  claudeDir?: string
): Promise<{ indexed: number; errors: number }> {
  let indexed = 0;
  let errors = 0;

  const sessions = await discoverSessions(claudeDir);

  const getMetaStmt = db.prepare(
    "SELECT mtime_ms FROM file_meta WHERE file_path = ?"
  );
  const upsertMetaStmt = db.prepare(
    "INSERT OR REPLACE INTO file_meta (file_path, mtime_ms) VALUES (?, ?)"
  );

  for (const { filePath, projectDir } of sessions) {
    try {
      // Check file modification time for incremental indexing
      const fileStat = statSync(filePath);
      const mtimeMs = Math.floor(fileStat.mtimeMs);

      const existing = getMetaStmt.get(filePath) as { mtime_ms: number } | undefined;
      if (existing && existing.mtime_ms === mtimeMs) {
        // File unchanged, skip
        continue;
      }

      const { session, messages } = await parseSessionFile(filePath, projectDir);

      // Skip sessions with no messages
      if (messages.length === 0) {
        continue;
      }

      // Generate auto-title from messages
      const autoTitle = generateTitle(
        messages.map((m) => ({ role: m.role, content: m.content }))
      );
      session.autoTitle = autoTitle;

      insertSession(db, session);
      insertMessages(db, messages);
      upsertMetaStmt.run(filePath, mtimeMs);

      indexed++;
    } catch (err) {
      errors++;
    }
  }

  // Always rebuild FTS index to ensure consistency with content table
  db.exec("INSERT INTO messages_fts(messages_fts) VALUES('rebuild')");

  return { indexed, errors };
}
