@echo off
chcp 65001 >nul
cls
echo ========================================
echo HolaMotor Deployment to Orange Pi
echo ========================================
echo.
echo Target IP: 192.168.1.134
echo Username: oem
echo Password: oem
echo.
echo Press any key to start deployment...
pause >nul
echo.

set IP=192.168.1.134
set USER=oem
set DIR=Desktop/holamotor-angular
set LOCAL=C:\Users\USUARIO\holamotor-angular

echo [1/7] Creating backup...
ssh -o StrictHostKeyChecking=no %USER%@%IP% "cd %DIR% && mkdir -p ~/holamotor-backups && tar -czf ~/holamotor-backups/data-backup-$(date +%%Y%%m%%d-%%H%%M%%S).tar.gz data 2^>/dev/null || echo No data to backup"
echo.

echo [2/7] Stopping service...
ssh -o StrictHostKeyChecking=no %USER%@%IP% "cd %DIR% && docker-compose down 2^>/dev/null || sudo systemctl stop holamotor 2^>/dev/null || echo Service stopped"
echo.

echo [3/7] Transferring files (password will be prompted)...
scp -o StrictHostKeyChecking=no %LOCAL%\package.json %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\package-lock.json %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\angular.json %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\tsconfig.json %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\proxy.conf.json %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\Dockerfile %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\docker-compose.yml %USER%@%IP%:%DIR%/
scp -o StrictHostKeyChecking=no %LOCAL%\deploy-orange-pi-local.sh %USER%@%IP%:%DIR%/
echo.

echo [4/7] Transferring directories...
scp -r -o StrictHostKeyChecking=no %LOCAL%\src %USER%@%IP%:%DIR%/
scp -r -o StrictHostKeyChecking=no %LOCAL%\server %USER%@%IP%:%DIR%/
scp -r -o StrictHostKeyChecking=no %LOCAL%\docs %USER%@%IP%:%DIR%/
echo.

echo [5/7] Making deployment script executable...
ssh -o StrictHostKeyChecking=no %USER%@%IP% "chmod +x %DIR%/deploy-orange-pi-local.sh"
echo.

echo [6/7] Running deployment script...
ssh -o StrictHostKeyChecking=no %USER%@%IP% "cd %DIR% && ./deploy-orange-pi-local.sh"
echo.

echo [7/7] Checking status...
ssh -o StrictHostKeyChecking=no %USER%@%IP% "cd %DIR% && docker-compose ps 2^>/dev/null || sudo systemctl status holamotor --no-pager 2^>/dev/null"
echo.

echo ========================================
echo Deployment Complete!
echo Access the app at: http://%IP%:8080
echo ========================================
pause
