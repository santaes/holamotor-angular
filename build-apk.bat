@echo off
set JAVA_HOME=C:\Users\USUARIO\jdk11\jdk-11.0.33+10
set PATH=%JAVA_HOME%\bin;%PATH%
cd /d C:\Users\USUARIO\holamotor-angular\android
call gradlew.bat assembleDebug
