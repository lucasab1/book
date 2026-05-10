#!/usr/bin/env bash
set -e

# ─────────────────────────────────────────────────────────────────
#  Bookmoth — setup installer
#  Run: bash scripts/setup.sh
# ─────────────────────────────────────────────────────────────────

BOLD=$(tput bold 2>/dev/null || echo "")
RESET=$(tput sgr0 2>/dev/null || echo "")
AMBER='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
MUTED='\033[0;37m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${AMBER}${BOLD}  BOOKMOTH${RESET}"
  echo -e "${MUTED}  Narrative operating system for novelists${NC}"
  echo ""
}

print_step() { echo -e "${AMBER}→${NC} $1"; }
print_ok()   { echo -e "${GREEN}✓${NC} $1"; }
print_warn() { echo -e "${RED}!${NC} $1"; }
print_info() { echo -e "${MUTED}  $1${NC}"; }

# ── 1. Check Node.js ──────────────────────────────────────────────
print_header
print_step "Checking Node.js..."
if ! command -v node &>/dev/null; then
  print_warn "Node.js not found. Install it from https://nodejs.org (v18+)"
  exit 1
fi
NODE_VERSION=$(node --version | sed 's/v//')
MAJOR=${NODE_VERSION%%.*}
if [ "$MAJOR" -lt 18 ]; then
  print_warn "Node.js v${NODE_VERSION} found. Bookmoth requires v18+."
  exit 1
fi
print_ok "Node.js v${NODE_VERSION}"

# ── 2. Install npm dependencies ───────────────────────────────────
print_step "Installing dependencies..."
if [ -f "package.json" ]; then
  npm install --silent 2>&1 | grep -E "^(added|warn|error)" || true
  print_ok "npm packages installed"
else
  print_warn "package.json not found. Run this from the project root."
  exit 1
fi

# ── 3. Create project directories ────────────────────────────────
print_step "Creating project structure..."
mkdir -p story kb/characters kb/world kb/style kb/continuity
mkdir -p work/drafts work/brainstorm work/critique
mkdir -p entities
mkdir -p assets/covers assets/portraits assets/maps assets/icons assets/moodboards
mkdir -p .bookmoth
print_ok "Directories created"

# ── 4. Initialize project.json if missing ─────────────────────────
if [ ! -f "project.json" ]; then
  cat > project.json << 'EOF'
{
  "title": "My Novel",
  "genre": "",
  "synopsis": "",
  "createdAt": ""
}
EOF
  print_ok "project.json created"
else
  print_info "project.json already exists — skipping"
fi

# ── 5. Initialize entity stores if missing ────────────────────────
for file in entities/_graph.json entities/_assets.json entities/_plot_threads.json entities/_memory.json; do
  if [ ! -f "$file" ]; then
    filename=$(basename "$file")
    case "$filename" in
      _graph.json)         echo '{"relationships":[]}' > "$file" ;;
      _assets.json)        echo '{"assets":[]}' > "$file" ;;
      _plot_threads.json)  echo '{"threads":[]}' > "$file" ;;
      _memory.json)        echo '{"chunks":[]}' > "$file" ;;
    esac
  fi
done
print_ok "Entity store files initialized"

# ── 6. Check AI providers ─────────────────────────────────────────
print_step "Checking AI providers..."
FOUND_ANY=false

if command -v claude &>/dev/null; then
  print_ok "Claude Code found: $(claude --version 2>/dev/null || echo 'installed')"
  FOUND_ANY=true
else
  print_info "Claude Code not found — install from: npm install -g @anthropic-ai/claude-code"
fi

if command -v ollama &>/dev/null; then
  print_ok "Ollama found: $(ollama --version 2>/dev/null || echo 'installed')"
  FOUND_ANY=true
else
  print_info "Ollama not found (optional) — install from: https://ollama.ai"
fi

if command -v gemini &>/dev/null; then
  print_ok "Gemini CLI found"
  FOUND_ANY=true
else
  print_info "Gemini CLI not found (optional)"
fi

if [ "$FOUND_ANY" = false ]; then
  print_warn "No AI providers found. Install at least one:"
  echo "  Claude Code: npm install -g @anthropic-ai/claude-code"
  echo "  Ollama:      https://ollama.ai"
fi

# ── 7. Build check ────────────────────────────────────────────────
print_step "Verifying build..."
if npm run build --silent 2>&1 | grep -q "✓ Compiled"; then
  print_ok "Build successful"
else
  print_warn "Build check skipped (run 'npm run build' to verify)"
fi

# ── Done ──────────────────────────────────────────────────────────
echo ""
echo -e "${AMBER}${BOLD}  Setup complete!${RESET}"
echo ""
echo -e "  Start the app:  ${BOLD}npm run dev${RESET}"
echo -e "  Open browser:   ${BOLD}http://localhost:3000${RESET}"
echo ""
echo -e "${MUTED}  Configure AI providers in Settings → AI Providers${NC}"
echo -e "${MUTED}  Or use Claude Code slash commands: /write /brainstorm /critique${NC}"
echo ""
