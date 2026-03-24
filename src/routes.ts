import { Router } from "express";
import type { Request, Response } from "express";
import type Database from "better-sqlite3";
import { indexAllSessions } from "./db.js";

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

/**
 * Create an Express router with all API endpoints.
 */
export function createRouter(db: Database.Database): Router {
  const router = Router();

  /**
   * GET /api/sessions - List all sessions, most recent first.
   */
  router.get("/api/sessions", (req: Request, res: Response) => {
    try {
      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 50);
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);
      const project = req.query.project as string | undefined;

      let whereClause = "";
      const countParams: (string | number)[] = [];
      const queryParams: (string | number)[] = [];

      if (project) {
        whereClause = "WHERE project_dir = ?";
        countParams.push(project);
        queryParams.push(project);
      }

      queryParams.push(limit, offset);

      const countRow = db
        .prepare(`SELECT COUNT(*) as total FROM sessions ${whereClause}`)
        .get(...countParams) as { total: number } | undefined;

      const total = countRow?.total ?? 0;

      const sessions = db
        .prepare(
          `SELECT *, COALESCE(title, auto_title, project_name) as display_title FROM sessions ${whereClause} ORDER BY is_pinned DESC, last_active_at DESC LIMIT ? OFFSET ?`
        )
        .all(...queryParams);

      res.json({ sessions, total });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/sessions/:id - Get a single session with all its messages.
   */
  router.get("/api/sessions/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const session = db
        .prepare("SELECT *, COALESCE(title, auto_title, project_name) as display_title FROM sessions WHERE id = ?")
        .get(id);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const messages = db
        .prepare(
          "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC"
        )
        .all(id);

      res.json({ session, messages });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * PATCH /api/sessions/:id - Update session title, tags, and/or pin status.
   */
  router.patch("/api/sessions/:id", (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const session = db
        .prepare("SELECT id FROM sessions WHERE id = ?")
        .get(id);

      if (!session) {
        res.status(404).json({ error: "Session not found" });
        return;
      }

      const { title, tags, is_pinned } = req.body as {
        title?: string;
        tags?: string[];
        is_pinned?: boolean;
      };

      if (title !== undefined) {
        db.prepare("UPDATE sessions SET title = ? WHERE id = ?").run(
          title,
          id
        );
      }

      if (tags !== undefined) {
        db.prepare("UPDATE sessions SET tags = ? WHERE id = ?").run(
          JSON.stringify(tags),
          id
        );
      }

      if (is_pinned !== undefined) {
        db.prepare("UPDATE sessions SET is_pinned = ? WHERE id = ?").run(
          is_pinned ? 1 : 0,
          id
        );
      }

      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/search - Full-text search across message content.
   */
  router.get("/api/search", (req: Request, res: Response) => {
    try {
      const q = req.query.q as string | undefined;

      if (!q || q.trim() === "") {
        res.status(400).json({ error: "Query parameter 'q' is required" });
        return;
      }

      const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 20);
      const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

      const results = db
        .prepare(
          `SELECT
            m.uuid,
            m.session_id,
            m.role,
            snippet(messages_fts, 0, '<mark>', '</mark>', '...', 32) as snippet,
            m.timestamp,
            s.project_path,
            s.project_dir,
            s.project_name,
            s.started_at,
            s.last_active_at,
            s.message_count
          FROM messages_fts
          JOIN messages m ON messages_fts.uuid = m.uuid
          JOIN sessions s ON m.session_id = s.id
          WHERE messages_fts MATCH ?
          ORDER BY s.last_active_at DESC
          LIMIT ? OFFSET ?`
        )
        .all(q, limit, offset);

      const countRow = db
        .prepare(
          "SELECT COUNT(*) as total FROM messages_fts WHERE messages_fts MATCH ?"
        )
        .get(q) as { total: number } | undefined;

      const total = countRow?.total ?? 0;

      const mapped: SearchResult[] = results.map((row: any) => ({
        uuid: row.uuid,
        sessionId: row.session_id,
        role: row.role,
        snippet: row.snippet,
        timestamp: row.timestamp,
        session: {
          projectPath: row.project_path,
          projectDir: row.project_dir,
          projectName: row.project_name,
          startedAt: row.started_at,
          lastActiveAt: row.last_active_at,
          messageCount: row.message_count,
        },
      }));

      res.json({ results: mapped, total, query: q });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * POST /api/refresh - Re-index sessions (incremental).
   */
  router.post("/api/refresh", async (_req: Request, res: Response) => {
    try {
      const result = await indexAllSessions(db);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/stats - Basic statistics.
   */
  router.get("/api/stats", (_req: Request, res: Response) => {
    try {
      const sessionsCount = db
        .prepare("SELECT COUNT(*) as total FROM sessions")
        .get() as { total: number };

      const messagesCount = db
        .prepare("SELECT COUNT(*) as total FROM messages")
        .get() as { total: number };

      const projectRows = db
        .prepare(
          "SELECT DISTINCT project_dir, project_name FROM sessions ORDER BY project_name"
        )
        .all() as { project_dir: string; project_name: string }[];

      res.json({
        totalSessions: sessionsCount.total,
        totalMessages: messagesCount.total,
        projects: projectRows.map((r) => ({
          dir: r.project_dir,
          name: r.project_name,
        })),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
