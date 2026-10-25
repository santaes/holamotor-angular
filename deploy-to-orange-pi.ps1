# Deployment script for Orange Pi from Windows
# Usage: .\deploy-to-orange-pi.ps1

$ORANGE_PI_IP = "100.96.75.45"
$PROJECT_NAME = "holamotor"
$REMOTE_DIR = "/opt/$PROJECT_NAME"
$LOCAL_DIR = Get-Location

Write-Host "🚀 Deploying $PROJECT_NAME to Orange Pi at $ORANGE_PI_IP" -ForegroundColor Green

# 1. Create backup on remote
Write-Host "📦 Creating backup..." -ForegroundColor Yellow
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && [ -d data ] && tar -czf data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data || true"

# 2. Stop existing container
Write-Host "🛑 Stopping existing container..." -ForegroundColor Yellow
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose down || true"

# 3. Copy project files using scp
Write-Host "📋 Copying project files..." -ForegroundColor Yellow
# Create remote directory
ssh root@${ORANGE_PI_IP} "mkdir -p ${REMOTE_DIR}"

# Copy files (excluding unnecessary directories)
$excludeFiles = @(
    "node_modules",
    "dist",
    ".git",
    "data",
    "*.log"
)

$excludeArgs = $excludeFiles | ForEach-Object { "--exclude=$_" }
$excludeStr = $excludeArgs -join " "

# Use scp to copy files
scp -r $excludeStr "$LOCAL_DIR\*" "root@${ORANGE_PI_IP}:${REMOTE_DIR}/"

# 4. Build and start on Orange Pi
Write-Host "🔨 Building and starting on Orange Pi..." -ForegroundColor Yellow
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose up -d --build"

# 5. Check status
Write-Host "✅ Checking status..." -ForegroundColor Yellow
ssh root@${ORANGE_PI_IP} "cd ${REMOTE_DIR} && docker-compose ps"

Write-Host "🎉 Deployment complete!" -ForegroundColor Green
Write-Host "🌐 Access the app at: http://${ORANGE_PI_IP}" -ForegroundColor Cyan
