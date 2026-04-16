# Quick Cloudflare Tunnel → local FastAPI scraper worker (default port 8000).
# Requires: cloudflared (https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-cloudflare-tunnel.ps1
#
# 1) Start the worker first (from your full project folder that has api/):
#      python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
# 2) Run this script. Copy the https://....trycloudflare.com URL from the output.
# 3) In Vercel → Project → Settings → Environment Variables:
#      SCRAPER_API_URL = https://....trycloudflare.com   (no trailing slash)
#      SCRAPER_API_SECRET = same value as in your worker .env
# 4) Redeploy or wait for env to apply.

param(
    [int]$Port = 8000
)

$ErrorActionPreference = "Stop"
$target = "http://127.0.0.1:$Port"

Write-Host ""
Write-Host "Cloudflare quick tunnel → $target" -ForegroundColor Cyan
Write-Host "Ensure FastAPI is already listening on $target" -ForegroundColor Yellow
Write-Host ""

& cloudflared tunnel --url $target
