#!/bin/bash
# Universal LibreTranslate Installation Script
# Supports: apt (Debian/Ubuntu), apk (Alpine), yum/dnf (Fedora/RHEL), pacman (Arch), zypper (openSUSE)

set -e

echo "🔧 Installing LibreTranslate on Orange Pi..."

# Detect package manager
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
    PKG_UPDATE="sudo apt update"
    PKG_INSTALL="sudo apt install -y"
    PYTHON_PKG="python3 python3-pip python3-venv git build-essential"
elif command -v apk &> /dev/null; then
    PKG_MANAGER="apk"
    PKG_UPDATE="sudo apk update"
    PKG_INSTALL="sudo apk add --no-cache"
    PYTHON_PKG="python3 py3-pip py3-virtualenv git build-base"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_UPDATE="sudo dnf update -y"
    PKG_INSTALL="sudo dnf install -y"
    PYTHON_PKG="python3 python3-pip git gcc"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_UPDATE="sudo yum update -y"
    PKG_INSTALL="sudo yum install -y"
    PYTHON_PKG="python3 python3-pip git gcc"
elif command -v pacman &> /dev/null; then
    PKG_MANAGER="pacman"
    PKG_UPDATE="sudo pacman -Sy"
    PKG_INSTALL="sudo pacman -S --noconfirm"
    PYTHON_PKG="python python-pip python-virtualenv git base-devel"
elif command -v zypper &> /dev/null; then
    PKG_MANAGER="zypper"
    PKG_UPDATE="sudo zypper refresh"
    PKG_INSTALL="sudo zypper install -y"
    PYTHON_PKG="python3 python3-pip python3-venv git gcc"
else
    echo "❌ Error: No supported package manager found (apt, apk, dnf, yum, pacman, zypper)"
    echo "Please install Python 3, pip, venv, and git manually"
    exit 1
fi

echo "📦 Detected package manager: $PKG_MANAGER"

# Update system
echo "🔄 Updating system packages..."
$PKG_UPDATE

# Install Python and dependencies
echo "📦 Installing Python and dependencies..."
$PKG_INSTALL $PYTHON_PKG

# Ensure pip is available
if ! command -v pip3 &> /dev/null; then
    echo "📦 Installing pip..."
    if [ "$PKG_MANAGER" = "apk" ]; then
        sudo apk add --no-cache py3-pip
    elif [ "$PKG_MANAGER" = "pacman" ]; then
        sudo pacman -S --noconfirm python-pip
    else
        curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
        sudo python3 get-pip.py
        rm get-pip.py
    fi
fi

# Create directory for LibreTranslate
LT_DIR="$HOME/libretranslate"
mkdir -p "$LT_DIR"
cd "$LT_DIR"

# Create virtual environment
echo "🐍 Creating Python virtual environment..."
python3 -m venv venv
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
