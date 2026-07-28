Write-Host "Starting UrbanPilot development servers..." -ForegroundColor Green

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $projectRoot "backend"

Write-Host ""
Write-Host "[1/2] Starting Webhook server (Flask) on port 5000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; python -m backend.webhook.app"

Write-Host "[2/2] Starting API server (FastAPI) on port 8000..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backendDir'; uvicorn backend.main:app --reload --port 8000"

Write-Host ""
Write-Host "All backend servers started." -ForegroundColor Green
Write-Host "  - Webhook: http://127.0.0.1:5000" -ForegroundColor Yellow
Write-Host "  - API:     http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "  - Docs:    http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "Don't forget to start the frontend in another terminal:" -ForegroundColor Gray
Write-Host "  cd frontend && npm run dev" -ForegroundColor Gray
