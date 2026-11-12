@echo off
chcp 65001 > nul
title Invitacion XV Años Daphne - Servidor para Celular
cd /d "%~dp0"
echo ======================================================================
echo   ✨ INVITACION MIS XV AÑOS - DAPHNE (BOSQUE ENCANTADO) ✨
echo ======================================================================
echo.
echo   1. En esta computadora abre:
echo      http://localhost:8080
echo.
echo   2. En tu CELULAR (conectado al mismo Wi-Fi), abre el navegador en:
echo      http://192.168.1.71:8080
echo      (O haz clic en el boton "Ver en mi Celular" en la pantalla para
echo       escanear el Codigo QR con la camara de tu telefono).
echo.
echo ======================================================================
start http://localhost:8080
python -m http.server 8080 --bind 0.0.0.0
pause
