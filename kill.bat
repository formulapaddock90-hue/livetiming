@echo off
REM Kill all dotnet processes related to UndercutF1
echo Terminando il server UndercutF1...
taskkill /F /IM dotnet.exe
timeout /t 2 /nobreak
echo Server terminato!
pause
