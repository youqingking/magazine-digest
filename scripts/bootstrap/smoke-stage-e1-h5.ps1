param()

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$outputDir = Join-Path $repoRoot "output\stage-e1-h5"
$browserConsolePath = Join-Path $outputDir "browser-console.json"
$pageErrorsPath = Join-Path $outputDir "page-errors.json"
$reportPath = Join-Path $outputDir "white-screen-report.json"

New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

if (-not (Test-Path $browserConsolePath)) {
    "[]" | Set-Content -Path $browserConsolePath -Encoding utf8
}

if (-not (Test-Path $pageErrorsPath)) {
    "{`"pageerror`":[] ,`"requestfailed`":[]}" | Set-Content -Path $pageErrorsPath -Encoding utf8
}

if (-not (Test-Path $reportPath)) {
    "{`"status`":`"pending`"}" | Set-Content -Path $reportPath -Encoding utf8
}

npx playwright test tests/smoke/h5-white-screen.spec.js --reporter=line

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
