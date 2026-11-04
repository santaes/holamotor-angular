# Deploy to Orange Pi - Manual Instructions

Since automated deployment requires interactive password input, please follow these steps:

## Option 1: SSH Direct Deployment (Fastest)

### Step 1: SSH into Orange Pi
Open Command Prompt, PowerShell, or Git Bash and run:
```bash
ssh oem@192.168.1.134
```
Enter password: `oem`

### Step 2: Run deployment script
```bash
cd Desktop/holamotor-angular
./deploy-orange-pi-local.sh
```

This will:
- ✅ Backup existing data
- ✅ Stop current service
- ✅ Rebuild application
- ✅ Restart service
- ✅ Show status

**Note:** This assumes files are already up-to-date on Orange Pi. If you need to transfer files first, use Option 2.

---

## Option 2: Transfer Files First (If code changed)

### Step 1: Transfer files using WinSCP
1. Download WinSCP: https://winscp.net/
2. Connect:
   - Host: `192.168.1.134`
   - User: `oem`
   - Password: `oem`
3. Navigate to `Desktop/holamotor-angular` on Orange Pi
4. Transfer these files/folders from your local `C:\Users\USUARIO\holamotor-angular`:

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
- `src` (contains VeriFactu updates)
- `server`
- `docs` (VeriFactu documentation)

### Step 2: SSH and deploy
```bash
ssh oem@192.168.1.134
# Enter password: oem

cd Desktop/holamotor-angular
chmod +x deploy-orange-pi-local.sh
./deploy-orange-pi-local.sh
```

---

## Option 3: Git Pull (If git is set up on Orange Pi)

```bash
ssh oem@192.168.1.134
# Enter password: oem

cd Desktop/holamotor-angular
git pull
./deploy-orange-pi-local.sh
```

---

## What's Being Deployed

- ✅ Updated VeriFactu service with AEAT compliance
- ✅ VeriFactu configuration in settings
- ✅ Documentation (docs/VERIFACTU.md)
- ✅ AEAT manual (docs/Manual_Verifactu.pdf)
- ✅ GitHub Actions workflow for future auto-deployment

---

## After Deployment

1. Access the app: `http://192.168.1.134:8080`
2. Go to **Configuración** (Settings)
3. Configure VeriFactu:
   - API Key: Your VeriFactu service API key
   - Modo Sandbox: Enable for testing
   - NIF/CIF: Your workshop's tax ID

---

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

### If using systemd instead of Docker
```bash
ssh oem@192.168.1.134
sudo systemctl stop holamotor
sudo systemctl start holamotor
sudo systemctl status holamotor
```

---

## Future Auto-Deployment

After this manual deployment, future pushes to GitHub will auto-deploy if you set up SSH keys. See `GITHUB-DEPLOYMENT.md` for instructions.
