#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "Este script e apenas para Linux."
  exit 1
fi

ensure_apt_package() {
  local pkg=$1
  if ! command -v apt-get >/dev/null 2>&1; then
    return 1
  fi
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo nao encontrado. Instala manualmente: $pkg"
    exit 1
  fi
  echo "[setup-local-linux] A instalar $pkg com apt"
  sudo apt-get update
  sudo apt-get install -y "$pkg"
}

if ! command -v python3 >/dev/null 2>&1; then
  ensure_apt_package python3
fi

if ! python3 -m venv --help >/dev/null 2>&1; then
  ensure_apt_package python3-venv
fi

if ! command -v node >/dev/null 2>&1; then
  ensure_apt_package nodejs
fi

if ! command -v npm >/dev/null 2>&1; then
  ensure_apt_package npm
fi

if ! command -v python3 >/dev/null 2>&1; then
  echo "python3 continua em falta."
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "node continua em falta."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm continua em falta."
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "Node.js 18+ e necessario. Versao atual: $(node -v)"
  echo "Atualiza o Node.js e volta a correr o script."
  exit 1
fi

exec ./setup-local.sh
