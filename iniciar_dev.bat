@echo off
title Focus & Habits 2026 - Modo Desarrollo (Watch)
cls
echo ====================================================
echo    Focus & Habits 2026 - Modo Desarrollo
echo ====================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% equ 0 (
    node --watch src/server.js
) else (
    if exist "C:\Program Files\nodejs\node.exe" (
        "C:\Program Files\nodejs\node.exe" --watch src/server.js
    ) else (
        echo [ERROR] No se pudo encontrar Node.js.
        pause
    )
)
