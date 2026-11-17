#!/bin/bash
# Deployment script to run ON the Orange Pi
# This script is called by GitHub Actions after rsync
# Supports Arch Linux ARM (pacman) and Debian/Ubuntu (apt)
# Note: Using Google Translate API - no local translation service needed

set -e  # Exit on error

PROJECT_DIR="${1:-$HOME/Desktop/holamotor-angular}"
BACKUP_DIR="$HOME/holamotor-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚀 Deploying HolaMotor with VeriFactu integration..."
echo "📁 Project directory: $PROJECT_DIR"

# 1. Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
if [ -d "$PROJECT_DIR/data" ]; then
  tar -czf "$BACKUP_DIR/data-backup-$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" data
  echo "✅ Backup created: $BACKUP_DIR/data-backup-$TIMESTAMP.tar.gz"
fi

# 2. Ensure HolaMotor systemd service is configured
echo "⚙️  Ensuring HolaMotor service configuration..."
if ! command -v docker &> /dev/null || [ ! -f "docker-compose.yml" ]; then
  # Only for non-Docker deployments
  USER=$(whoami)
  HM_DATA_DIR="$HOME/holamotor-data"
  mkdir -p "$HM_DATA_DIR/pdfs"

  # Create or update service file
  echo "📝 Creating/updating HolaMotor service..."
  sudo tee /etc/systemd/system/holamotor.service > /dev/null <<EOF
[Unit]
Description=HolaMotor Workshop Management
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PORT=8080"
Environment="HOST=0.0.0.0"
Environment="DATA_DIR=$HM_DATA_DIR"
Environment="STATIC_DIR=$PROJECT_DIR/dist/holamotor-taller"
Environment="HOLAMOTOR_LANG=es"
ExecStart=/usr/bin/node $PROJECT_DIR/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
  sudo systemctl daemon-reload
  sudo systemctl enable holamotor
  echo "✅ HolaMotor service configured"
fi

# 3. Stop existing service/container
echo "🛑 Stopping existing service..."
cd "$PROJECT_DIR"

# Check if Docker is available and docker-compose.yml exists
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  docker compose down || true
  echo "✅ Docker containers stopped"
else
  # Check if running with systemd
  sudo systemctl stop holamotor 2>/dev/null || true
  echo "✅ Systemd service stopped"
fi

# 4. Rebuild and start
echo "🔨 Rebuilding and starting application..."
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  docker compose up -d --build
  echo "✅ Docker container rebuilt and started"
else
  # Need to rebuild locally
  if [ -f "package.json" ]; then
    npm install
    npm run build
    sudo systemctl start holamotor
    echo "✅ Application rebuilt and service started"
  fi
fi

# 5. Check status
echo "✅ Checking status..."
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  docker compose ps
else
  sudo systemctl status holamotor --no-pager
fi

echo "🎉 Deployment complete!"
echo "🌐 Access the app at: http://192.168.1.134:8080"
echo "📝 Note: Using Google Translate API for translations (no local service needed)"
