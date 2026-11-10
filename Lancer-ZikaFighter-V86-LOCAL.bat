@echo off
setlocal
cd /d "%~dp0"
title Zika Fighter v86 - Mode local
echo.
echo Lancement de Zika Fighter v86 depuis ce dossier.
echo Le navigateur va ouvrir le jeu en local. Une connexion Internet reste
echo necessaire pour certaines images d'arenes hebergees chez Wix.
echo.
start "Serveur Zika Fighter" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Serveur-ZikaFighter.ps1" -Port 8765
timeout /t 3 /nobreak >nul
set "URL=http://127.0.0.1:8765/"
set "BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if defined BROWSER (
 start "Zika Fighter" "%BROWSER%" --no-first-run --autoplay-policy=no-user-gesture-required --app="%URL%"
) else (
 start "" "%URL%"
)
echo Si le jeu ne s'ouvre pas, rendez-vous sur %URL%
echo Fermez la fenetre Serveur Zika Fighter pour arreter le serveur.
endlocal
