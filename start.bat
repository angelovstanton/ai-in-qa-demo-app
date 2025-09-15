@echo off
echo =====================================
echo Starting AI in QA Demo App...
echo =====================================
echo.

:: Check if we're in the right directory
if not exist "city-services-portal" (
    echo [ERROR] Cannot find city-services-portal directory
    echo Please run this script from the root of the ai-in-qa-demo-app repository
    pause
    exit /b 1
)

:: Check if node_modules exist
if not exist "city-services-portal\api\node_modules" (
    echo [WARNING] API dependencies not installed. Run install-and-run.bat first!
    pause
    exit /b 1
)

if not exist "city-services-portal\ui\node_modules" (
    echo [WARNING] UI dependencies not installed. Run install-and-run.bat first!
    pause
    exit /b 1
)

:: Check if .env exists
if not exist "city-services-portal\api\.env" (
    echo [WARNING] Environment file not found. Creating from template...
    cd city-services-portal\api
    copy .env.example .env >nul
    cd ..\..
)

echo Starting API server on http://localhost:3001
echo Starting UI server on http://localhost:5173
echo.

:: Start API server in new window
cd city-services-portal\api
start "API Server - Port 3001" cmd /k npm run dev

:: Wait a bit for API to start
timeout /t 3 /nobreak >nul

:: Start UI server in new window
cd ..\ui
start "UI Server - Port 5173" cmd /k npm run dev

cd ..\..

:: Wait a bit more for servers to be ready
timeout /t 3 /nobreak >nul

:: Open browser windows
echo Opening application in browser...
start "" "http://localhost:5173"
timeout /t 2 /nobreak >nul
start "" "http://localhost:3001/api-docs"

echo.
echo =====================================
echo Application Started!
echo =====================================
echo.
echo [OPENED IN BROWSER]
echo - Frontend: http://localhost:5173
echo - Swagger API Docs: http://localhost:3001/api-docs
echo.
echo [RUNNING SERVERS]
echo - API Server: Port 3001 (see "API Server" window)
echo - UI Server: Port 5173 (see "UI Server" window)
echo.
echo To stop the servers, close the windows or press Ctrl+C in each window
echo.
pause