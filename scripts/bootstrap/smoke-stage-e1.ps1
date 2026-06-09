param()

$ErrorActionPreference = "Stop"

$outputDir = Join-Path $PSScriptRoot "..\..\output\stage-e1"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

node "scripts/bootstrap/collect-stage-e1-report.mjs" smoke

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
