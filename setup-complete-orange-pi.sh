#!/bin/bash
# Complete Orange Pi Setup: HolaMotor + LibreTranslate (Native Installation)
# This script sets up both HolaMotor and LibreTranslate directly on Orange Pi without Docker

set -e

echo "🚀 Setting up Orange Pi for HolaMotor with LibreTranslate..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get current user
USER=$(whoami)
HOME_DIR="/home/$USER"

# Step 1: Install system dependencies
echo -e "${YELLOW}📦 Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git build-essential curl
echo -e "${GREEN}✅ System dependencies installed${NC}"
echo ""

# Step 2: Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Node.js...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}✅ Node.js installed${NC}"
else
    echo -e "${GREEN}✅ Node.js already installed${NC}"
fi
echo ""

# Step 3: Install LibreTranslate
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

# Step 4: Create LibreTranslate systemd service
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

# Step 5: Set up HolaMotor data directory
echo -e "${YELLOW}📁 Setting up HolaMotor data directory...${NC}"
HM_DATA_DIR="$HOME_DIR/holamotor-data"
mkdir -p "$HM_DATA_DIR/pdfs"
echo -e "${GREEN}✅ Data directory created at $HM_DATA_DIR${NC}"
echo ""

# Step 6: Create HolaMotor systemd service (assumes server is already in place)
echo -e "${YELLOW}⚙️  Creating HolaMotor service...${NC}"
HM_DIR="$HOME_DIR/holamotor-angular"

# Check if HolaMotor directory exists
if [ ! -d "$HM_DIR" ]; then
    echo -e "${YELLOW}⚠️  HolaMotor directory not found at $HM_DIR${NC}"
    echo "Please deploy HolaMotor first, then run this script again"
    echo "Or update the HM_DIR variable in this script"
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

# Step 7: Verify services
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
