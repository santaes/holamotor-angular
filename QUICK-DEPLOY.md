# Quick Manual Deployment to Orange Pi

Since automated deployment requires SSH key setup, here's the fastest manual method using WinSCP.

## Method 1: WinSCP (Easiest - 5 minutes)

### Step 1: Download WinSCP
Download from: https://winscp.net/eng/download.php

### Step 2: Connect
- Open WinSCP
- Host: `192.168.1.134`
- Username: `oem`
- Password: `oem`
- Port: `22`
- Click "Login"

### Step 3: Transfer Files
1. Right panel (Orange Pi): Navigate to `Desktop/holamotor-angular`
2. Left panel (Local): Navigate to `C:\Users\USUARIO\holamotor-angular`
3. Drag these files/folders from left to right:

**Files:**
- `package.json`
- `package-lock.json`
- `angular.json`
- `tsconfig.json`
- `proxy.conf.json`
- `Dockerfile`
- `docker-compose.yml`
- `deploy-orange-pi-local.sh`

**Folders:**
- `src` (contains updated VeriFactu service)
- `server`
- `docs` (contains VeriFactu PDF and documentation)

**Skip these:**
- `node_modules`
- `dist`
- `.git`
- `data`

### Step 4: Deploy on Orange Pi
1. In WinSCP, press `Ctrl+P` to open PuTTY/terminal
2. Or open a separate SSH client
3. Run:
```bash
cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

### Step 5: Verify
Open browser: `http://192.168.1.134:8080`

---

## Method 2: Command Line (SCP)

### Step 1: Transfer files
Open Git Bash or PowerShell and run (enter password `oem` when prompted):

```bash
# Files
scp package.json oem@192.168.1.134:Desktop/holamotor-angular/
scp package-lock.json oem@192.168.1.134:Desktop/holamotor-angular/
scp angular.json oem@192.168.1.134:Desktop/holamotor-angular/
scp tsconfig.json oem@192.168.1.134:Desktop/holamotor-angular/
scp proxy.conf.json oem@192.168.1.134:Desktop/holamotor-angular/
scp Dockerfile oem@192.168.1.134:Desktop/holamotor-angular/
scp docker-compose.yml oem@192.168.1.134:Desktop/holamotor-angular/
scp deploy-orange-pi-local.sh oem@192.168.1.134:Desktop/holamotor-angular/

# Directories
scp -r src oem@192.168.1.134:Desktop/holamotor-angular/
scp -r server oem@192.168.1.134:Desktop/holamotor-angular/
scp -r docs oem@192.168.1.134:Desktop/holamotor-angular/
```

### Step 2: Deploy
```bash
ssh oem@192.168.1.134
# Enter password: oem

cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

---

## What Gets Deployed

The deployment includes:
- ✅ Updated VeriFactu service with AEAT compliance
- ✅ Enhanced settings with VeriFactu configuration
- ✅ Documentation (docs/VERIFACTU.md)
- ✅ Official AEAT manual (docs/Manual_Verifactu.pdf)
- ✅ Deployment automation scripts

## After Deployment

1. Access the app at `http://192.168.1.134:8080`
2. Go to **Configuración** (Settings)
3. Configure VeriFactu:
   - API Key: Your VeriFactu service API key
   - Modo Sandbox: Enable for testing
   - NIF/CIF: Your workshop's tax ID

## Troubleshooting

### Service won't start
```bash
ssh oem@192.168.1.134
cd Desktop/holamotor-angular
docker-compose logs -f
```

### Manual restart
```bash
ssh oem@192.168.1.134
cd Desktop/holamotor-angular
docker-compose down
docker-compose up -d --build
```

### Check status
```bash
ssh oem@192.168.1.134
cd Desktop/holamotor-angular
docker-compose ps
```
