@echo off
setlocal enabledelayedexpansion

echo =====================================
echo AI in QA Demo App - Installation Script
echo =====================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js found:
node --version
echo.

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed or not in PATH
    pause
    exit /b 1
)

echo [✓] npm found:
npm --version
echo.

:: Check if we're in the right directory
if not exist "city-services-portal" (
    echo [ERROR] Cannot find city-services-portal directory
    echo Please run this script from the root of the ai-in-qa-demo-app repository
    pause
    exit /b 1
)

:: Navigate to API directory
echo =====================================
echo Setting up Backend API...
echo =====================================
cd city-services-portal\api
if %errorlevel% neq 0 (
    echo [ERROR] Cannot navigate to city-services-portal\api directory
    pause
    exit /b 1
)

:: Install API dependencies
echo Installing API dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install API dependencies
    pause
    exit /b 1
)

:: Create .env file if it doesn't exist
if not exist .env (
    echo Creating environment file...
    copy .env.example .env >nul
    echo [✓] Environment file created
) else (
    echo [✓] Environment file already exists
)

:: Setup database
echo Setting up database...
call npm run db:generate
if %errorlevel% neq 0 (
    echo [ERROR] Failed to generate Prisma client
    pause
    exit /b 1
)

call npm run db:push
if %errorlevel% neq 0 (
    echo [ERROR] Failed to create database schema
    pause
    exit /b 1
)

call npm run db:seed
if %errorlevel% neq 0 (
    echo [ERROR] Failed to seed database
    pause
    exit /b 1
)

echo [✓] Database setup complete
echo.

:: Navigate to UI directory
echo =====================================
echo Setting up Frontend UI...
echo =====================================
cd ..\ui

:: Install UI dependencies
echo Installing UI dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install UI dependencies
    pause
    exit /b 1
)

echo [✓] UI setup complete
echo.

:: Start both servers
echo =====================================
echo Starting Application...
echo =====================================
echo.
echo Starting API server on http://localhost:3001
echo Starting UI server on http://localhost:5173
echo.
echo Press Ctrl+C in each window to stop the servers
echo.

:: Start API server in new window
cd ..\api
start "API Server - Port 3001" cmd /k npm run dev

:: Wait a bit for API to start
timeout /t 5 /nobreak >nul

:: Start UI server in new window
cd ..\ui
start "UI Server - Port 5173" cmd /k npm run dev

:: Wait for UI to start
timeout /t 5 /nobreak >nul

echo =====================================
echo Application Started Successfully!
echo =====================================
echo.
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:3001/api-docs
echo.
echo Demo Accounts (password: password123):
echo - Citizen: john@example.com
echo - Admin: admin@city.gov
echo - Clerk: mary.clerk@city.gov
echo.
echo To stop the servers, close the server windows or press Ctrl+C in each window
echo.
pause