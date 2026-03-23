#!/bin/bash
# Start dev container for Claude Code Session Browser
# Works with Docker Desktop or OrbStack

set -e

if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY not set"
  echo "Run: export ANTHROPIC_API_KEY=your-key"
  exit 1
fi

IMAGE="mcr.microsoft.com/devcontainers/typescript-node:22"
CONTAINER_NAME="session-browser-dev"

# Stop existing container if running
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting dev container..."
docker run -it \
  --name "$CONTAINER_NAME" \
  -v "$(pwd):/workspace" \
  -v "$HOME/.claude/projects:/home/node/.claude-sessions:ro" \
  -e ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  -e SESSIONS_PATH="/home/node/.claude-sessions" \
  -p 3000:3000 \
  -w /workspace \
  "$IMAGE" \
  bash -c '
    echo "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code 2>/dev/null
    echo ""
    echo "Ready! Run:"
    echo "  claude --dangerously-skip-permissions"
    echo ""
    exec bash
  '
