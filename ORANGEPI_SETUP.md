# OrangePi Setup Guide for Persistent Data

## Problem
Data disappears when you restart the OrangePi because the data directory is in a temporary location.

## Solution
Configure the server to use a persistent data directory in your home folder.

## Quick Setup (Recommended)

### Step 1: Copy the setup script to your OrangePi
```bash
# From your Windows machine, copy setup-orange-pi.sh to your OrangePi
# Using SCP:
scp setup-orange-pi.sh pi@orangepi-ip:~/
```

### Step 2: Run the setup script on OrangePi
```bash
ssh pi@orangepi-ip
cd ~
chmod +x setup-orange-pi.sh
./setup-orange-pi.sh
```

### Step 3: Verify it's working
```bash
# Check service status
sudo systemctl status holamotor

# Check data directory
ls -la ~/holamotor-data

# View logs
sudo journalctl -u holamotor -f
```

## Manual Setup (Alternative)

If you prefer to do it manually:

### 1. Create persistent data directory
```bash
mkdir -p ~/holamotor-data/pdfs
```

### 2. Create systemd service
```bash
sudo nano /etc/systemd/system/holamotor.service
```

Paste this content (replace `pi` with your username if different):
```ini
[Unit]
Description=HolaMotor Workshop Management
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/holamotor-angular
Environment="PORT=8080"
Environment="HOST=0.0.0.0"
Environment="DATA_DIR=/home/pi/holamotor-data"
Environment="STATIC_DIR=/home/pi/holamotor-angular/dist/holamotor-taller"
Environment="HOLAMOTOR_LANG=es"
ExecStart=/usr/bin/node /home/pi/holamotor-angular/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable holamotor.service
sudo systemctl start holamotor.service
```

## Current vs New Setup

### Before (Data Lost on Reboot)
- Data stored in: `./data` (relative to server location)
- Lost when OrangePi restarts

### After (Data Persists)
- Data stored in: `~/holamotor-data` (in your home folder)
- Persists across reboots
- Automatically backed up by SD card

## Service Management Commands

```bash
# Start the service
sudo systemctl start holamotor

# Stop the service
sudo systemctl stop holamotor

# Restart the service
sudo systemctl restart holamotor

# Check status
sudo systemctl status holamotor

# View logs
sudo journalctl -u holamotor -f

# Disable from auto-start
sudo systemctl disable holamotor
```

## Verify Data Persistence

1. Add some data in the app (create a customer, invoice, etc.)
2. Restart the OrangePi: `sudo reboot`
3. After reboot, check if data is still there:
   ```bash
   ls -la ~/holamotor-data
   ```
4. Open the app in browser - data should be present

## Troubleshooting

### Service won't start
```bash
# Check logs for errors
sudo journalctl -u holamotor -n 50

# Common issues:
# - Node.js not found: install with sudo apt install nodejs
# - Port already in use: change PORT in service file
# - Missing directory: ensure ~/holamotor-angular exists
```

### Data still not persisting
```bash
# Check if data directory is being used
sudo journalctl -u holamotor | grep "data:"

# Should show: "datos: /home/pi/holamotor-data"
```

### Access from other devices
```bash
# Find your OrangePi IP
ip addr show

# Access from browser: http://orangepi-ip:8080
```

## Backup Your Data

To backup your data:
```bash
# Create backup
tar -czf holamotor-backup-$(date +%Y%m%d).tar.gz ~/holamotor-data

# Copy to another location
scp holamotor-backup-*.tar.gz user@backup-server:/path/to/backup/
```

## Restore from Backup

```bash
# Stop service
sudo systemctl stop holamotor

# Restore backup
tar -xzf holamotor-backup-YYYYMMDD.tar.gz -C ~/

# Start service
sudo systemctl start holamotor
```
