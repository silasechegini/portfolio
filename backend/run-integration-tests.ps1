<#
.SYNOPSIS
    Spins up the isolated test database, waits until it is healthy, runs the
    integration tests, then tears everything down.

.USAGE
    From the backend directory:
        .\run-integration-tests.ps1

    From the repo root:
        .\backend\run-integration-tests.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# ---------------------------------------------------------------------------
# Resolve paths relative to this script's location
# ---------------------------------------------------------------------------
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$ComposeFile = Join-Path $ScriptDir "docker-compose-test.yml"

# ---------------------------------------------------------------------------
# 1. Start the test database container
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ">> Starting test database..." -ForegroundColor Cyan
docker compose -f $ComposeFile up -d

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: docker compose up failed." -ForegroundColor Red
    exit 1
}

# ---------------------------------------------------------------------------
# 2. Wait until Postgres reports healthy
#    Polls the container's health status every 2 seconds, up to 60 seconds.
# ---------------------------------------------------------------------------
Write-Host ">> Waiting for Postgres to become healthy..." -ForegroundColor Cyan

$ContainerName = "backend-postgres-1"   # default name Docker assigns
$MaxWait       = 60   # seconds
$Elapsed       = 0
$Interval      = 2

while ($Elapsed -lt $MaxWait) {
    $Status = docker inspect --format="{{.State.Health.Status}}" $ContainerName 2>$null
    if ($Status -eq "healthy") {
        Write-Host ">> Postgres is healthy. (waited ${Elapsed}s)" -ForegroundColor Green
        break
    }
    Write-Host "   status: $Status - retrying in ${Interval}s..." -ForegroundColor DarkGray
    Start-Sleep -Seconds $Interval
    $Elapsed += $Interval
}

if ($Elapsed -ge $MaxWait) {
    Write-Host "ERROR: Postgres did not become healthy within ${MaxWait}s." -ForegroundColor Red
    docker compose -f $ComposeFile down -v
    exit 1
}

# ---------------------------------------------------------------------------
# 3. Run the integration tests
#    Capture the exit code so we can propagate it after teardown.
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ">> Running integration tests..." -ForegroundColor Cyan
Set-Location $ScriptDir

npx jest contacts-store.integration --testPathPatterns=integration
$TestExitCode = $LASTEXITCODE

# ---------------------------------------------------------------------------
# 4. Tear down (always runs, even if tests failed)
# ---------------------------------------------------------------------------
Write-Host ""
Write-Host ">> Tearing down test database..." -ForegroundColor Cyan
docker compose -f $ComposeFile down -v

# ---------------------------------------------------------------------------
# 5. Exit with the test exit code so CI/CD pipelines detect failures
# ---------------------------------------------------------------------------
if ($TestExitCode -ne 0) {
    Write-Host ">> Tests FAILED (exit code $TestExitCode)." -ForegroundColor Red
} else {
    Write-Host ">> Tests PASSED." -ForegroundColor Green
}

exit $TestExitCode
