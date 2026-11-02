#!/bin/bash
# Setup script for HolaMotor on OrangePi with persistent data storage
# Run this on your OrangePi

set -e

echo "=== HolaMotor OrangePi Setup ==="
echo ""

# Create persistent data directory in home folder
DATA_DIR="$HOME/holamotor-data"
mkdir -p "$DATA_DIR"
mkdir -p "$DATA_DIR/pdfs"

echo "✓ Created persistent data directory: $DATA_DIR"
echo ""

# Set ownership
chown -R $USER:$USER "$DATA_DIR"

echo "✓ Set ownership for $USER"
echo ""

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
WorkingDirectory=/home/$USER/holamotor-angular
Environment="PORT=8080"
Environment="HOST=0.0.0.0"
Environment="DATA_DIR=$DATA_DIR"
Environment="STATIC_DIR=/home/$USER/holamotor-angular/dist/holamotor-taller"
Environment="HOLAMOTOR_LANG=es"
ExecStart=/usr/bin/node /home/$USER/holamotor-angular/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✓ Created systemd service"
echo ""

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable holamotor.service
sudo systemctl start holamotor.service

echo "✓ Enabled and started HolaMotor service"
echo ""

# Check service status
echo "Service status:"
sudo systemctl status holamotor.service --no-pager

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
