@echo off
chcp 65001 > nul
title Invitacion XV Años Daphne - Servidor Node.js (Pases + Excel)
cd /d "%~dp0"
echo ======================================================================
echo   ✨ INVITACION MIS XV AÑOS - DAPHNE (BOSQUE ENCANTADO) ✨
echo ======================================================================
echo.
echo   Iniciando servidor con Pases Personalizados y Exportacion a Excel...
echo.
start http://localhost:8080/admin.html
start http://localhost:8080/?i=lizbeth
node server.js
pause
