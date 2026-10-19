@echo off
setlocal EnableDelayedExpansion
:: City Services Portal - Docker control script
:: Usage: docker-app.bat [start^|reset^|reseed^|restart^|stop^|logs [service]^|status^|clean^|help]

cd /d "%~dp0"

set "COMMAND=%~1"
if "%COMMAND%"=="" set "COMMAND=start"

if /i "%COMMAND%"=="help" goto usage
if /i "%COMMAND%"=="-h" goto usage
if /i "%COMMAND%"=="--help" goto usage

call :check_docker || exit /b 1

if /i "%COMMAND%"=="start" goto start
if /i "%COMMAND%"=="reset" goto reset
if /i "%COMMAND%"=="reseed" goto reseed
if /i "%COMMAND%"=="restart" goto restart
if /i "%COMMAND%"=="stop" goto stop
if /i "%COMMAND%"=="logs" goto logs
if /i "%COMMAND%"=="status" goto status
if /i "%COMMAND%"=="clean" goto clean

echo [ERROR] Unknown command: %COMMAND%
echo.
goto usage_error

:start
call :print_header
docker compose up -d --build || exit /b 1
call :wait_for_app || exit /b 1
call :print_info
exit /b 0

:reset
call :print_header
echo Resetting: removing containers and database volume...
docker compose down -v || exit /b 1
docker compose up -d --build || exit /b 1
call :wait_for_app || exit /b 1
call :print_info
exit /b 0

:reseed
call :print_header
echo Reseeding database...
docker compose stop api || exit /b 1
docker compose run --rm --no-deps -e FORCE_SEED=true api true || exit /b 1
docker compose up -d || exit /b 1
call :wait_for_app || exit /b 1
call :print_info
exit /b 0

:restart
call :print_header
docker compose restart || exit /b 1
call :wait_for_app || exit /b 1
call :print_info
exit /b 0

:stop
docker compose stop
exit /b %ERRORLEVEL%

:logs
docker compose logs -f %2
exit /b %ERRORLEVEL%

:status
docker compose ps
exit /b %ERRORLEVEL%

:clean
docker compose down -v --rmi local --remove-orphans || exit /b 1
echo [OK] Containers, data volume and images removed.
exit /b 0

:: ---------------------------------------------------------------

:check_docker
where docker >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not installed. Get it from https://docs.docker.com/get-docker/
    exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Start Docker Desktop and try again.
    exit /b 1
)
docker compose version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker Compose v2 is required ^('docker compose'^).
    exit /b 1
)
exit /b 0

:wait_for_app
echo Waiting for the API (a fresh database is seeded first - this can take 1-3 minutes)...
set "API_ID="
for /f "delims=" %%i in ('docker compose ps -q api') do set "API_ID=%%i"
if "%API_ID%"=="" (
    echo [ERROR] API container not found. Check logs with: docker-app.bat logs api
    exit /b 1
)
for /l %%n in (1,1,150) do (
    set "HEALTH="
    for /f "delims=" %%s in ('docker inspect -f "{{.State.Health.Status}}" %API_ID% 2^>nul') do set "HEALTH=%%s"
    if "!HEALTH!"=="healthy" (
        echo [OK] API is healthy
        exit /b 0
    )
    set /a "MOD=%%n %% 5"
    if !MOD!==0 (
        set /a "ELAPSED=%%n * 2"
        echo   ...still starting ^(!ELAPSED!s elapsed^)
    )
    ping -n 3 127.0.0.1 >nul
)
echo [ERROR] API did not become healthy in time. Check logs with: docker-app.bat logs api
exit /b 1

:print_header
echo =====================================
echo  City Services Portal (Docker)
echo =====================================
echo.
exit /b 0

:print_info
echo.
echo =====================================
echo  Application is running
echo =====================================
echo  Frontend: http://localhost:5173
echo  API:      http://localhost:3001
echo  API Docs: http://localhost:3001/api-docs
echo.
echo  Demo accounts (password: password123):
echo    Citizen:     john@example.com
echo    Clerk:       mary.clerk@city.gov
echo    Supervisor:  supervisor1@city.gov
echo    Field Agent: agent1@city.gov
echo    Admin:       admin@city.gov
echo.
echo  Manage: docker-app.bat [restart^|reset^|reseed^|stop^|logs^|status^|clean]
echo =====================================
exit /b 0

:usage
call :print_usage
exit /b 0

:usage_error
call :print_usage
exit /b 1

:print_usage
echo Usage: docker-app.bat [command]
echo.
echo Commands:
echo   start     Build images and start the app (default). Seeds data on first run.
echo   reset     Remove containers and data volume, rebuild and start with fresh seed data.
echo   reseed    Wipe and reseed the database only (no rebuild).
echo   restart   Restart the running containers (data is kept).
echo   stop      Stop the containers (data is kept).
echo   logs      Follow logs. Optionally pass a service: logs api ^| logs ui
echo   status    Show container status.
echo   clean     Remove containers, data volume and built images.
echo   help      Show this help.
exit /b 0
