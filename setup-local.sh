#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 nao encontrado."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm nao encontrado."
  exit 1
fi

if [ ! -d .venv ]; then
  echo "[setup-local] A criar ambiente virtual Python em .venv"
  python3 -m venv .venv
fi

echo "[setup-local] A instalar dependencias backend"
.venv/bin/pip install -r requirements.txt

echo "[setup-local] A instalar dependencias frontend"
npm install

echo
echo "Setup local concluido."
echo "Para arrancar tudo: ./start-local.sh"
