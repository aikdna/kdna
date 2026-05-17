#!/usr/bin/env bash
# KDNA Agent Integration Demo
# Demonstrates loading KDNA into different AI agents and comparing results.
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "  KDNA Agent Integration Demo"
echo "=========================================="
echo ""

# Check for installed agents
AGENTS=""
[ -d "$HOME/.codex" ] && AGENTS="$AGENTS codex"
[ -d "$HOME/.claude" ] && AGENTS="$AGENTS claude"
[ -d "$HOME/.agents" ] && AGENTS="$AGENTS opencode"

if [ -z "$AGENTS" ]; then
  echo "No AI agents detected. Install one of:"
  echo "  - Codex (OpenAI):    https://github.com/openai/codex"
  echo "  - Claude Code:       https://docs.anthropic.com/en/docs/claude-code"
  echo "  - OpenCode:          https://github.com/anomalyco/opencode"
  exit 0
fi

echo "Detected agents:${AGENTS}"
echo ""

# ─── Step 1: Install KDNA Skills ───

echo -e "${GREEN}[1/4] Installing KDNA Skills...${NC}"
echo ""

# Detect and install for Codex
if echo "$AGENTS" | grep -q "codex"; then
  echo "  Installing for Codex..."
  mkdir -p ~/.codex/skills/kdna-loader ~/.codex/skills/kdna-create ~/.codex/Kdna
  if [ -d "/Users/AI/K/kdna-skills/kdna-loader" ]; then
    cp /Users/AI/K/kdna-skills/kdna-loader/SKILL.md ~/.codex/skills/kdna-loader/
    cp /Users/AI/K/kdna-skills/kdna-create/SKILL.md ~/.codex/skills/kdna-create/
    echo "    ✓ kdna-loader and kdna-create installed"
  else
    curl -fsSL https://raw.githubusercontent.com/aikdna/kdna-skills/main/install.sh | bash
  fi
fi

# ─── Step 2: Install Domains ───

echo ""
echo -e "${GREEN}[2/4] Installing KDNA domains...${NC}"
echo ""

DOMAINS_DIR="$HOME/.kdna/domains"
mkdir -p "$DOMAINS_DIR"

# Copy sales domain from local examples (or install via CLI)
if [ -d "/Users/AI/K/KDNA/examples/sales" ]; then
  cp -r /Users/AI/K/KDNA/examples/sales "$DOMAINS_DIR/sales"
  echo "  ✓ sales installed to $DOMAINS_DIR/sales"
fi

if [ -d "/Users/AI/K/KDNA/examples/management" ]; then
  cp -r /Users/AI/K/KDNA/examples/management "$DOMAINS_DIR/management"
  echo "  ✓ management installed to $DOMAINS_DIR/management"
fi

if [ -d "/Users/AI/K/KDNA/examples/writing_basic" ]; then
  cp -r /Users/AI/K/KDNA/examples/writing_basic "$DOMAINS_DIR/writing_basic"
  echo "  ✓ writing_basic installed to $DOMAINS_DIR/writing_basic"
fi

# ─── Step 3: Validate ───

echo ""
echo -e "${GREEN}[3/4] Validating domains...${NC}"
echo ""

if command -v kdna &>/dev/null; then
  for domain in sales management writing_basic; do
    if [ -d "$DOMAINS_DIR/$domain" ]; then
      kdna validate "$DOMAINS_DIR/$domain" 2>&1 | head -1
    fi
  done
elif [ -f "/Users/AI/K/KDNA/src/cli.js" ]; then
  for domain in sales management writing_basic; do
    if [ -d "$DOMAINS_DIR/$domain" ]; then
      node /Users/AI/K/KDNA/src/cli.js validate "$DOMAINS_DIR/$domain" 2>&1 | head -1
    fi
  done
fi

# ─── Step 4: Usage Guide ───

echo ""
echo -e "${GREEN}[4/4] How to use KDNA with your agent${NC}"
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  With any KDNA-enabled agent, try these prompts:    │"
echo "  │                                                      │"
echo "  │  1. Sales judgment:                                  │"
echo "  │     \"Use kdna-loader. A client says our price is     │"
echo "  │      too high. How should I respond?\"                │"
echo "  │                                                      │"
echo "  │  2. Management diagnosis:                            │"
echo "  │     \"Use kdna-loader. My team keeps missing          │"
echo "  │      deadlines. Diagnose what's going wrong.\"        │"
echo "  │                                                      │"
echo "  │  3. Writing review:                                  │"
echo "  │     \"Use kdna-loader. Review this blog post draft    │"
echo "  │      for structural clarity and reader focus.\"       │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
echo "  Skill locations:"
echo "    Codex:       ~/.codex/skills/kdna-loader/SKILL.md"
echo "    Claude Code: ~/.claude/skills/kdna-loader/SKILL.md"
echo "    OpenCode:    ~/.agents/skills/kdna-loader/SKILL.md"
echo ""
echo "  Domain locations:"
echo "    ~/.kdna/domains/sales/"
echo "    ~/.kdna/domains/management/"
echo "    ~/.kdna/domains/writing_basic/"
echo ""
echo "=========================================="
echo "  Demo setup complete."
echo "=========================================="
