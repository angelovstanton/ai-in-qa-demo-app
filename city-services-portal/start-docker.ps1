Write-Host "?? Starting City Services Portal with Docker..." -ForegroundColor Green
Write-Host ""

Write-Host "?? Stopping any existing containers..." -ForegroundColor Yellow
docker-compose down -v

Write-Host "?? Building and starting containers..." -ForegroundColor Yellow
docker-compose up --build

Write-Host ""
Write-Host "? Once started, access:" -ForegroundColor Green
Write-Host "?? Main App: http://localhost:5173" -ForegroundColor Cyan
Write-Host "?? API Docs: http://localhost:3001/api-docs" -ForegroundColor Cyan
Write-Host "??  Health: http://localhost:3001/health" -ForegroundColor Cyan