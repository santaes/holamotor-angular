#!/bin/bash
# Deployment script to run ON the Orange Pi
# This script is called by GitHub Actions after rsync
# Supports Arch Linux ARM (pacman) and Debian/Ubuntu (apt)

set -e  # Exit on error

PROJECT_DIR="${1:-$HOME/Desktop/holamotor-angular}"
BACKUP_DIR="$HOME/holamotor-backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

echo "🚀 Deploying HolaMotor with VeriFactu integration..."
echo "📁 Project directory: $PROJECT_DIR"

# 1. Install LibreTranslate (if not already installed)
echo "🌐 Checking LibreTranslate installation..."
if ! command -v libretranslate &> /dev/null; then
  echo "📦 Installing LibreTranslate..."

  # Detect package manager
  if command -v pacman &> /dev/null; then
    # Arch Linux ARM
    echo "Detected Arch Linux ARM (pacman)"
    sudo pacman -Sy --noconfirm python python-pip python-virtualenv git base-devel
  elif command -v apt &> /dev/null; then
    # Debian/Ubuntu
    echo "Detected Debian/Ubuntu (apt)"
    sudo apt update
    sudo apt install -y python3 python3-pip python3-venv git build-essential
  else
    echo "⚠️  Unsupported package manager, skipping LibreTranslate installation"
  fi

  # Create LibreTranslate installation
  LT_DIR="$HOME/libretranslate"
  mkdir -p "$LT_DIR"
  cd "$LT_DIR"

  if command -v pacman &> /dev/null; then
    python -m venv venv
  else
    python3 -m venv venv
  fi

  source venv/bin/activate
  pip install --upgrade pip
  pip install libretranslate

  # Create systemd service
  USER=$(whoami)
  sudo tee /etc/systemd/system/libretranslate.service > /dev/null <<EOF
[Unit]
Description=LibreTranslate Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$LT_DIR
Environment="PATH=$LT_DIR/venv/bin"
ExecStart=$LT_DIR/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

  sudo systemctl daemon-reload
  sudo systemctl enable libretranslate
  sudo systemctl start libretranslate

  echo "✅ LibreTranslate installed and started"
else
  echo "✅ LibreTranslate already installed"
  # Ensure it's running
  sudo systemctl start libretranslate 2>/dev/null || true
fi

# 2. Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
if [ -d "$PROJECT_DIR/data" ]; then
  tar -czf "$BACKUP_DIR/data-backup-$TIMESTAMP.tar.gz" -C "$PROJECT_DIR" data
  echo "✅ Backup created: $BACKUP_DIR/data-backup-$TIMESTAMP.tar.gz"
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

# 6. Check LibreTranslate status
echo "🌐 Checking LibreTranslate status..."
sudo systemctl status libretranslate --no-pager || echo "⚠️  LibreTranslate service not found"

echo "🎉 Deployment complete!"
echo "🌐 Access the app at: http://$(hostname -I | awk '{print $1}'):8080"
