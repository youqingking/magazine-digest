param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\smoke-stage-h0.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
