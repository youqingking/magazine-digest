$ErrorActionPreference = "Stop"
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$output = node (Join-Path $repoRoot "scripts\bootstrap\smoke-stage-rel2.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
$output
