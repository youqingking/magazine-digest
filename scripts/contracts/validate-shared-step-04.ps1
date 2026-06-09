param()

$ErrorActionPreference = "Stop"

node ".\scripts\contracts\validate-shared-step-04.mjs"

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
