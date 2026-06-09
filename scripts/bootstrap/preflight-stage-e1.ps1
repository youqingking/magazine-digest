param()

$ErrorActionPreference = "Stop"

$outputDir = Join-Path $PSScriptRoot "..\..\output\stage-e1"
New-Item -ItemType Directory -Path $outputDir -Force | Out-Null

& "scripts/bootstrap/hbuilderx-compile-readiness.ps1"
