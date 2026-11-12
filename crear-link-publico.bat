@echo off
chcp 65001 > nul
title Link Publico Temporal para Celular (4G/5G/WhatsApp)
echo ======================================================================
echo   🌐 GENERANDO LINK PUBLICO TEMPORAL PARA TU CELULAR 🌐
echo ======================================================================
echo.
echo   Asegurate de que el servidor local este corriendo (puerto 8080).
echo   En unos segundos aparecera abajo un enlace terminado en:
echo   https://...lhr.life
echo.
echo   Podras abrir ese enlace en cualquier celular (incluso con datos
echo   moviles o mandarlo por WhatsApp para probar).
echo ======================================================================
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run
pause
