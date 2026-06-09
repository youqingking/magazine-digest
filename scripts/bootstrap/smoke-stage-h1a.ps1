param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\smoke-stage-h1a.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
