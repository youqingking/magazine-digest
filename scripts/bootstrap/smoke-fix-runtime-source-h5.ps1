$ErrorActionPreference = "Stop"
Set-Location (Split-Path -Parent $PSScriptRoot)
Set-Location ..

node scripts/bootstrap/smoke-fix-runtime-source-h5.mjs
