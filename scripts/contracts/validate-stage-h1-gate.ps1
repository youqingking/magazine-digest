param()

$ErrorActionPreference = "Stop"

node .\scripts\contracts\validate-stage-h1-gate.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
