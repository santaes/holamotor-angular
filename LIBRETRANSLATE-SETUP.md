# LibreTranslate Setup on Orange Pi

This guide covers installing LibreTranslate directly on Orange Pi (without Docker) to work with HolaMotor.

## Why Install LibreTranslate Directly?

- **Better Performance**: Native Python execution is faster than Docker on ARM
- **Less Resource Usage**: No Docker overhead
- **Easier Integration**: Direct HTTP access from HolaMotor
- **Persistent Models**: Models stay cached across reboots

## Quick Installation

### Step 1: Copy the installation script to Orange Pi

From your Windows machine:
```bash
scp install-libretranslate.sh pi@orangepi-ip:~/
```

### Step 2: Run the installation script

```bash
ssh pi@orangepi-ip
cd ~
chmod +x install-libretranslate.sh
./install-libretranslate.sh
```

This will:
- Install Python 3 and dependencies
- Create a virtual environment
- Install LibreTranslate
- Set up a systemd service
- Start LibreTranslate on port 5000

### Step 3: Verify installation

```bash
# Check service status
sudo systemctl status libretranslate

# Test the API
curl http://localhost:5000/specs

# Test translation
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q": "Hello", "source": "en", "target": "es"}'
```

## Manual Installation (Alternative)

If you prefer to install manually:

### 1. Install dependencies

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv git build-essential
```

### 2. Create installation directory

```bash
mkdir -p ~/libretranslate
cd ~/libretranslate
```

### 3. Create virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
```

### 4. Install LibreTranslate

```bash
pip install --upgrade pip
pip install libretranslate
```

### 5. Create systemd service

```bash
sudo nano /etc/systemd/system/libretranslate.service
```

Paste this content:
```ini
[Unit]
Description=LibreTranslate Service
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/libretranslate
Environment="PATH=/home/pi/libretranslate/venv/bin"
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 6. Enable and start service

```bash
sudo systemctl daemon-reload
sudo systemctl enable libretranslate
sudo systemctl start libretranslate
```

## Configure HolaMotor to Use Local LibreTranslate

### Option 1: Update docker-compose.yml

If running HolaMotor in Docker, use the provided `docker-compose-local-libretranslate.yml`:

```bash
docker-compose -f docker-compose-local-libretranslate.yml up -d --build
```

This configuration uses `host.docker.internal` to access LibreTranslate running on the host.

### Option 2: Set environment variable

If running HolaMotor natively (no Docker):

```bash
export LIBRETRANSLATE_URL=http://localhost:5000
```

Then start the HolaMotor server.

### Option 3: Update server code

In your HolaMotor server code, ensure it uses the LibreTranslate URL from environment variable:

```javascript
const libreTranslateUrl = process.env.LIBRETRANSLATE_URL || 'http://localhost:5000';
```

## Service Management

```bash
# Start LibreTranslate
sudo systemctl start libretranslate

# Stop LibreTranslate
sudo systemctl stop libretranslate

# Restart LibreTranslate
sudo systemctl restart libretranslate

# Check status
sudo systemctl status libretranslate

# View logs
sudo journalctl -u libretranslate -f

# Disable auto-start
sudo systemctl disable libretranslate
```

## Configuration Options

### Change port

Edit the service file:
```bash
sudo nano /etc/systemd/system/libretranslate.service
```

Change the port in `ExecStart`:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 6000
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart libretranslate
```

### Add more languages

Edit the `--load-only` parameter in the service file:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar,ko,nl,pl,tr
```

Available language codes: https://github.com/LibreTranslate/LibreTranslate#supported-languages

### Enable API authentication

Edit the service file to add `--api-keys`:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar --api-keys
```

Then generate an API key:
```bash
cd ~/libretranslate
source venv/bin/activate
libretranslate --generate-api-key
```

## Performance Optimization

### Limit memory usage

Edit the service file to add memory limits:
```ini
[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/libretranslate
Environment="PATH=/home/pi/libretranslate/venv/bin"
MemoryLimit=512M
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar
```

### Use only essential languages

The more languages you load, the more memory LibreTranslate uses. For Spanish/English only:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es
```

## Troubleshooting

### Service won't start

```bash
# Check logs
sudo journalctl -u libretranslate -n 50

# Common issues:
# - Python not installed: sudo apt install python3
# - Port already in use: sudo lsof -i :5000
# - Permission denied: ensure user has write access to ~/libretranslate
```

### Models not downloading

```bash
# Check disk space
df -h

# Manually download models
cd ~/libretranslate
source venv/bin/activate
libretranslate --download-models
```

### Can't access from other devices

```bash
# Check if listening on all interfaces
sudo netstat -tlnp | grep 5000

# Should show: 0.0.0.0:5000 (not 127.0.0.1:5000)

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp
```

### HolaMotor can't connect

If HolaMotor is in Docker:
- Use `docker-compose-local-libretranslate.yml` which includes `host.docker.internal`
- Ensure LibreTranslate is running on the host (not in Docker)

If HolaMotor is native:
- Ensure `LIBRETRANSLATE_URL` is set correctly
- Test with: `curl http://localhost:5000/specs`

## Upgrade LibreTranslate

```bash
cd ~/libretranslate
source venv/bin/activate
pip install --upgrade libretranslate
sudo systemctl restart libretranslate
```

## Uninstall LibreTranslate

```bash
# Stop and disable service
sudo systemctl stop libretranslate
sudo systemctl disable libretranslate

# Remove service file
sudo rm /etc/systemd/system/libretranslate.service
sudo systemctl daemon-reload

# Remove installation directory
rm -rf ~/libretranslate
```

## Integration with HolaMotor

Once LibreTranslate is running on port 5000, HolaMotor will automatically use it for:

- Customer name translation
- Invoice item translation
- Service description translation
- Any text that needs to be localized

The translation API endpoint is:
- **HTTP:** `http://localhost:5000/translate`
- **Method:** POST
- **Body:** `{"q": "text", "source": "en", "target": "es"}`

## Security Notes

- LibreTranslate runs on port 5000 - consider restricting access with firewall
- Use API keys if exposing the service to external networks
- Keep LibreTranslate updated for security patches
- Only load the languages you actually need to reduce attack surface
