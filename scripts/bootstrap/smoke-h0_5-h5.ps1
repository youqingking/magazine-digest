param()

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outputDir = Join-Path $repoRoot "output\stage-h0_5-h5"
$reportPath = Join-Path $outputDir "device-diagnostics-report.json"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

if (-not (Test-Path $reportPath)) {
    "{`"status`":`"pending`"}" | Set-Content -Path $reportPath -Encoding utf8
}

node .\scripts\bootstrap\smoke-h0_5-h5.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
