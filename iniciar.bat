@echo off
title Focus & Habits 2026 - Servidor Local
cls
echo ====================================================
echo    Focus & Habits 2026 - Web App MVC
echo ====================================================
echo.

cd /d "%~dp0"

:: Verificar si node esta en el PATH o en Archivos de Programa
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js detectado en el sistema.
    echo Iniciando servidor en http://localhost:3000 ...
    echo (Presiona Ctrl+C para detener el servidor)
    echo.
    node src/server.js
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        echo [OK] Node.js detectado en C:\Program Files\nodejs\
        echo Iniciando servidor en http://localhost:3000 ...
        echo (Presiona Ctrl+C para detener el servidor)
        echo.
        "C:\Program Files\nodejs\node.exe" src/server.js
    ) else (
        echo [ERROR] No se pudo encontrar Node.js en su equipo.
        echo Por favor instala Node.js desde https://nodejs.org/
        pause
    )
)
