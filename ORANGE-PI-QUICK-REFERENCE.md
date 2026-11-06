# Orange Pi Quick Reference

## Fast Commands

### Copy files to Orange Pi
```bash
scp setup-complete-orange-pi.sh pi@orangepi-ip:~/
scp install-libretranslate.sh pi@orangepi-ip:~/
```

### SSH into Orange Pi
```bash
ssh pi@orangepi-ip
```

### Run setup scripts
```bash
# Complete setup (HolaMotor + LibreTranslate)
chmod +x setup-complete-orange-pi.sh
./setup-complete-orange-pi.sh

# LibreTranslate only
chmod +x install-libretranslate.sh
./install-libretranslate.sh
```

### Check service status
```bash
sudo systemctl status libretranslate
sudo systemctl status holamotor
```

### View logs
```bash
sudo journalctl -u libretranslate -f
sudo journalctl -u holamotor -f
```

### Restart services
```bash
sudo systemctl restart libretranslate
sudo systemctl restart holamotor
```

### Test services
```bash
# LibreTranslate API
curl http://localhost:5000/specs

# HolaMotor
curl http://localhost:8080

# Test translation
curl -X POST http://localhost:5000/translate \
  -H "Content-Type: application/json" \
  -d '{"q": "Hello", "source": "en", "target": "es"}'
```

## File Locations

### LibreTranslate
- Installation: `~/libretranslate`
- Service: `/etc/systemd/system/libretranslate.service`
- Models: `~/libretranslate/venv/lib/python3.x/site-packages/argos-translate/packages`

### HolaMotor
- Application: `~/holamotor-angular`
- Data: `~/holamotor-data`
- Service: `/etc/systemd/system/holamotor.service`

## Configuration Files

### LibreTranslate Service
```bash
sudo nano /etc/systemd/system/libretranslate.service
```

### HolaMotor Service
```bash
sudo nano /etc/systemd/system/holamotor.service
```

## Network Access

### Find Orange Pi IP
```bash
ip addr show
```

### Access from other devices
```
http://orangepi-ip:8080  # HolaMotor
http://orangepi-ip:5000  # LibreTranslate
```

## Common Issues

### Port already in use
```bash
sudo lsof -i :5000
sudo lsof -i :8080
```

### Disk space
```bash
df -h
```

### System resources
```bash
htop
```

### Firewall
```bash
sudo ufw status
sudo ufw allow 5000/tcp
sudo ufw allow 8080/tcp
```

## Documentation Links

- Complete Setup: [SETUP-ORANGE-PI-COMPLETE.md](./SETUP-ORANGE-PI-COMPLETE.md)
- LibreTranslate Guide: [LIBRETRANSLATE-SETUP.md](./LIBRETRANSLATE-SETUP.md)
- HolaMotor Setup: [ORANGEPI_SETUP.md](./ORANGEPI_SETUP.md)
- Docker Deployment: [DEPLOY-ORANGE-PI.md](./DEPLOY-ORANGE-PI.md)
