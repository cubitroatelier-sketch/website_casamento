#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

BACKEND_HOST=${BACKEND_HOST:-127.0.0.1}
BACKEND_PORT=${BACKEND_PORT:-8000}
FRONTEND_HOST=${FRONTEND_HOST:-127.0.0.1}
FRONTEND_PORT=${FRONTEND_PORT:-5173}
ADMIN_PASSWORD=${ADMIN_PASSWORD:-LocalAdmin-2026}
ADMIN_TOKEN_SECRET=${ADMIN_TOKEN_SECRET:-local-dev-secret-for-validation-2026}
ADMIN_TOKEN_TTL_SECONDS=${ADMIN_TOKEN_TTL_SECONDS:-28800}

if [ ! -x .venv/bin/python ]; then
  echo "Ambiente Python em .venv nao encontrado. Corre primeiro: ./setup-local.sh"
  exit 1
fi

if [ ! -d node_modules ]; then
  echo "node_modules nao encontrado. Corre primeiro: ./setup-local.sh"
  exit 1
fi

cleanup() {
  local exit_code=$?
  trap - EXIT INT TERM
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
    wait "$BACKEND_PID" 2>/dev/null || true
  fi
  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
    wait "$FRONTEND_PID" 2>/dev/null || true
  fi
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

echo "[start-local] A arrancar backend em http://${BACKEND_HOST}:${BACKEND_PORT}"
ADMIN_PASSWORD="$ADMIN_PASSWORD" ADMIN_TOKEN_SECRET="$ADMIN_TOKEN_SECRET" ADMIN_TOKEN_TTL_SECONDS="$ADMIN_TOKEN_TTL_SECONDS"   .venv/bin/python -m uvicorn main:api --host "$BACKEND_HOST" --port "$BACKEND_PORT" &
BACKEND_PID=$!

sleep 1

echo "[start-local] A arrancar frontend em http://${FRONTEND_HOST}:${FRONTEND_PORT}"
VITE_API_BASE_URL="http://${BACKEND_HOST}:${BACKEND_PORT}"   npm run dev -- --host "$FRONTEND_HOST" --port "$FRONTEND_PORT" &
FRONTEND_PID=$!

echo
echo "Website local pronto:"
echo "- Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "- Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "- Password admin local: ${ADMIN_PASSWORD}"
if [ -n "${TURSO_DATABASE_URL:-}" ] && [ -n "${TURSO_AUTH_TOKEN:-}" ]; then
  echo "- Base de dados: Turso"
else
  echo "- Base de dados: SQLite local"
fi
echo
echo "Para parar os dois servidores, usa Ctrl+C nesta janela."

wait -n "$BACKEND_PID" "$FRONTEND_PID"
