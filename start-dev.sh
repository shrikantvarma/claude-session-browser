#!/bin/bash
# Start with Docker Compose
# For running without Docker, use: bash quick-start.sh

set -e

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

CLAUDE_SESSIONS_PATH="${CLAUDE_SESSIONS_PATH:-$HOME/.claude/projects}"

if [ ! -d "$CLAUDE_SESSIONS_PATH" ]; then
  echo "Error: Sessions not found at: $CLAUDE_SESSIONS_PATH"
  echo ""
  echo "Set CLAUDE_SESSIONS_PATH in .env or as an environment variable."
  echo "  cp .env.example .env"
  exit 1
fi

export CLAUDE_SESSIONS_PATH
docker compose up --build
