# Simple deployment using Windows built-in SSH/SCP
$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = "oem"
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"

Write-Host "Deploying to Orange Pi at $ORANGE_PI_IP..." -ForegroundColor Green

# Use plink from PuTTY or Windows OpenSSH
# First, let's try using Windows OpenSSH with a temporary expect script

# Create a temporary expect script
$expectScript = @"
#!/usr/bin/expect
set timeout 30
spawn ssh -o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP "cd $REMOTE_DIR && ./deploy-orange-pi-local.sh"
expect {
    "password:" {
        send "$PASSWORD\r"
        expect eof
    }
    eof
}
"@

# Save expect script
$expectScript | Out-File -FilePath "temp_deploy.exp" -Encoding ASCII

# Try to use expect if available
if (Get-Command expect -ErrorAction SilentlyContinue) {
    Write-Host "Using expect for SSH..." -ForegroundColor Yellow
    expect temp_deploy.exp
    Remove-Item temp_deploy.exp
} else {
    Write-Host "expect not found. Please use manual deployment." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Cyan
    Write-Host "1. Use WinSCP to transfer files to Desktop/holamotor-angular on Orange Pi" -ForegroundColor White
    Write-Host "2. SSH to Orange Pi: ssh oem@192.168.1.134" -ForegroundColor White
    Write-Host "3. Run: cd Desktop/holamotor-angular && ./deploy-orange-pi-local.sh" -ForegroundColor White
    exit 1
}

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Access the app at: http://$ORANGE_PI_IP:8080" -ForegroundColor Cyan
