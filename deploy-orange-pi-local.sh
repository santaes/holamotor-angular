#!/bin/bash
# Deployment script to run ON the Orange Pi
# This script is called by GitHub Actions after rsync

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

# 2. Stop existing service/container
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

# 3. Rebuild and start
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

# 4. Check status
echo "✅ Checking status..."
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ]; then
  docker compose ps
else
  sudo systemctl status holamotor --no-pager
fi

echo "🎉 Deployment complete!"
echo "🌐 Access the app at: http://$(hostname -I | awk '{print $1}'):8080"
