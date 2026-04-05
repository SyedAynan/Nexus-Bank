# Stack Health Check - BANK PROJECT
# Run from repo root. Checks backend health; optionally set $env:CURSOR_MCPS_PATH to list MCP servers.

$ErrorActionPreference = "Stop"
$baseUrl = "http://127.0.0.1:8000"

Write-Host "=== Stack Health Check ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Backend (FastAPI) health..." -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) {
        Write-Host "    OK (200)" -ForegroundColor Green
        $body = $r.Content | ConvertFrom-Json
        Write-Host "    status: $($body.status), environment: $($body.environment)"
    } else {
        Write-Host "    Unexpected status: $($r.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "    FAIL - backend not reachable (is it running?)" -ForegroundColor Red
    Write-Host "    Hint: docker-compose up -d  OR  uvicorn bank_system.main:app --reload"
}

Write-Host ""
Write-Host "[2] MCP tool manifest..." -ForegroundColor Yellow
$mcpsPath = $env:CURSOR_MCPS_PATH
if (-not $mcpsPath) {
    $mcpsPath = Join-Path $env:USERPROFILE ".cursor\projects\c-BANK-PROJECT\mcps"
}
if (Test-Path $mcpsPath) {
    $toolDirs = Get-ChildItem -Path $mcpsPath -Directory -Recurse -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -eq "tools" }
    $parents = $toolDirs | ForEach-Object { $_.Parent.Name } | Sort-Object -Unique
    if ($parents) {
        Write-Host "    OK - Found $($parents.Count) server(s):" -ForegroundColor Green
        $parents | ForEach-Object { Write-Host "      - $_" }
    } else {
        Write-Host "    No tools folders found." -ForegroundColor Gray
    }
} else {
    Write-Host "    mcps folder not found. Set CURSOR_MCPS_PATH if needed." -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Cyan
