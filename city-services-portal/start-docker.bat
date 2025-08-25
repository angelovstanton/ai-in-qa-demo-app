@echo off
echo ?? Starting City Services Portal with Docker...
echo.

echo ?? Stopping any existing containers...
docker-compose down -v

echo ?? Building and starting containers...
docker-compose up --build

pause