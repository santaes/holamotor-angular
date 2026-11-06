#!/bin/bash
# Universal Complete Orange Pi Setup: HolaMotor + LibreTranslate
# Supports: apt (Debian/Ubuntu), apk (Alpine), yum/dnf (Fedora/RHEL), pacman (Arch), zypper (openSUSE)

set -e

echo "🚀 Setting up Orange Pi for HolaMotor with LibreTranslate..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect package manager
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
    PKG_UPDATE="sudo apt update"
    PKG_INSTALL="sudo apt install -y"
    PYTHON_PKG="python3 python3-pip python3-venv git build-essential"
    NODE_INSTALL="curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
elif command -v apk &> /dev/null; then
    PKG_MANAGER="apk"
    PKG_UPDATE="sudo apk update"
    PKG_INSTALL="sudo apk add --no-cache"
    PYTHON_PKG="python3 py3-pip py3-virtualenv git build-base"
    NODE_INSTALL="sudo apk add --no-cache nodejs npm"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
    PKG_UPDATE="sudo dnf update -y"
    PKG_INSTALL="sudo dnf install -y"
    PYTHON_PKG="python3 python3-pip git gcc"
    NODE_INSTALL="sudo dnf install -y nodejs npm"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
    PKG_UPDATE="sudo yum update -y"
    PKG_INSTALL="sudo yum install -y"
    PYTHON_PKG="python3 python3-pip git gcc"
    NODE_INSTALL="sudo yum install -y nodejs npm"
elif command -v pacman &> /dev/null; then
    PKG_MANAGER="pacman"
    PKG_UPDATE="sudo pacman -Sy"
    PKG_INSTALL="sudo pacman -S --noconfirm"
    PYTHON_PKG="python python-pip python-virtualenv git base-devel"
    NODE_INSTALL="sudo pacman -S --noconfirm nodejs npm"
elif command -v zypper &> /dev/null; then
    PKG_MANAGER="zypper"
    PKG_UPDATE="sudo zypper refresh"
    PKG_INSTALL="sudo zypper install -y"
    PYTHON_PKG="python3 python3-pip python3-venv git gcc"
    NODE_INSTALL="sudo zypper install -y nodejs npm"
else
    echo "❌ Error: No supported package manager found"
    exit 1
fi

echo -e "${YELLOW}📦 Detected package manager: $PKG_MANAGER${NC}"

# Get current user
USER=$(whoami)
HOME_DIR="/home/$USER"

# Step 1: Update system
echo -e "${YELLOW}🔄 Updating system packages...${NC}"
$PKG_UPDATE

# Step 2: Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    eval $NODE_INSTALL
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi
echo ""

# Step 3: Install Python dependencies
echo -e "${YELLOW}📦 Installing Python and dependencies...${NC}"
$PKG_INSTALL $PYTHON_PKG

# Ensure pip is available
if ! command -v pip3 &> /dev/null; then
    echo -e "${YELLOW}📦 Installing pip...${NC}"
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
echo -e "${GREEN}✅ Python dependencies installed${NC}"
echo ""

# Step 4: Install LibreTranslate
echo -e "${YELLOW}🌐 Installing LibreTranslate...${NC}"
LT_DIR="$HOME_DIR/libretranslate"
mkdir -p "$LT_DIR"
cd "$LT_DIR"

python3 -m venv venv
source venv/bin/activate

pip install --upgrade pip
pip install libretranslate

echo -e "${GREEN}✅ LibreTranslate installed${NC}"
echo ""

# Step 5: Create LibreTranslate systemd service
echo -e "${YELLOW}⚙️  Creating LibreTranslate service...${NC}"
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
echo -e "${GREEN}✅ LibreTranslate service created and started${NC}"
echo ""

# Step 6: Set up HolaMotor data directory
echo -e "${YELLOW}📁 Setting up HolaMotor data directory...${NC}"
HM_DATA_DIR="$HOME_DIR/holamotor-data"
mkdir -p "$HM_DATA_DIR/pdfs"
echo -e "${GREEN}✅ Data directory created at $HM_DATA_DIR${NC}"
echo ""

# Step 7: Create HolaMotor systemd service
echo -e "${YELLOW}⚙️  Creating HolaMotor service...${NC}"
HM_DIR="$HOME_DIR/holamotor-angular"

# Check if HolaMotor directory exists
if [ ! -d "$HM_DIR" ]; then
    echo -e "${YELLOW}⚠️  HolaMotor directory not found at $HM_DIR${NC}"
    echo "Please deploy HolaMotor first, then run this script again"
    exit 1
fi

sudo tee /etc/systemd/system/holamotor.service > /dev/null <<EOF
[Unit]
Description=HolaMotor Workshop Management
After=network.target libretranslate.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HM_DIR
Environment="PORT=8080"
Environment="HOST=0.0.0.0"
Environment="DATA_DIR=$HM_DATA_DIR"
Environment="STATIC_DIR=$HM_DIR/dist/holamotor-taller"
Environment="HOLAMOTOR_LANG=es"
Environment="LIBRETRANSLATE_URL=http://localhost:5000"
ExecStart=/usr/bin/node $HM_DIR/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable holamotor
sudo systemctl start holamotor
echo -e "${GREEN}✅ HolaMotor service created and started${NC}"
echo ""

# Step 8: Verify services
echo -e "${YELLOW}🔍 Verifying services...${NC}"
sleep 5

echo ""
echo "=== LibreTranslate Status ==="
sudo systemctl status libretranslate --no-pager || true

echo ""
echo "=== HolaMotor Status ==="
sudo systemctl status holamotor --no-pager || true

echo ""
echo "=== Testing LibreTranslate API ==="
if command -v curl &> /dev/null; then
    if curl -s http://localhost:5000/specs > /dev/null; then
        echo -e "${GREEN}✅ LibreTranslate API is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  LibreTranslate API not responding yet (may need more time to start)${NC}"
    fi

    echo ""
    echo "=== Testing HolaMotor ==="
    if curl -s http://localhost:8080 > /dev/null; then
        echo -e "${GREEN}✅ HolaMotor is responding${NC}"
    else
        echo -e "${YELLOW}⚠️  HolaMotor not responding yet (may need more time to start)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available, skipping API tests${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Services running:"
echo "  - LibreTranslate: http://localhost:5000"
echo "  - HolaMotor: http://localhost:8080"
echo ""
echo "Service management commands:"
echo "  sudo systemctl status libretranslate"
echo "  sudo systemctl status holamotor"
echo "  sudo journalctl -u libretranslate -f"
echo "  sudo journalctl -u holamotor -f"
echo ""
echo "Data directory: $HM_DATA_DIR"
echo "LibreTranslate directory: $LT_DIR"
echo ""
