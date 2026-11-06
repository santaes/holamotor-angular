#!/bin/bash
# Install LibreTranslate on Arch Linux ARM (Orange Pi)

set -e

echo "🔧 Installing LibreTranslate on Arch Linux ARM..."

# Update system
echo "🔄 Updating system packages..."
sudo pacman -Sy

# Install dependencies
echo "📦 Installing Python and dependencies..."
sudo pacman -S --noconfirm python python-pip python-virtualenv git base-devel

# Create directory for LibreTranslate
LT_DIR="$HOME/libretranslate"
mkdir -p "$LT_DIR"
cd "$LT_DIR"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python -m venv venv
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install LibreTranslate
echo "🌐 Installing LibreTranslate..."
pip install libretranslate

# Create systemd service file
echo "⚙️  Creating systemd service..."
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

# Enable and start service
echo "🚀 Starting LibreTranslate service..."
sudo systemctl daemon-reload
sudo systemctl enable libretranslate
sudo systemctl start libretranslate

echo "✅ LibreTranslate installed and started!"
echo "📊 Check status with: sudo systemctl status libretranslate"
echo "🌐 Translation service running at: http://localhost:5000"
echo ""
echo "Note: First startup may take a few minutes to download translation models"
