# Manual Deployment to Orange Pi

Since SSH requires password authentication, follow these steps to deploy the VeriFactu integration.

## Option 1: Using WinSCP (Recommended - GUI)

### Step 1: Connect with WinSCP
1. Open WinSCP
2. Host: `192.168.1.134`
3. Username: `oem`
4. Password: `oem`
5. Port: `22`
6. Click "Login"

### Step 2: Transfer Files
1. Navigate to `Desktop/holamotor-angular` on the right (Orange Pi)
2. On the left, navigate to `C:\Users\USUARIO\holamotor-angular`
3. Transfer these files/folders (drag from left to right):
   - `src/` folder
   - `server/` folder
   - `docs/` folder
   - `package.json`
   - `package-lock.json`
   - `angular.json`
   - `tsconfig.json`
   - `proxy.conf.json`
   - `Dockerfile`
   - `docker-compose.yml`
   - `deploy-orange-pi-local.sh`

**Exclude these (don't transfer):**
- `node_modules/`
- `dist/`
- `.git/`
- `data/`

### Step 3: Deploy on Orange Pi
1. In WinSCP, press `Ctrl+P` to open PuTTY
2. Or open a separate terminal/SSH client
3. Run:
```bash
cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

## Option 2: Using SCP (Command Line)

### Step 1: Transfer files
Open Git Bash or PowerShell and run:

```bash
# Transfer key files
scp package.json oem@192.168.1.134:Desktop/holamotor-angular/
scp package-lock.json oem@192.168.1.134:Desktop/holamotor-angular/
scp angular.json oem@192.168.1.134:Desktop/holamotor-angular/
scp tsconfig.json oem@192.168.1.134:Desktop/holamotor-angular/
scp proxy.conf.json oem@192.168.1.134:Desktop/holamotor-angular/
scp Dockerfile oem@192.168.1.134:Desktop/holamotor-angular/
scp docker-compose.yml oem@192.168.1.134:Desktop/holamotor-angular/
scp deploy-orange-pi-local.sh oem@192.168.1.134:Desktop/holamotor-angular/

# Transfer folders
scp -r src oem@192.168.1.134:Desktop/holamotor-angular/
scp -r server oem@192.168.1.134:Desktop/holamotor-angular/
scp -r docs oem@192.168.1.134:Desktop/holamotor-angular/
```

Enter password `oem` when prompted.

### Step 2: Deploy on Orange Pi
```bash
ssh oem@192.168.1.134
# Enter password: oem

cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

## Option 3: Direct on Orange Pi

If you have access to the Orange Pi directly (keyboard/monitor):

### Step 1: Copy files to Orange Pi
Use a USB drive or copy files manually to `Desktop/holamotor-angular`

### Step 2: Deploy
```bash
cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

## What the Deployment Script Does

The `deploy-orange-pi-local.sh` script will:
1. ✅ Create a backup of existing data
2. ✅ Stop the current service (Docker or systemd)
3. ✅ Rebuild the application
4. ✅ Restart the service
5. ✅ Show the status

## Verification

After deployment, access the app at:
```
http://192.168.1.134:8080
```

Check that:
- The app loads correctly
- You can access the settings
- VeriFactu configuration options are visible

## Troubleshooting

### Permission Denied
If you get permission errors:
```bash
sudo systemctl stop holamotor
sudo systemctl start holamotor
```

### Docker Issues
```bash
cd Desktop/holamotor-angular
docker-compose down
docker-compose up -d --build
docker-compose logs -f
```

### View Logs
```bash
# Docker logs
docker-compose logs -f

# Systemd logs
sudo journalctl -u holamotor -f
```

## Rollback if Needed

If something goes wrong:
```bash
cd ~/holamotor-backups
ls -la  # Find the latest backup
tar -xzf data-backup-YYYYMMDD.tar.gz -C ~/Desktop/holamotor-angular/
cd ~/Desktop/holamotor-angular
docker-compose up -d
```
