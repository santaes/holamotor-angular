@echo off
echo One-line deployment command:
echo.
echo ssh oem@192.168.1.134 "cd Desktop/holamotor-angular && git pull && ./deploy-orange-pi-local.sh"
echo.
echo Or if git is not set up:
echo.
echo 1. Transfer files using WinSCP to Desktop/holamotor-angular
echo 2. Then run: ssh oem@192.168.1.134 "cd Desktop/holamotor-angular && ./deploy-orange-pi-local.sh"
echo.
pause
