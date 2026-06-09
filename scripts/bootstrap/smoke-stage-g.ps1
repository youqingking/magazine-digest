param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\smoke-stage-g.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
