@echo off
setlocal
set "GAME_URL=https://zikamansle.github.io/zikafighter/"
set "ARCADE_PROFILE=%LOCALAPPDATA%\ZikaFighterArcade"
set "BROWSER="
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" set "BROWSER=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not defined BROWSER if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined BROWSER (
  echo Navigateur Microsoft Edge ou Chrome introuvable.
  echo Installez Edge ou Chrome, puis relancez ce fichier.
  pause
  exit /b 1
)
start "Zika Fighter" "%BROWSER%" --user-data-dir="%ARCADE_PROFILE%" --no-first-run --autoplay-policy=no-user-gesture-required --app="%GAME_URL%"
endlocal
