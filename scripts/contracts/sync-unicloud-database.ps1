param()

$ErrorActionPreference = "Stop"

$nodeScript = Join-Path $PSScriptRoot "sync-unicloud-database.mjs"

if (-not (Test-Path $nodeScript)) {
    throw "[missing file] Missing schema sync script: $nodeScript"
}

node $nodeScript

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
