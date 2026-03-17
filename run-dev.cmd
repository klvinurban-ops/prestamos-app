@echo off
title PrestamosPro - Servidor
cd /d "%~dp0"

echo.
echo ========================================
echo   PrestamosPro - Iniciando servidor
echo ========================================
echo.

set NODE_OPTIONS=--max-old-space-size=4096
echo Memoria asignada: 4096 MB
echo.

if not exist "node_modules\next" (
    echo ERROR: No hay dependencias instaladas.
    echo Ejecuta primero: npm install
    echo.
    pause
    exit /b 1
)

echo Iniciando Next.js...
echo.
echo Cuando veas "Ready" abre el navegador en:
echo   http://localhost:3000
echo.
echo Puedes hacer doble clic en  abrir-navegador.cmd  para abrir el navegador.
echo.
echo NO CIERRES esta ventana mientras uses la app.
echo Para detener: Ctrl+C o cierra la ventana.
echo ========================================
echo.

node node_modules/next/dist/bin/next dev

echo.
echo El servidor se detuvo.
pause
