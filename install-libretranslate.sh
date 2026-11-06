#!/bin/bash
# Install LibreTranslate directly on Orange Pi (without Docker)

set -e

echo "🔧 Installing LibreTranslate on Orange Pi..."

# Update system
sudo apt update

# Install Python and dependencies
sudo apt install -y python3 python3-pip python3-venv git build-essential

# Create directory for LibreTranslate
LT_DIR="$HOME/libretranslate"
mkdir -p "$LT_DIR"
cd "$LT_DIR"

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install LibreTranslate
pip install --upgrade pip
pip install libretranslate

# Create systemd service file
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
sudo systemctl daemon-reload
sudo systemctl enable libretranslate
sudo systemctl start libretranslate

echo "✅ LibreTranslate installed and started!"
echo "📊 Check status with: sudo systemctl status libretranslate"
echo "🌐 Translation service running at: http://localhost:5000"
