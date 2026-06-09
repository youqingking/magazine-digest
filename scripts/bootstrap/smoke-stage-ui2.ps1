$ErrorActionPreference = "Stop"

$scriptPath = Resolve-Path (Join-Path $PSScriptRoot "smoke-stage-ui2.mjs")
node $scriptPath
