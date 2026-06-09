param()

$ErrorActionPreference = "Stop"

$preflight = & powershell -ExecutionPolicy Bypass -File ".\scripts\harness\preflight.ps1" | ConvertFrom-Json
$verify = & powershell -ExecutionPolicy Bypass -File ".\scripts\harness\verify.ps1" | ConvertFrom-Json
$smoke = & powershell -ExecutionPolicy Bypass -File ".\scripts\harness\smoke.ps1" | ConvertFrom-Json

$needHuman = @()

$needHuman += @($preflight.env | Where-Object { -not $_.configured } | ForEach-Object {
    "Missing env var: $($_.name)"
})

if (-not $preflight.tools.hbuilderx) {
    $needHuman += "Missing desktop tool: HBuilderX"
}

if ((-not $preflight.tools.pnpm) -and (-not $preflight.tools.npm)) {
    $needHuman += "Missing package manager: pnpm or npm"
}

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    preflight = $preflight
    verify = $verify
    smoke = $smoke
    need_human = $needHuman
} | ConvertTo-Json -Depth 8
