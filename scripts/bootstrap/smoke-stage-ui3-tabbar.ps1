$ErrorActionPreference = "Stop"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "smoke-stage-ui3-tabbar.mjs")
node $scriptPath
