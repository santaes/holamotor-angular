# PowerShell deployment using Windows native SSH
$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = "oem"
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"

Write-Host "=== HolaMotor Deployment ===" -ForegroundColor Green
Write-Host "Target: $ORANGE_PI_IP" -ForegroundColor Cyan
Write-Host ""

# Create a PowerShell credential object
$secPass = $PASSWORD | ConvertTo-SecureString -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($USERNAME, $secPass)

# Function to execute SSH command
function Invoke-SSH {
    param([string]$Command)

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo.FileName = "ssh"
    $process.StartInfo.Arguments = "-o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP `"$Command`""
    $process.StartInfo.UseShellExecute = $false
    $process.StartInfo.RedirectStandardInput = $true
    $process.StartInfo.RedirectStandardOutput = $true
    $process.StartInfo.RedirectStandardError = $true
    $process.Start() | Out-Null

    # Send password
    $process.StandardInput.WriteLine($PASSWORD)
    $process.StandardInput.Close()

    $output = $process.StandardOutput.ReadToEnd()
    $error = $process.StandardError.ReadToEnd()
    $process.WaitForExit()

    return $output
}

# Create backup
Write-Host "[1/6] Creating backup..." -ForegroundColor Yellow
$backupOutput = Invoke-SSH "cd $REMOTE_DIR && mkdir -p ~/holamotor-backups && tar -czf ~/holamotor-backups/data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data 2>/dev/null || echo 'No data to backup'"
Write-Host $backupOutput

# Stop service
Write-Host "[2/6] Stopping service..." -ForegroundColor Yellow
$stopOutput = Invoke-SSH "cd $REMOTE_DIR && docker-compose down 2>/dev/null || sudo systemctl stop holamotor 2>/dev/null || echo 'Service stopped'"
Write-Host $stopOutput

# Transfer files
Write-Host "[3/6] Transferring files..." -ForegroundColor Yellow
$files = @("package.json", "package-lock.json", "angular.json", "tsconfig.json", "proxy.conf.json", "Dockerfile", "docker-compose.yml", "deploy-orange-pi-local.sh")

foreach ($file in $files) {
    $localFile = Join-Path $LOCAL_DIR $file
    if (Test-Path $localFile) {
        Write-Host "  Transferring: $file" -ForegroundColor Cyan
        $scpCmd = "scp -o StrictHostKeyChecking=no $localFile $USERNAME@$ORANGE_PI_IP`:$REMOTE_DIR/"
        Invoke-Expression $scpCmd
    }
}

# Transfer directories
Write-Host "[4/6] Transferring directories..." -ForegroundColor Yellow
$dirs = @("src", "server", "docs")
foreach ($dir in $dirs) {
    $localDir = Join-Path $LOCAL_DIR $dir
    if (Test-Path $localDir) {
        Write-Host "  Transferring: $dir" -ForegroundColor Cyan
        $scpCmd = "scp -r -o StrictHostKeyChecking=no $localDir $USERNAME@$ORANGE_PI_IP`:$REMOTE_DIR/"
        Invoke-Expression $scpCmd
    }
}

# Make script executable
Write-Host "[5/6] Making deployment script executable..." -ForegroundColor Yellow
$chmodOutput = Invoke-SSH "chmod +x $REMOTE_DIR/deploy-orange-pi-local.sh"
Write-Host $chmodOutput

# Run deployment
Write-Host "[6/6] Running deployment script..." -ForegroundColor Yellow
$deployOutput = Invoke-SSH "cd $REMOTE_DIR && ./deploy-orange-pi-local.sh"
Write-Host $deployOutput

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host "Access the app at: http://$ORANGE_PI_IP:8080" -ForegroundColor Cyan
