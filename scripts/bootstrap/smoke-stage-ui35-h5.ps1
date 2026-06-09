$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outputDir = Join-Path $repoRoot "output\stage-ui35-h5"
$reportPath = Join-Path $outputDir "h5-shell-report.json"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

if (-not (Test-Path $reportPath)) {
    "{`"status`":`"pending`"}" | Set-Content -Path $reportPath -Encoding utf8
}

node .\scripts\bootstrap\smoke-stage-ui35-h5.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
