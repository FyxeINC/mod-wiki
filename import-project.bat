@echo off
setlocal
cd /d "%~dp0"
if "%~1"=="" (
    set /p MODRINTH_URL=Enter Modrinth project URL: 
) else (
    set "MODRINTH_URL=%~1"
)
py tools\import_mod.py "%MODRINTH_URL%"
if errorlevel 1 (
    echo.
    echo Import failed.
) else (
    echo.
    echo Import complete.
)
pause
endlocal
