$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

node "scripts/contracts/validate-shared-step-07.mjs"

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
