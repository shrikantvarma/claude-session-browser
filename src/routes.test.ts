import { describe, it, expect, beforeEach } from "vitest";
import { initDb, insertSession, migrateSchema } from "./db.js";
import { createRouter } from "./routes.js";
import type Database from "better-sqlite3";
import express from "express";
import type { Session } from "./types.js";

/**
 * Helper: create a minimal test session.
 */
function makeSession(overrides: Partial<Session> & { id: string }): Session {
  return {
    projectPath: "/test/project",
    projectDir: "test-project",
    projectName: "Test Project",
    startedAt: "2026-01-01T00:00:00Z",
    lastActiveAt: "2026-01-01T01:00:00Z",
    durationMs: 3600000,
    messageCount: 5,
    model: "claude-3",
    cwd: "/test",
    gitBranch: "main",
    ...overrides,
  };
}

/**
 * Helper: make an HTTP-like request to the express router using node's built-in fetch.
 * We spin up a real express app on a random port.
 */
function createTestApp(db: Database.Database) {
  const app = express();
  app.use(express.json());
  app.use(createRouter(db));
  return app;
}

async function withServer(
  db: Database.Database,
  fn: (baseUrl: string) => Promise<void>
) {
  const app = createTestApp(db);
  const server = app.listen(0);
  const addr = server.address();
  const port = typeof addr === "object" && addr ? addr.port : 0;
  try {
    await fn(`http://127.0.0.1:${port}`);
  } finally {
    server.close();
  }
}

describe("routes - PATCH /api/sessions/:id", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDb(":memory:");
    insertSession(db, makeSession({ id: "sess-1" }));
  });

  it("updates title", async () => {
    await withServer(db, async (base) => {
      const patchRes = await fetch(`${base}/api/sessions/sess-1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "My Custom Title" }),
      });
      expect(patchRes.status).toBe(200);
      const patchBody = await patchRes.json();
      expect(patchBody.ok).toBe(true);

      // Verify via GET
      const getRes = await fetch(`${base}/api/sessions/sess-1`);
      const getData = (await getRes.json()) as any;
      expect(getData.session.title).toBe("My Custom Title");
      expect(getData.session.display_title).toBe("My Custom Title");
    });
  });

  it("updates tags as JSON", async () => {
    await withServer(db, async (base) => {
      const patchRes = await fetch(`${base}/api/sessions/sess-1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags: ["bug", "auth"] }),
      });
      expect(patchRes.status).toBe(200);

      // Verify stored as JSON
      const row = db
        .prepare("SELECT tags FROM sessions WHERE id = ?")
        .get("sess-1") as any;
      expect(JSON.parse(row.tags)).toEqual(["bug", "auth"]);
    });
  });

  it("toggles pin status", async () => {
    await withServer(db, async (base) => {
      const patchRes = await fetch(`${base}/api/sessions/sess-1`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_pinned: true }),
      });
      expect(patchRes.status).toBe(200);

      const row = db
        .prepare("SELECT is_pinned FROM sessions WHERE id = ?")
        .get("sess-1") as any;
      expect(row.is_pinned).toBe(1);
    });
  });

  it("returns 404 for unknown session", async () => {
    await withServer(db, async (base) => {
      const res = await fetch(`${base}/api/sessions/nonexistent`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "test" }),
      });
      expect(res.status).toBe(404);
    });
  });
});

describe("routes - pinned sort order", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = initDb(":memory:");
    // Insert two sessions: newer one is unpinned, older one will be pinned
    insertSession(
      db,
      makeSession({
        id: "sess-old",
        lastActiveAt: "2026-01-01T00:00:00Z",
      })
    );
    insertSession(
      db,
      makeSession({
        id: "sess-new",
        lastActiveAt: "2026-01-02T00:00:00Z",
      })
    );

    // Pin the older session
    db.prepare("UPDATE sessions SET is_pinned = 1 WHERE id = ?").run(
      "sess-old"
    );
  });

  it("returns pinned sessions first regardless of date", async () => {
    await withServer(db, async (base) => {
      const res = await fetch(`${base}/api/sessions`);
      const data = (await res.json()) as any;

      expect(data.sessions).toHaveLength(2);
      // Pinned (old) should come first
      expect(data.sessions[0].id).toBe("sess-old");
      expect(data.sessions[0].is_pinned).toBe(1);
      // Unpinned (new) comes second
      expect(data.sessions[1].id).toBe("sess-new");
      expect(data.sessions[1].is_pinned).toBe(0);
    });
  });
});

describe("schema migration", () => {
  it("is idempotent - running initDb twice does not error", () => {
    // First init
    const db = initDb(":memory:");
    // Insert a session to verify schema works
    insertSession(db, makeSession({ id: "sess-idem" }));

    // Manually run migrate again (initDb calls it internally)
    migrateSchema(db);

    // Verify session still exists
    const row = db
      .prepare("SELECT id FROM sessions WHERE id = ?")
      .get("sess-idem") as any;
    expect(row.id).toBe("sess-idem");
  });
});
