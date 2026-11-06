# Complete Orange Pi Setup Guide

This guide provides complete setup instructions for deploying HolaMotor with LibreTranslate on Orange Pi.

## Setup Options

### Option 1: Complete Setup (Recommended)

Use `setup-complete-orange-pi.sh` to install both HolaMotor and LibreTranslate in one go.

**Prerequisites:**
- HolaMotor already deployed to Orange Pi (in `~/holamotor-angular`)
- SSH access to Orange Pi

**Steps:**

1. Copy the setup script to Orange Pi:
   ```bash
   scp setup-complete-orange-pi.sh pi@orangepi-ip:~/
   ```

2. SSH into Orange Pi and run the script:
   ```bash
   ssh pi@orangepi-ip
   cd ~
   chmod +x setup-complete-orange-pi.sh
   ./setup-complete-orange-pi.sh
   ```

This will:
- Install Python 3, Node.js, and dependencies
- Install LibreTranslate with virtual environment
- Create systemd service for LibreTranslate (port 5000)
- Set up persistent data directory for HolaMotor
- Create systemd service for HolaMotor (port 8080)
- Configure HolaMotor to use local LibreTranslate
- Start both services

### Option 2: LibreTranslate Only

If HolaMotor is already set up and you only need LibreTranslate:

1. Use the dedicated installation script:
   ```bash
   scp install-libretranslate.sh pi@orangepi-ip:~/
   ssh pi@orangepi-ip
   cd ~
   chmod +x install-libretranslate.sh
   ./install-libretranslate.sh
   ```

2. Update HolaMotor to use LibreTranslate:
   - If using Docker: switch to `docker-compose-local-libretranslate.yml`
   - If running natively: set `LIBRETRANSLATE_URL=http://localhost:5000`

See [LIBRETRANSLATE-SETUP.md](./LIBRETRANSLATE-SETUP.md) for detailed instructions.

### Option 3: Docker-Based Setup

If you prefer to run everything in Docker:

1. Use the standard `docker-compose.yml` which includes LibreTranslate as a container
2. See [DEPLOY-ORANGE-PI.md](./DEPLOY-ORANGE-PI.md) for deployment instructions

## Architecture Comparison

### Native Installation (Options 1 & 2)
```
Orange Pi (Host)
├── LibreTranslate (Python, port 5000)
│   └── Virtual environment in ~/libretranslate
└── HolaMotor (Node.js, port 8080)
    └── Running from ~/holamotor-angular
    └── Data in ~/holamotor-data
```

**Pros:**
- Better performance on ARM
- Less resource usage
- Easier debugging
- Direct file access

**Cons:**
- Manual dependency management
- No container isolation

### Docker-Based (Option 3)
```
Orange Pi (Host)
└── Docker
    ├── LibreTranslate container (port 5000)
    └── HolaMotor container (port 8080)
```

**Pros:**
- Container isolation
- Easier updates
- Consistent environment
- Volume management

**Cons:**
- Docker overhead on ARM
- Slightly slower performance
- More complex networking

## Verification

After setup, verify both services are running:

```bash
# Check LibreTranslate
sudo systemctl status libretranslate
curl http://localhost:5000/specs

# Check HolaMotor
sudo systemctl status holamotor
curl http://localhost:8080

# Test translation
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q": "Hello", "source": "en", "target": "es"}'
```

## Service Management

### LibreTranslate
```bash
sudo systemctl start libretranslate
sudo systemctl stop libretranslate
sudo systemctl restart libretranslate
sudo systemctl status libretranslate
sudo journalctl -u libretranslate -f
```

### HolaMotor
```bash
sudo systemctl start holamotor
sudo systemctl stop holamotor
sudo systemctl restart holamotor
sudo systemctl status holamotor
sudo journalctl -u holamotor -f
```

## Configuration

### Change Ports

**LibreTranslate:**
Edit `/etc/systemd/system/libretranslate.service`:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 6000
```

**HolaMotor:**
Edit `/etc/systemd/system/holamotor.service`:
```ini
Environment="PORT=9000"
```

Then reload:
```bash
sudo systemctl daemon-reload
sudo systemctl restart libretranslate
sudo systemctl restart holamotor
```

### Add More Languages

Edit LibreTranslate service file:
```ini
ExecStart=/home/pi/libretranslate/venv/bin/libretranslate --host 0.0.0.0 --port 5000 --load-only en,es,fr,de,it,pt,ru,ja,zh,ar,ko,nl,pl,tr
```

See [LIBRETRANSLATE-SETUP.md](./LIBRETRANSLATE-SETUP.md) for available languages.

## Data Persistence

### HolaMotor Data
- Location: `~/holamotor-data`
- Backed up by SD card
- Persists across reboots

### LibreTranslate Models
- Location: `~/libretranslate/venv/lib/python3.x/site-packages/argos-translate/packages`
- Downloaded on first use
- Persists across reboots

## Troubleshooting

### Services won't start
```bash
# Check logs
sudo journalctl -u libretranslate -n 50
sudo journalctl -u holamotor -n 50

# Common issues:
# - Port already in use: sudo lsof -i :5000 or :8080
# - Missing dependencies: reinstall with setup script
# - Permission denied: check file permissions
```

### Can't access from other devices
```bash
# Check if listening on all interfaces
sudo netstat -tlnp | grep -E '5000|8080'

# Should show: 0.0.0.0:5000 and 0.0.0.0:8080

# Check firewall
sudo ufw status
sudo ufw allow 5000/tcp
sudo ufw allow 8080/tcp
```

### LibreTranslate models not downloading
```bash
# Check disk space
df -h

# Manually trigger download
cd ~/libretranslate
source venv/bin/activate
libretranslate --download-models
```

### HolaMotor can't connect to LibreTranslate
```bash
# Test LibreTranslate API directly
curl http://localhost:5000/specs

# Check environment variable in HolaMotor service
sudo systemctl show holamotor --property=Environment

# Should include: LIBRETRANSLATE_URL=http://localhost:5000
```

## Updates

### Update LibreTranslate
```bash
cd ~/libretranslate
source venv/bin/activate
pip install --upgrade libretranslate
sudo systemctl restart libretranslate
```

### Update HolaMotor
```bash
cd ~/holamotor-angular
git pull  # or copy new files
npm install
npm run build
sudo systemctl restart holamotor
```

## Performance Tips

1. **Load only necessary languages** - More languages = more memory
2. **Use SSD instead of SD card** - Better I/O performance
3. **Monitor resource usage** - `htop` or `top`
4. **Add swap if needed** - Prevent OOM on model loading
5. **Limit memory in systemd** - Add `MemoryLimit=512M` to service files

## Security

- LibreTranslate is accessible on port 5000 - consider firewall rules
- Only expose to Tailscale network for external access
- Use API keys if exposing to public internet
- Keep both services updated regularly
- Monitor logs for suspicious activity

## Backup Strategy

### Backup HolaMotor data
```bash
tar -czf holamotor-backup-$(date +%Y%m%d).tar.gz ~/holamotor-data
```

### Backup LibreTranslate models (optional)
```bash
tar -czf libretranslate-models-$(date +%Y%m%d).tar.gz ~/libretranslate/venv/lib/python3.x/site-packages/argos-translate/packages
```

### Backup configuration
```bash
tar -czf services-backup-$(date +%Y%m%d).tar.gz /etc/systemd/system/libretranslate.service /etc/systemd/system/holamotor.service
```

## Additional Documentation

- [ORANGEPI_SETUP.md](./ORANGEPI_SETUP.md) - HolaMotor setup details
- [LIBRETRANSLATE-SETUP.md](./LIBRETRANSLATE-SETUP.md) - LibreTranslate detailed guide
- [DEPLOY-ORANGE-PI.md](./DEPLOY-ORANGE-PI.md) - Docker-based deployment
- [DEPLOY.md](./DEPLOY.md) - General deployment guide

## Support

For issues or questions:
1. Check service logs: `sudo journalctl -u <service> -f`
2. Review troubleshooting sections above
3. Check GitHub issues for HolaMotor and LibreTranslate
