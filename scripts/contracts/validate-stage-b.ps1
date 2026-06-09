param()

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$nodeScript = Join-Path $scriptDir "validate-stage-b.mjs"

if (-not (Test-Path $nodeScript)) {
    throw "[missing file] Missing required validator: $nodeScript"
}

node $nodeScript

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
