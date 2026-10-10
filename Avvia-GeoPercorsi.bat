@echo off
title GeoPercorsi
rem Avvia GeoPercorsi e apre il browser. Doppio clic per avviare.
rem Se manca Node.js (o e' troppo vecchio) lo installa con winget.
cd /d "%~dp0"

call :controlla_node
if not errorlevel 1 goto librerie

echo.
echo  Serve Node.js (versione 20 o successiva): lo installo adesso.
echo  Se Windows chiede il permesso, rispondi Si'.
echo.
where winget >nul 2>nul
if errorlevel 1 goto manuale
winget install --id OpenJS.NodeJS.LTS -e --source winget --accept-package-agreements --accept-source-agreements
rem la finestra non vede ancora il nuovo PATH: aggiungo a mano le cartelle di Node
set "PATH=%ProgramFiles%\nodejs;%LOCALAPPDATA%\Programs\nodejs;%APPDATA%\npm;%PATH%"
call :controlla_node
if errorlevel 1 goto manuale
echo  Node.js installato.

:librerie
if exist "node_modules" goto avvio
echo  Prima installazione: scarico le librerie, attendi qualche minuto...
call npm install
if errorlevel 1 (
  echo  Installazione delle librerie non riuscita: controlla la connessione e riprova.
  pause
  exit /b 1
)

:avvio
echo.
echo  Avvio di GeoPercorsi in corso: il browser si aprira' da solo.
echo  Per chiudere l'app chiudi questa finestra.
echo.
call npm run dev -- --port 5173 --open
pause
exit /b 0

:manuale
echo.
echo  Non sono riuscito a installare Node.js da solo.
echo  Si apre la pagina di download: scarica la versione LTS, installala
echo  e poi fai di nuovo doppio clic su questo file.
start "" "https://nodejs.org/it/download"
pause
exit /b 1

:controlla_node
rem esce con 0 se Node.js c'e' ed e' una versione adatta a Vite (20.19+ o 22.12+)
where node >nul 2>nul || exit /b 1
node -e "const [a,b]=process.versions.node.split('.').map(Number);process.exit(a>=23||(a===22&&b>=12)||(a===20&&b>=19)?0:1)" >nul 2>nul
exit /b %errorlevel%
