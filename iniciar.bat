@echo off
chcp 65001 >nul
title TRON - Las Tres Grids
cd /d "%~dp0"
echo ==============================================================
echo   TRON - Las Tres Grids
echo ==============================================================

set PY=
where py >nul 2>nul && set PY=py -3
if not defined PY where python >nul 2>nul && set PY=python
if not defined PY (
  echo.
  echo  No se encontro Python. Instalalo desde https://www.python.org/downloads/
  echo  ^(marca la casilla "Add python.exe to PATH"^) y vuelve a ejecutar este archivo.
  echo  Sin Python puedes abrir index.html, pero los NPCs no usaran IA.
  echo.
  pause
  exit /b 1
)

if exist "server\config.local.bat" call "server\config.local.bat"
echo  Iniciando servidor de IA de NPCs y abriendo el juego...
%PY% server\npc_ai_server.py --open
pause
