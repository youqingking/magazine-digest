param()

$ErrorActionPreference = "Stop"

node ".\scripts\contracts\validate-f1-foundation.mjs"

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
