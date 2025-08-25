@echo off
echo ?? Stopping City Services Portal...
docker-compose down -v
echo ? Stopped and cleaned up containers
pause