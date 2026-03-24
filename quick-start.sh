#!/bin/bash
# Quick Start — Claude Session Browser
# Run this after cloning the repo. No Docker required.

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${BOLD}Claude Session Browser${NC}"
echo "Browse and search your past Claude Code sessions"
echo ""

# --- Detect sessions directory ---

SESSIONS_PATH="${CLAUDE_SESSIONS_PATH:-}"

# Auto-detect if not provided
if [ -z "$SESSIONS_PATH" ]; then
  if [ -d "$HOME/.claude/projects" ]; then
    DEFAULT_PATH="$HOME/.claude/projects"
  elif [ -d "$HOME/.claude-code/projects" ]; then
    DEFAULT_PATH="$HOME/.claude-code/projects"
  else
    DEFAULT_PATH=""
  fi

  if [ -n "$DEFAULT_PATH" ]; then
    echo -e "Sessions path: ${BOLD}${DEFAULT_PATH}${NC}"
    read -r -p "Press Enter to use this, or type a different path: " USER_PATH
    if [ -n "$USER_PATH" ]; then
      # Expand ~ if user typed it
      SESSIONS_PATH="${USER_PATH/#\~/$HOME}"
    else
      SESSIONS_PATH="$DEFAULT_PATH"
    fi
  else
    echo -e "${YELLOW}Could not auto-detect Claude Code sessions.${NC}"
    echo ""
    echo "Checked:"
    echo "  ~/.claude/projects"
    echo "  ~/.claude-code/projects"
    echo ""
    read -r -p "Enter the path to your sessions directory: " USER_PATH
    if [ -z "$USER_PATH" ]; then
      echo -e "${RED}No path provided. Exiting.${NC}"
      exit 1
    fi
    SESSIONS_PATH="${USER_PATH/#\~/$HOME}"
  fi
fi

if [ ! -d "$SESSIONS_PATH" ]; then
  echo -e "${RED}Directory not found: ${SESSIONS_PATH}${NC}"
  exit 1
fi

SESSION_COUNT=$(find "$SESSIONS_PATH" -name "*.jsonl" 2>/dev/null | head -100 | wc -l | tr -d ' ')
if [ "$SESSION_COUNT" -eq 0 ]; then
  echo -e "${RED}No .jsonl session files found in: ${SESSIONS_PATH}${NC}"
  exit 1
fi

echo -e "${GREEN}Found $SESSION_COUNT+ session files${NC}"
echo ""

# --- Check Node.js ---

if ! command -v node &> /dev/null; then
  echo -e "${RED}Node.js is required but not installed.${NC}"
  echo ""
  echo "Install it from: https://nodejs.org (v18+)"
  echo "Or: brew install node"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}Node.js v18+ required. Found: $(node -v)${NC}"
  exit 1
fi

echo -e "Node.js $(node -v) ${GREEN}✓${NC}"

# --- Install dependencies ---

echo ""
echo "Installing dependencies..."
npm install 2>&1 | tail -3
npm rebuild better-sqlite3 2>&1 | tail -1
(cd frontend && npm install 2>&1 | tail -3)
echo -e "Dependencies ${GREEN}✓${NC}"

# --- Start servers ---

API_PORT="${API_PORT:-3001}"
FRONTEND_PORT="${PORT:-5173}"

echo ""
echo -e "${BOLD}Starting...${NC}"
echo ""

# Export for the backend
export SESSIONS_PATH

# Start backend
npx tsx src/server.ts &
BACKEND_PID=$!

# Wait for backend to be ready (up to 15s)
echo -n "Waiting for backend..."
for i in $(seq 1 30); do
  if curl -s "http://localhost:${API_PORT}/api/sessions?limit=1" > /dev/null 2>&1; then
    echo -e " ${GREEN}✓${NC}"
    break
  fi
  if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo ""
    echo -e "${RED}Backend failed to start. Check the error above.${NC}"
    exit 1
  fi
  sleep 0.5
done

# Start frontend (use --port to be explicit, --strictPort to fail if taken)
(cd frontend && npx vite --host 0.0.0.0 --port "$FRONTEND_PORT") &
FRONTEND_PID=$!

# Wait for frontend
sleep 2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "  ${GREEN}${BOLD}Ready!${NC}"
echo ""
echo -e "  ${BOLD}Open:${NC} http://localhost:${FRONTEND_PORT}"
echo ""
echo "  Press Ctrl+C to stop"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Handle shutdown
cleanup() {
  echo ""
  echo "Shutting down..."
  kill $FRONTEND_PID 2>/dev/null
  kill $BACKEND_PID 2>/dev/null
  wait 2>/dev/null
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for either process to exit
wait
