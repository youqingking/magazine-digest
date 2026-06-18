param()

$ErrorActionPreference = "Stop"

node .\scripts\validate\typecheck.mjs

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
