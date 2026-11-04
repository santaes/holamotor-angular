@echo off
echo Deploying to Orange Pi...
echo.

REM Set variables
set ORANGE_PI_IP=192.168.1.134
set USERNAME=oem
set REMOTE_DIR=Desktop/holamotor-angular
set LOCAL_DIR=C:\Users\USUARIO\holamotor-angular

echo Step 1: Copying public key to Orange Pi (password required)
type %USERPROFILE%\.ssh\holamotor_deploy_temp.pub | ssh -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

echo.
echo Step 2: Testing SSH connection
ssh -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "echo 'SSH connection successful'"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Step 3: Transferring files
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\package.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\package-lock.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\angular.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\tsconfig.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\proxy.conf.json %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\Dockerfile %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\docker-compose.yml %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\deploy-orange-pi-local.sh %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/

    echo.
    echo Step 4: Transferring directories
    scp -r -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\src %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -r -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\server %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/
    scp -r -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %LOCAL_DIR%\docs %USERNAME%@%ORANGE_PI_IP%:%REMOTE_DIR%/

    echo.
    echo Step 5: Running deployment script
    ssh -i %USERPROFILE%\.ssh\holamotor_deploy_temp -o StrictHostKeyChecking=no %USERNAME%@%ORANGE_PI_IP% "cd %REMOTE_DIR% && chmod +x deploy-orange-pi-local.sh && ./deploy-orange-pi-local.sh"

    echo.
    echo Deployment complete!
    echo Access the app at: http://%ORANGE_PI_IP%:8080
) else (
    echo.
    echo SSH key setup failed. Please add the key manually.
    echo Run this command:
    echo type %USERPROFILE%\.ssh\holamotor_deploy_temp.pub
    echo Then manually add it to Orange Pi's ~/.ssh/authorized_keys
)

pause
