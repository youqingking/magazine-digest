param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\report-h0_5-automation.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
