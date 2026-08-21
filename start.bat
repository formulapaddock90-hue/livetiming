@echo off
REM File batch per avviare UndercutF1 con API Live Timing
echo =========================================
echo UndercutF1 Dashboard - Avvio Resiliente
echo =========================================

REM Controlla se dotnet e disponibile
dotnet --version >nul 2>nul
if %errorlevel% neq 0 (
    echo Errore: dotnet CLI non trovato.
    echo Installa .NET SDK da https://dotnet.microsoft.com/en-us/download
    pause
    exit /b 1
)

REM Naviga nella cartella del progetto Console
cd /d "%~dp0UndercutF1.Console"

REM Avvia l'applicazione con API abilitata
echo.
echo Avvio dell'applicazione con API live timing su porta 61937...
echo URL dashboard: http://localhost:61937
echo.

dotnet run -- --with-api

REM Se l'applicazione termina, mostra un messaggio
echo.
echo L'applicazione e stata terminata.
pause

