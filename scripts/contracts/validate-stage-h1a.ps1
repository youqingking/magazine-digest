param()

$ErrorActionPreference = "Stop"

node .\scripts\contracts\validate-stage-h1a.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
