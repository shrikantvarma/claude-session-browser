import express from "express";
import cors from "cors";
import { initDb, indexAllSessions } from "./db.js";
import { createRouter } from "./routes.js";

async function main(): Promise<void> {
  const port = parseInt(process.env.PORT ?? "3001", 10);

  // Initialize database
  console.log("Initializing database...");
  const db = initDb();

  // Index all sessions on startup
  console.log("Indexing sessions from ~/.claude/projects/...");
  const startTime = Date.now();
  const { indexed, errors } = await indexAllSessions(db);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  const sessionsCount = (
    db.prepare("SELECT COUNT(*) as total FROM sessions").get() as { total: number }
  ).total;
  const messagesCount = (
    db.prepare("SELECT COUNT(*) as total FROM messages").get() as { total: number }
  ).total;

  console.log(
    `Indexed ${indexed} sessions (${errors} errors) in ${elapsed}s. Total: ${sessionsCount} sessions, ${messagesCount} messages.`
  );

  // Create Express app
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(createRouter(db));

  // Start server
  const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });

  // Graceful shutdown
  const shutdown = (): void => {
    console.log("\nShutting down...");
    server.close(() => {
      db.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
