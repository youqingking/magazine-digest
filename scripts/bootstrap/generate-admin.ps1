param()

$ErrorActionPreference = "Stop"

$nodeScript = Join-Path $PSScriptRoot "generate-admin.mjs"

if (-not (Test-Path $nodeScript)) {
    throw "[missing file] Missing admin generator script: $nodeScript"
}

node $nodeScript

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
