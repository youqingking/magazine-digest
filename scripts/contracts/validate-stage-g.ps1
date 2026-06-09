param()

$ErrorActionPreference = "Stop"

node .\scripts\contracts\validate-stage-g.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
