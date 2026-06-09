param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\verify-h0_5-device-db.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
