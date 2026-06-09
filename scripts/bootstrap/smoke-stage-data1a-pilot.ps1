$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outputDir = Join-Path $repoRoot "output\stage-data1a-pilot"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

node .\scripts\bootstrap\smoke-stage-data1a-pilot.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
