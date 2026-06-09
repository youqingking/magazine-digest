$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..\..")
node scripts/bootstrap/smoke-stage-ops5.mjs
