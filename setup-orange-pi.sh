#!/bin/bash
# Setup script for HolaMotor on OrangePi with persistent data storage
# Run this on your OrangePi

set -e

echo "=== HolaMotor OrangePi Setup ==="
echo ""

# Detect user's primary group
USER_GROUP=$(id -gn $USER)
echo "User: $USER, Group: $USER_GROUP"
echo ""

# Create persistent data directory in home folder
DATA_DIR="$HOME/holamotor-data"
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/pdfs"

echo "✓ Created persistent data directory: $DATA_DIR"
echo ""

# Set ownership using detected group
chown -R $USER:$USER_GROUP "$DATA_DIR"

echo "✓ Set ownership for $USER:$USER_GROUP"
echo ""

# Check if project directory exists
PROJECT_DIR="$HOME/holamotor-angular"
if [ ! -d "$PROJECT_DIR" ]; then
    echo "⚠ Project directory not found: $PROJECT_DIR"
    echo "Please copy the project to this location first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "$PROJECT_DIR/node_modules" ]; then
    echo "Installing npm dependencies..."
    cd "$PROJECT_DIR"
    npm install
    echo "✓ Dependencies installed"
    echo ""
fi

# Build the project if dist doesn't exist
if [ ! -d "$PROJECT_DIR/dist/holamotor-taller" ]; then
    echo "Building Angular project..."
    cd "$PROJECT_DIR"
    npm run build
    echo "✓ Project built"
    echo ""
fi

# Create systemd service file
SERVICE_FILE="/etc/systemd/system/holamotor.service"
echo "Creating systemd service: $SERVICE_FILE"

cat <<EOF | sudo tee "$SERVICE_FILE" > /dev/null
[Unit]
Description=HolaMotor Workshop Management
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$PROJECT_DIR
Environment="PORT=8080"
Environment="HOST=0.0.0.0"
Environment="DATA_DIR=$DATA_DIR"
Environment="STATIC_DIR=$PROJECT_DIR/dist/holamotor-taller"
Environment="HOLAMOTOR_LANG=es"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Created systemd service"
echo ""

# Stop existing service if running
if systemctl is-active --quiet holamotor; then
    echo "Stopping existing service..."
    sudo systemctl stop holamotor
fi

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable holamotor.service
sudo systemctl start holamotor.service

echo "✓ Enabled and started HolaMotor service"
echo ""

# Wait a moment for service to start
sleep 3

# Check service status
echo "Service status:"
sudo systemctl status holamotor.service --no-pager || true

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Data will be persisted in: $DATA_DIR"
echo ""
echo "Useful commands:"
echo "  Check status: sudo systemctl status holamotor"
echo "  Restart:      sudo systemctl restart holamotor"
echo "  Stop:         sudo systemctl stop holamotor"
echo "  View logs:    sudo journalctl -u holamotor -f"
echo ""
echo "Data files location:"
echo "  ls -la $DATA_DIR"
