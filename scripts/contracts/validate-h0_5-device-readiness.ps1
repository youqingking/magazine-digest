param()

$ErrorActionPreference = "Stop"

node .\scripts\contracts\validate-h0_5-device-readiness.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
