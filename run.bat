@echo off
chcp 65001 >nul
title Skin-Lab Clinic Management System Control Panel
cd /d "%~dp0"

:MENU
cls
color 0B
echo ================================================================================
echo                   🏥 SKIN-LAB CLINIC MANAGEMENT SYSTEM
echo                            CONTROL PANEL
echo ================================================================================
echo.
echo   [1]  🚀 Start Local Development Server (npm run dev + Open Browser)
echo   [2]  🛑 Stop / Close All Running Servers (Port 3000 & Node)
echo   [3]  🔄 Generate Prisma Client (npx prisma generate)
echo   [4]  🌱 Seed Initial Database (Users, Roles, Staff, Services)
echo   [5]  🔨 Build Production Bundle (npm run build)
echo   [6]  ⚡ Start Production Server (npm start + Open Browser)
echo   [7]  🌐 Open Skin-Lab in Browser (http://localhost:3000)
echo   [8]  ❌ Exit
echo.
echo ================================================================================
set /p choice="Enter your choice (1-8): "

if "%choice%"=="1" goto START_DEV
if "%choice%"=="2" goto STOP_SERVERS
if "%choice%"=="3" goto PRISMA_GENERATE
if "%choice%"=="4" goto SEED_DB
if "%choice%"=="5" goto BUILD_PROD
if "%choice%"=="6" goto START_PROD
if "%choice%"=="7" goto OPEN_BROWSER
if "%choice%"=="8" goto EXIT_SCRIPT

echo.
echo [!] Invalid selection. Please enter a number between 1 and 8.
timeout /t 2 /nobreak >nul
goto MENU

:START_DEV
cls
echo ================================================================================
echo   Starting Local Development Server...
echo ================================================================================
echo.
echo Killing any stale process on Port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

echo Starting Next.js Dev Server in a dedicated window...
start "Skin-Lab Dev Server" cmd /k "cd /d ""%~dp0"" && title Skin-Lab Dev Server (Port 3000) && npm run dev"

echo Waiting for server to initialize...
timeout /t 4 /nobreak >nul

echo Opening browser at http://localhost:3000...
start http://localhost:3000

echo.
echo [✓] Development server started successfully!
echo.
pause
goto MENU

:STOP_SERVERS
cls
echo ================================================================================
echo   Stopping All Running Skin-Lab Servers...
echo ================================================================================
echo.
echo Checking for processes on Port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    echo Stopping PID %%a on Port 3000...
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on Port 10000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :10000 ^| findstr LISTENING') do (
    echo Stopping PID %%a on Port 10000...
    taskkill /F /PID %%a >nul 2>&1
)

echo Closing dedicated server windows...
taskkill /F /FI "WINDOWTITLE eq Skin-Lab Dev Server*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Skin-Lab Production Server*" >nul 2>&1

echo.
echo [✓] All local servers and node processes have been stopped!
echo.
pause
goto MENU

:PRISMA_GENERATE
cls
echo ================================================================================
echo   Generating Prisma Client...
echo ================================================================================
echo.
call npx prisma generate
echo.
echo [✓] Prisma generation completed.
echo.
pause
goto MENU

:SEED_DB
cls
echo ================================================================================
echo   Seeding Initial Database...
echo ================================================================================
echo.
call npx ts-node prisma/seed.ts
echo.
echo [✓] Database seeding completed.
echo.
pause
goto MENU

:BUILD_PROD
cls
echo ================================================================================
echo   Building Production Bundle...
echo ================================================================================
echo.
call npm run build
echo.
echo [✓] Build completed.
echo.
pause
goto MENU

:START_PROD
cls
echo ================================================================================
echo   Starting Production Server...
echo ================================================================================
echo.
echo Killing any stale process on Port 3000...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

start "Skin-Lab Production Server" cmd /k "cd /d ""%~dp0"" && title Skin-Lab Production Server (Port 3000) && npm start"

echo Waiting for server to initialize...
timeout /t 4 /nobreak >nul

start http://localhost:3000
echo.
echo [✓] Production server is live at http://localhost:3000
echo.
pause
goto MENU

:OPEN_BROWSER
echo Opening http://localhost:3000 in your default browser...
start http://localhost:3000
goto MENU

:EXIT_SCRIPT
cls
echo Thank you for using Skin-Lab Clinic Management System!
timeout /t 1 /nobreak >nul
exit /b
