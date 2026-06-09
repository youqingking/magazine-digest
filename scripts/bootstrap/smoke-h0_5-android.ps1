param()

$ErrorActionPreference = "Stop"

node .\scripts\bootstrap\smoke-h0_5-android.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
