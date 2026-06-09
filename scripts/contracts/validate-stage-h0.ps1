param()

$ErrorActionPreference = "Stop"

node .\scripts\contracts\validate-stage-h0.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
