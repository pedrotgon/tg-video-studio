#!/usr/bin/env bash
set -euo pipefail

STUDIO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUNTIME_DIR="$STUDIO_ROOT/.runtime"
mkdir -p "$RUNTIME_DIR"

pids=()
start_service() {
  local name="$1"
  local directory="$2"
  shift 2
  (
    cd "$directory"
    exec "$@"
  ) >"$RUNTIME_DIR/$name.log" 2>&1 &
  pids+=("$!")
  echo "✓ $name iniciado"
}

stop_all() {
  echo
  echo "Encerrando TG Video Studio…"
  for pid in "${pids[@]}"; do kill "$pid" 2>/dev/null || true; done
  wait 2>/dev/null || true
}
trap stop_all EXIT INT TERM

start_service "money-api" "$STUDIO_ROOT/engines/moneyprinter" .venv/bin/python main.py
start_service "money-web" "$STUDIO_ROOT/engines/moneyprinter" bash webui.sh
start_service "drama-api" "$STUDIO_ROOT/engines/dramaclaw" env ST_EDITION=ce .venv/bin/novelvideo api --port 8780
start_service "drama-web" "$STUDIO_ROOT/engines/dramaclaw/frontend" pnpm dev --host 0.0.0.0
start_service "gateway" "$STUDIO_ROOT/server" uv run python main.py
start_service "tg-web" "$STUDIO_ROOT" npm run dev -- --host 0.0.0.0

echo
echo "TG Video Studio: http://127.0.0.1:5173"
echo "Logs: $RUNTIME_DIR"
wait
