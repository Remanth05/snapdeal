@echo off
title Snapdeal AI Virtual KAM - Runner
echo ========================================================
echo Starting Snapdeal AI Virtual KAM Server...
echo ========================================================
echo.
python server.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [Notice] Python was not found or failed. Opening index.html directly...
    start "" "index.html"
)
pause

