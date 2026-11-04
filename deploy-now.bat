@echo off
echo ========================================
echo HolaMotor Deployment to Orange Pi
echo ========================================
echo.
echo Target: 192.168.1.134
echo User: oem
echo Password: oem
echo.
echo ========================================
echo.

set ORANGE_PI_IP=192.168.1.134
set USERNAME=oem
set REMOTE_DIR=Desktop/holamotor-angular
set LOCAL_DIR=C:\Users\USUARIO\holamotor-angular

echo Step 1: Creating backup on Orange Pi...
ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "cd %REMOTE_DIR% && mkdir -p ~/holamotor-backups && tar -czf ~/holamotor-backups/data-backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz data 2>/dev/null || echo 'No data to backup'"
echo.

echo Step 2: Stopping service...
ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "cd %REMOTE_DIR% && docker-compose down 2>/dev/null || sudo systemctl stop holamotor 2>/dev/null || echo 'Service stopped'"
echo.

echo Step 3: Transferring files...
echo (You will be prompted for password for each file transfer)
echo.

scp -o StrictHostKeyChecking=no %LOCAL_DIR%\package.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\package-lock.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\angular.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\tsconfig.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\proxy.conf.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\Dockerfile %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\docker-compose.yml %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -o StrictHostKeyChecking=no %LOCAL_DIR%\deploy-orange-pi-local.sh %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/

echo.
echo Step 4: Transferring directories...
scp -r -o StrictHostKeyChecking=no %LOCAL_DIR%\src %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -r -o StrictHostKeyChecking=no %LOCAL_DIR%\server %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
scp -r -o StrictHostKeyChecking=no %LOCAL_DIR%\docs %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/

echo.
echo Step 5: Making deployment script executable...
ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "chmod +x %REMOTE_DIR%/deploy-orange-pi-local.sh"

echo.
echo Step 6: Running deployment script...
ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "cd %REMOTE_DIR% && ./deploy-orange-pi-local.sh"

echo.
echo Step 7: Checking status...
ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "cd %REMOTE_DIR% && docker-compose ps 2>/dev/null || sudo systemctl status holamotor --no-pager 2>/dev/null"

echo.
echo ========================================
echo Deployment complete!
echo Access the app at: http://%ORANGE_PI_IP%:8080
echo ========================================
pause
