#!/bin/bash
# Start dev container for Claude Code Session Browser
# Works with Docker Desktop or OrbStack

set -e

IMAGE="mcr.microsoft.com/devcontainers/typescript-node:22"
CONTAINER_NAME="session-browser-dev"

# Stop existing container if running
docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

echo "Starting dev container..."
docker run -it \
  --name "$CONTAINER_NAME" \
  -v "$(pwd):/workspace" \
  -v "$HOME/.claude:/home/node/.claude" \
  -e SESSIONS_PATH="/home/node/.claude/projects" \
  -p 3000:3000 \
  -w /workspace \
  "$IMAGE" \
  bash -c '
    echo "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code 2>/dev/null
    echo ""
    echo "Ready! Run:"
    echo "  claude login"
    echo "  claude --dangerously-skip-permissions"
    echo ""
    exec bash
  '
