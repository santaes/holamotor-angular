# PowerShell deployment script with password authentication
$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = "oem"
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"

Write-Host "Deploying to Orange Pi at $ORANGE_PI_IP..." -ForegroundColor Green

# Install Posh-SSH if not available
$module = Get-Module -ListAvailable -Name Posh-SSH
if (-not $module) {
    Write-Host "Installing Posh-SSH module..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser
}

# Create credential object
$securePassword = ConvertTo-SecureString $PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($USERNAME, $securePassword)

# Test connection
Write-Host "Testing connection..." -ForegroundColor Yellow
try {
    $session = New-SSHSession -ComputerName $ORANGE_PI_IP -Credential $credential -AcceptKey
    Write-Host "Connected to Orange Pi" -ForegroundColor Green
} catch {
    Write-Host "Connection failed: $_" -ForegroundColor Red
    exit 1
}

# Create backup
Write-Host "Creating backup..." -ForegroundColor Yellow
$backupCmd = "cd $REMOTE_DIR; mkdir -p ~/holamotor-backups; tar -czf ~/holamotor-backups/data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data 2>/dev/null || true"
Invoke-SSHCommand -SessionId $session.SessionId -Command $backupCmd

# Stop service
Write-Host "Stopping service..." -ForegroundColor Yellow
$stopCmd = "cd $REMOTE_DIR; docker-compose down 2>/dev/null || sudo systemctl stop holamotor 2>/dev/null || true"
Invoke-SSHCommand -SessionId $session.SessionId -Command $stopCmd

# Transfer files using SCP
Write-Host "Transferring files..." -ForegroundColor Yellow
$filesToTransfer = @(
    "package.json",
    "package-lock.json",
    "angular.json",
    "tsconfig.json",
    "proxy.conf.json",
    "Dockerfile",
    "docker-compose.yml",
    "deploy-orange-pi-local.sh"
)

foreach ($file in $filesToTransfer) {
    $localFile = Join-Path $LOCAL_DIR $file
    if (Test-Path $localFile) {
        Write-Host "  Transferring: $file" -ForegroundColor Cyan
        Set-SCPFile -SessionId $session.SessionId -LocalFile $localFile -RemotePath $REMOTE_DIR -ErrorAction SilentlyContinue
    }
}

# Transfer directories
$dirsToTransfer = @("src", "server", "docs")
foreach ($dir in $dirsToTransfer) {
    $localDir = Join-Path $LOCAL_DIR $dir
    if (Test-Path $localDir) {
        Write-Host "  Transferring directory: $dir" -ForegroundColor Cyan
        Set-SCPFolder -SessionId $session.SessionId -LocalFolder $localDir -RemotePath $REMOTE_DIR -ErrorAction SilentlyContinue
    }
}

# Make deployment script executable
Write-Host "Making deployment script executable..." -ForegroundColor Yellow
Invoke-SSHCommand -SessionId $session.SessionId -Command "chmod +x $REMOTE_DIR/deploy-orange-pi-local.sh"

# Run deployment script
Write-Host "Running deployment script..." -ForegroundColor Yellow
$deployCmd = "cd $REMOTE_DIR; ./deploy-orange-pi-local.sh"
$result = Invoke-SSHCommand -SessionId $session.SessionId -Command $deployCmd
Write-Host $result.Output -ForegroundColor White

# Check status
Write-Host "Checking status..." -ForegroundColor Yellow
$statusCmd = "cd $REMOTE_DIR; docker-compose ps 2>/dev/null || sudo systemctl status holamotor --no-pager 2>/dev/null"
$status = Invoke-SSHCommand -SessionId $session.SessionId -Command $statusCmd
Write-Host $status.Output -ForegroundColor White

# Close session
Remove-SSHSession -SessionId $session.SessionId

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access the app at: http://$ORANGE_PI_IP:8080" -ForegroundColor Cyan
