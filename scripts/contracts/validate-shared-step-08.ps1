$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..\..")

Push-Location $repoRoot
try {
  node "scripts/contracts/validate-shared-step-08.mjs"
} finally {
  Pop-Location
}
