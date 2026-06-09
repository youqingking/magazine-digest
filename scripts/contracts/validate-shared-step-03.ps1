param()

$ErrorActionPreference = "Stop"

node ".\scripts\contracts\validate-shared-step-03.mjs"

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
