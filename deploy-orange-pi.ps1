# PowerShell deployment script for Orange Pi
# Usage: .\deploy-orange-pi.ps1

$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = "oem"
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"

Write-Host "🚀 Deploying HolaMotor to Orange Pi at $ORANGE_PI_IP..." -ForegroundColor Green

# Create password secure string
$securePassword = ConvertTo-SecureString $PASSWORD -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential ($USERNAME, $securePassword)

# Test connection
Write-Host "🔍 Testing connection..." -ForegroundColor Yellow
try {
    $session = New-SSHSession -ComputerName $ORANGE_PI_IP -Credential $credential -AcceptKey
    Remove-SSHSession -SessionId $session.SessionId
    Write-Host "✅ Connection successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Connection failed. Please install Posh-SSH module:" -ForegroundColor Red
    Write-Host "   Install-Module -Name Posh-SSH" -ForegroundColor Yellow
    Write-Host "Or use manual SCP method below." -ForegroundColor Yellow
    exit 1
}

# Alternative: Use pscp.exe from PuTTY (if available)
Write-Host ""
Write-Host "📋 Alternative deployment methods:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Method 1: Using WinSCP (GUI):" -ForegroundColor Yellow
Write-Host "  1. Open WinSCP" -ForegroundColor White
Write-Host "  2. Connect to $ORANGE_PI_IP with user $USERNAME" -ForegroundColor White
Write-Host "  3. Navigate to Desktop/holamotor-angular" -ForegroundColor White
Write-Host "  4. Upload all files from $LOCAL_DIR (excluding node_modules, dist, .git)" -ForegroundColor White
Write-Host ""
Write-Host "Method 2: Using pscp (PuTTY):" -ForegroundColor Yellow
Write-Host "  pscp -r -P 22 -pw oem $LOCAL_DIR\* oem@$ORANGE_PI_IP`:Desktop/holamotor-angular/`" -ForegroundColor White
Write-Host ""
Write-Host "Method 3: Manual on Orange Pi:" -ForegroundColor Yellow
Write-Host "  1. Copy deploy-orange-pi-local.sh to Orange Pi Desktop/holamotor-angular" -ForegroundColor White
Write-Host "  2. SSH to Orange Pi: ssh oem@$ORANGE_PI_IP" -ForegroundColor White
Write-Host "  3. Run: cd Desktop/holamotor-angular && chmod +x deploy-orange-pi-local.sh && ./deploy-orange-pi-local.sh" -ForegroundColor White
Write-Host ""
