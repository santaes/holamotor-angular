#!/usr/bin/env bash
# Installs HolaMotor as a systemd service on an Orange Pi (Armbian / Debian / Ubuntu).
# Usage (from the project folder on the Pi):  sudo ./deploy/install.sh
set -euo pipefail

APP_DIR=/opt/holamotor
DATA_DIR=/var/lib/holamotor
SRC_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [[ $EUID -ne 0 ]]; then
  echo "Run with sudo: sudo $0" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1 || (( $(node -p 'process.versions.node.split(".")[0]') < 18 )); then
  echo "Installing Node.js 20..."
  apt-get update
  apt-get install -y ca-certificates curl
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if [[ ! -f "$SRC_DIR/dist/holamotor-taller/index.html" ]]; then
  echo "Building the Angular app (can take a few minutes on the Pi)..."
  cd "$SRC_DIR"
  sudo -u "${SUDO_USER:-root}" npm ci --no-audit --no-fund
  sudo -u "${SUDO_USER:-root}" npx ng build
fi

id holamotor >/dev/null 2>&1 || useradd --system --home "$APP_DIR" --shell /usr/sbin/nologin holamotor

mkdir -p "$APP_DIR" "$DATA_DIR"
rm -rf "$APP_DIR/server" "$APP_DIR/dist"
cp -r "$SRC_DIR/server" "$SRC_DIR/dist" "$APP_DIR/"
chown -R holamotor:holamotor "$DATA_DIR"

cp "$SRC_DIR/deploy/holamotor.service" /etc/systemd/system/holamotor.service
systemctl daemon-reload
systemctl enable --now holamotor
systemctl restart holamotor

IP=$(hostname -I | awk '{print $1}')
echo
echo "HolaMotor is running: http://${IP}:8080"
echo "Logs:    journalctl -u holamotor -f"
echo "Data:    $DATA_DIR"
