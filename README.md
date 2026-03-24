# Claude Session Browser

A local web app to browse, search, and organize your past [Claude Code](https://docs.anthropic.com/en/docs/claude-code) sessions.

If you use Claude Code (Anthropic's CLI tool), every conversation is saved as a JSONL file on your machine. This tool indexes those files and gives you a fast, searchable interface to find anything you've discussed.

![Browse all your sessions, filter by project, pin favorites](docs/screenshot-sessions.png)

![Full-text search across every message with highlighted matches](docs/screenshot-search.png)

## Features

- **Full-text search** across all session messages with highlighted snippets
- **Filter by project** to focus on a specific codebase
- **Session detail view** with full conversation history
- **Resume sessions** — open in VS Code or copy the `claude -r` command
- **Organize** — pin sessions, edit titles, add tags
- **Markdown export** of any session
- **Incremental indexing** — only re-parses changed files on startup

## Getting Started

Clone the repo first, then pick **one** of the two methods below:

```bash
git clone https://github.com/shrikantvarma/claude-session-browser.git
cd claude-session-browser
```

### Option A: Local (recommended)

**Requires:** Node.js 18+

```bash
bash quick-start.sh
```

The script will:
1. Detect your sessions directory (default: `~/.claude/projects`)
2. **Prompt you to confirm or type a different path**
3. Install dependencies
4. Start the app at **http://localhost:5173**

You can also skip the prompt by setting the path upfront:
```bash
CLAUDE_SESSIONS_PATH=/path/to/sessions bash quick-start.sh
```

### Option B: Docker

**Requires:** Docker (no Node.js needed)

Docker doesn't use `quick-start.sh`. Instead, set your sessions path via an environment variable:

```bash
# Uses default path: ~/.claude/projects
docker compose up --build

# Or specify a custom path
CLAUDE_SESSIONS_PATH=/path/to/sessions docker compose up --build
```

Your session files are mounted **read-only** into the container. The app will be available at **http://localhost:5173**.

## Configuration

All settings are optional. Set via environment variables or a `.env` file (copy from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `CLAUDE_SESSIONS_PATH` | `~/.claude/projects` | Where your Claude Code session files live |
| `PORT` | `5173` | Frontend port |
| `API_PORT` | `3001` | Backend API port |

## Troubleshooting

**`better-sqlite3` build error on startup**
If you see `ERR_DLOPEN_FAILED` or "not valid mach-o file", the native module needs rebuilding for your Node.js version:
```bash
npm rebuild better-sqlite3
```

**Port already in use**
If 5173 or 3001 is taken, set custom ports:
```bash
PORT=8080 API_PORT=4000 bash quick-start.sh
```

**No session files found**
Make sure you've used Claude Code at least once. Sessions are stored at `~/.claude/projects/`. You can verify with:
```bash
ls ~/.claude/projects/
```

---

## Contributing

### Architecture

```
Frontend (React + Vite + Tailwind)  →  Backend (Express + TypeScript)  →  SQLite (FTS5)  →  JSONL files
:5173                                  :3001                              sessions.db        ~/.claude/projects/
```

### Dev Setup

```bash
# Install dependencies (both backend and frontend)
npm install
cd frontend && npm install && cd ..

# Start backend
npm run dev

# Start frontend (separate terminal)
cd frontend && npm run dev

# Run all tests
npm test
cd frontend && npm test
```

### API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/sessions` | List sessions (paginated, filterable by project) |
| `GET` | `/api/sessions/:id` | Get session with all messages |
| `PATCH` | `/api/sessions/:id` | Update title, tags, or pin status |
| `GET` | `/api/search?q=` | Full-text search across messages |
| `POST` | `/api/refresh` | Trigger incremental re-index |
| `GET` | `/api/stats` | Session/message counts and project list |

### Session File Format

Claude Code stores sessions as JSONL files at `~/.claude/projects/<dash-encoded-path>/<uuid>.jsonl`. Each line is a JSON object with `uuid`, `parentUuid`, `type`, and `message` fields. The directory name is the project's absolute path with `/` replaced by `-` (e.g., `-Users-you-Code-myapp`).

## License

ISC
