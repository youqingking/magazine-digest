param()

$ErrorActionPreference = "Stop"

node ".\scripts\bootstrap\smoke-stage-f1.mjs"

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
