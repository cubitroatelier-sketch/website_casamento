#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "Este script e apenas para macOS."
  exit 1
fi

if ! xcode-select -p >/dev/null 2>&1; then
  echo "Xcode Command Line Tools nao encontradas."
  echo "Corre primeiro: xcode-select --install"
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew nao encontrado."
  echo "Instala primeiro o Homebrew em https://brew.sh/"
  exit 1
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "[setup-local-macos] A instalar Python 3 com Homebrew"
  brew install python
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[setup-local-macos] A instalar Node.js com Homebrew"
  brew install node
fi

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
.venv/bin/pip install fastapi uvicorn pydantic

echo "[setup-local] A instalar dependencias frontend"
npm install

echo
echo "Setup local concluido."
echo "Para arrancar tudo: ./start-local.sh"

