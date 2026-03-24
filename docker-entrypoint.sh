#!/bin/sh
set -e

SESSIONS_DIR="${SESSIONS_PATH:-/data/sessions}"

# Check if sessions directory has any JSONL files
SESSION_COUNT=$(find "$SESSIONS_DIR" -name "*.jsonl" 2>/dev/null | head -5 | wc -l | tr -d ' ')

if [ "$SESSION_COUNT" -eq 0 ]; then
  echo ""
  echo "ERROR: No Claude Code session files found in $SESSIONS_DIR"
  echo ""
  echo "This usually means the sessions directory wasn't mounted correctly."
  echo ""
  echo "Fix: set CLAUDE_SESSIONS_PATH to your sessions directory:"
  echo ""
  echo "  CLAUDE_SESSIONS_PATH=~/.claude/projects docker compose up"
  echo ""
  echo "To verify you have sessions locally, run:"
  echo ""
  echo "  ls ~/.claude/projects/"
  echo ""
  exit 1
fi

echo "Found session files in $SESSIONS_DIR"

# Start servers
exec "$@"
