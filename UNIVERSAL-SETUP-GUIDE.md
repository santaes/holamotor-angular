# Universal Orange Pi Setup Guide

Your Orange Pi is running a Linux distribution that doesn't use `apt` (likely Alpine, Fedora, Arch, or another distro). This guide provides universal installation scripts that work with any package manager.

## Quick Start

### Step 1: Detect your OS

First, let's identify what Linux distribution your Orange Pi is running:

```bash
# Copy the detection script to Orange Pi
scp detect-os.sh oem@orange-os:~/

# SSH into Orange Pi and run it
ssh oem@orange-os
chmod +x detect-os.sh
./detect-os.sh
```

This will show you:
- The Linux distribution
- Available package manager (apk, dnf, yum, pacman, zypper, or apt)
- Python and Node.js status
- System information

### Step 2: Run the universal installation script

Based on the detection, use the appropriate universal script:

**Option A: Install LibreTranslate only**
```bash
scp install-libretranslate-universal.sh oem@orange-os:~/
ssh oem@orange-os
chmod +x install-libretranslate-universal.sh
./install-libretranslate-universal.sh
```

**Option B: Complete setup (HolaMotor + LibreTranslate)**
```bash
scp setup-complete-orange-pi-universal.sh oem@orange-os:~/
ssh oem@orange-os
chmod +x setup-complete-orange-pi-universal.sh
```

## Supported Distributions

The universal scripts automatically detect and work with:

| Distribution | Package Manager | Status |
|-------------|----------------|--------|
| Debian/Ubuntu | apt | ✅ Supported |
| Alpine Linux | apk | ✅ Supported |
| Fedora | dnf | ✅ Supported |
| RHEL/CentOS | yum | ✅ Supported |
| Arch Linux | pacman | ✅ Supported |
| openSUSE | zypper | ✅ Supported |

## What the Scripts Do

### install-libretranslate-universal.sh
1. Detects available package manager
2. Updates system packages
3. Installs Python 3, pip, venv, git, and build tools
4. Creates Python virtual environment
5. Installs LibreTranslate
6. Creates systemd service
7. Starts LibreTranslate on port 5000

### setup-complete-orange-pi-universal.sh
1. Detects available package manager
2. Updates system packages
3. Installs Node.js (if not present)
4. Installs Python and dependencies
5. Installs LibreTranslate with systemd service
6. Sets up HolaMotor data directory
7. Creates HolaMotor systemd service
8. Configures HolaMotor to use LibreTranslate
9. Starts both services

## Manual Installation (If Scripts Fail)

If the universal scripts don't work, you can install manually based on your detected OS:

### Alpine Linux (apk)
```bash
sudo apk update
sudo apk add --no-cache python3 py3-pip py3-virtualenv git build-base nodejs npm

# LibreTranslate
mkdir -p ~/libretranslate
cd ~/libretranslate
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install libretranslate
```

### Fedora (dnf)
```bash
sudo dnf update -y
sudo dnf install -y python3 python3-pip git gcc nodejs npm

# LibreTranslate
mkdir -p ~/libretranslate
cd ~/libretranslate
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install libretranslate
```

### Arch Linux (pacman)
```bash
sudo pacman -Sy
sudo pacman -S --noconfirm python python-pip python-virtualenv git base-devel nodejs npm

# LibreTranslate
mkdir -p ~/libretranslate
cd ~/libretranslate
python -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install libretranslate
```

### RHEL/CentOS (yum)
```bash
sudo yum update -y
sudo yum install -y python3 python3-pip git gcc nodejs npm

# LibreTranslate
mkdir -p ~/libretranslate
cd ~/libretranslate
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install libretranslate
```

### openSUSE (zypper)
```bash
sudo zypper refresh
sudo zypper install -y python3 python3-pip python3-venv git gcc nodejs npm

# LibreTranslate
mkdir -p ~/libretranslate
cd ~/libretranslate
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install libretranslate
```

## Creating Systemd Service (Manual)

After manual installation, create the service file:

```bash
sudo nano /etc/systemd/system/libretranslate.service
```

Paste this content (replace `oem` with your username):
```ini
[Unit]
Description=LibreTranslate Service
After=network.target

[Service]
Type=simple
User=oem
WorkingDirectory=/home/oem/libretranslate
Environment="PATH=/home/oem/libretranslate/venv/bin"
ExecStart=/home/oem/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable libretranslate
sudo systemctl start libretranslate
```

## Verification

```bash
# Check service status
sudo systemctl status libretranslate

# Test API
curl http://localhost:5000/specs

# Test translation
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q": "Hello", "source": "en", "target": "es"}'
```

## Troubleshooting

### "Package manager not found"
The script couldn't detect a supported package manager. Check the output of `detect-os.sh` and install dependencies manually using the instructions above.

### "Python venv not available"
Some distributions require separate installation of venv:
- Alpine: `sudo apk add py3-virtualenv`
- Fedora: `sudo dnf install python3-venv`
- Arch: Included with python
- RHEL: `sudo yum install python3-venv`

### "pip not available"
Install pip manually:
```bash
curl https://bootstrap.pypa.io/get-pip.py -o get-pip.py
sudo python3 get-pip.py
rm get-pip.py
```

### "systemd not available"
If your system doesn't use systemd, you'll need to use an alternative init system (OpenRC, SysVinit, etc.). Create a startup script in your init system's location instead.

### Service won't start
```bash
# Check logs
sudo journalctl -u libretranslate -n 50

# Check if port is in use
sudo lsof -i :5000

# Test manually
cd ~/libretranslate
source venv/bin/activate
libretranslate --host 0.0.0.0 --port 5000
```

## Alternative: Use Docker

If native installation is problematic, you can use Docker (if available):

```bash
# Check if Docker is installed
docker --version

# If not installed, install based on your OS
# Alpine: sudo apk add docker
# Fedora: sudo dnf install docker
# Arch: sudo pacman -S docker

# Run LibreTranslate in Docker
docker run -d --name libretranslate \
  -p 5000:5000 \
  -v libretranslate-local:/home/libretranslate/.local \
  -e LT_LOAD_ONLY=en,es,fr,de,it,pt,ru,ja,zh,ar \
  libretranslate/libretranslate:latest \
  --host 0.0.0.0 --port 5000
```

## Next Steps

After LibreTranslate is installed:

1. **Configure HolaMotor** to use the local LibreTranslate:
   - If running natively: `export LIBRETRANSLATE_URL=http://localhost:5000`
   - If running in Docker: Use `docker-compose-local-libretranslate.yml`

2. **Verify integration** by testing translation in the HolaMotor app

3. **Monitor performance** and adjust language list if needed

## Additional Resources

- [LIBRETRANSLATE-SETUP.md](./LIBRETRANSLATE-SETUP.md) - Detailed LibreTranslate guide
- [ORANGEPI_SETUP.md](./ORANGEPI_SETUP.md) - HolaMotor setup
- [SETUP-ORANGE-PI-COMPLETE.md](./SETUP-ORANGE-PI-COMPLETE.md) - Complete setup (Debian/Ubuntu)
