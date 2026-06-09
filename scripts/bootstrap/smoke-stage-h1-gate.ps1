param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\smoke-stage-h1-gate.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
