# Create temporary SSH key and deploy
$ORANGE_PI_IP = "192.168.1.134"
$USERNAME = "oem"
$PASSWORD = "oem"
$REMOTE_DIR = "Desktop/holamotor-angular"
$LOCAL_DIR = "C:\Users\USUARIO\holamotor-angular"
$KEY_PATH = "$env:USERPROFILE\.ssh\holamotor_deploy_temp"

Write-Host "Setting up temporary SSH key for deployment..." -ForegroundColor Green

# Check if key already exists
if (Test-Path $KEY_PATH) {
    Write-Host "Key already exists, using it..." -ForegroundColor Yellow
} else {
    # Generate SSH key
    Write-Host "Generating SSH key..." -ForegroundColor Yellow
    ssh-keygen -t ed25519 -f $KEY_PATH -N "" -q
}

# Copy public key to Orange Pi using sshpass or manual
Write-Host "Copying public key to Orange Pi..." -ForegroundColor Yellow
$pubKey = Get-Content "$KEY_PATH.pub"

# Create a script to add the key on Orange Pi
$addKeyScript = @"
mkdir -p ~/.ssh
echo '$pubKey' >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
echo "Key added successfully"
"@

# Use ssh with password (this will prompt for password)
Write-Host "Please enter the Orange Pi password (oem) when prompted..." -ForegroundColor Yellow
$addKeyScript | ssh -o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP

# Test SSH connection with key
Write-Host "Testing SSH connection with key..." -ForegroundColor Yellow
ssh -i $KEY_PATH -o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP "echo 'SSH key connection successful'"

if ($LASTEXITCODE -eq 0) {
    Write-Host "SSH key setup successful!" -ForegroundColor Green

    # Now deploy using the key
    Write-Host "Deploying files..." -ForegroundColor Yellow

    # Transfer files
    $files = @("package.json", "package-lock.json", "angular.json", "tsconfig.json", "proxy.conf.json", "Dockerfile", "docker-compose.yml", "deploy-orange-pi-local.sh")
    foreach ($file in $files) {
        $localFile = Join-Path $LOCAL_DIR $file
        if (Test-Path $localFile) {
            Write-Host "  Transferring: $file" -ForegroundColor Cyan
            scp -i $KEY_PATH -o StrictHostKeyChecking=no $localFile "$USERNAME@$ORANGE_PI_IP`:$REMOTE_DIR/"
        }
    }

    # Transfer directories
    $dirs = @("src", "server", "docs")
    foreach ($dir in $dirs) {
        $localDir = Join-Path $LOCAL_DIR $dir
        if (Test-Path $localDir) {
            Write-Host "  Transferring directory: $dir" -ForegroundColor Cyan
            scp -r -i $KEY_PATH -o StrictHostKeyChecking=no $localDir "$USERNAME@$ORANGE_PI_IP`:$REMOTE_DIR/"
        }
    }

    # Run deployment script
    Write-Host "Running deployment script..." -ForegroundColor Yellow
    ssh -i $KEY_PATH -o StrictHostKeyChecking=no $USERNAME@$ORANGE_PI_IP "cd $REMOTE_DIR && chmod +x deploy-orange-pi-local.sh && ./deploy-orange-pi-local.sh"

    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Access the app at: http://$ORANGE_PI_IP:8080" -ForegroundColor Cyan
} else {
    Write-Host "SSH key setup failed. Please check manually." -ForegroundColor Red
}
