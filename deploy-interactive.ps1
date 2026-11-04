# Interactive deployment script
$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = ConvertTo-SecureString "oem" -AsPlainText -Force
$CREDENTIAL = New-Object System.Management.Automation.PSCredential ($USERNAME, $PASSWORD)
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"

Write-Host "=== HolaMotor Deployment to Orange Pi ===" -ForegroundColor Green
Write-Host "Target: $ORANGE_PI_IP" -ForegroundColor Cyan
Write-Host ""

# Function to run SSH command with password
function Invoke-SSHCommand {
    param(
        [string]$Command
    )

    $cmd = "echo oem | ssh -o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP `"$Command`""
    Invoke-Expression $cmd
}

# Step 1: Create backup
Write-Host "[1/5] Creating backup..." -ForegroundColor Yellow
$backupCmd = "cd $REMOTE_DIR && mkdir -p ~/holamotor-backups && tar -czf ~/holamotor-backups/data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data 2>/dev/null || echo 'No data to backup'"
Write-Host "Run this manually:" -ForegroundColor White
Write-Host "ssh oem@$ORANGE_PI_IP '$backupCmd'" -ForegroundColor Cyan
Write-Host ""

# Step 2: Stop service
Write-Host "[2/5] Stopping service..." -ForegroundColor Yellow
$stopCmd = "cd $REMOTE_DIR && docker-compose down 2>/dev/null || sudo systemctl stop holamotor 2>/dev/null || echo 'Service stopped'"
Write-Host "Run this manually:" -ForegroundColor White
Write-Host "ssh oem@$ORANGE_PI_IP '$stopCmd'" -ForegroundColor Cyan
Write-Host ""

# Step 3: Transfer files
Write-Host "[3/5] Transferring files..." -ForegroundColor Yellow
Write-Host "Please transfer these files using WinSCP or scp:" -ForegroundColor White
Write-Host ""
Write-Host "Files:" -ForegroundColor Cyan
Write-Host "  scp package.json oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp package-lock.json oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp angular.json oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp tsconfig.json oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp proxy.conf.json oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp Dockerfile oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp docker-compose.yml oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp deploy-orange-pi-local.sh oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host ""
Write-Host "Directories:" -ForegroundColor Cyan
Write-Host "  scp -r src oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp -r server oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host "  scp -r docs oem@$ORANGE_PI_IP:$REMOTE_DIR/"
Write-Host ""

# Step 4: Make script executable and run
Write-Host "[4/5] Running deployment script..." -ForegroundColor Yellow
$deployCmd = "cd $REMOTE_DIR && chmod +x deploy-orange-pi-local.sh && ./deploy-orange-pi-local.sh"
Write-Host "Run this manually:" -ForegroundColor White
Write-Host "ssh oem@$ORANGE_PI_IP '$deployCmd'" -ForegroundColor Cyan
Write-Host ""

# Step 5: Verify
Write-Host "[5/5] Verification..." -ForegroundColor Yellow
$verifyCmd = "cd $REMOTE_DIR && docker-compose ps 2>/dev/null || sudo systemctl status holamotor --no-pager 2>/dev/null"
Write-Host "Run this manually:" -ForegroundColor White
Write-Host "ssh oem@$ORANGE_PI_IP '$verifyCmd'" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Quick One-Liner ===" -ForegroundColor Green
Write-Host "SSH into Orange Pi and run:" -ForegroundColor White
Write-Host "cd Desktop/holamotor-angular && ./deploy-orange-pi-local.sh" -ForegroundColor Cyan
Write-Host ""
Write-Host "Or use this batch script to transfer files:" -ForegroundColor White
Write-Host ".\deploy.bat" -ForegroundColor Cyan
