param()

$ErrorActionPreference = "Stop"

$preflight = & powershell -ExecutionPolicy Bypass -File ".\scripts\harness\preflight.ps1" | ConvertFrom-Json
$verify = & powershell -ExecutionPolicy Bypass -File ".\scripts\harness\verify.ps1" | ConvertFrom-Json
$mobile = & powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\build-mobile.ps1" | ConvertFrom-Json
$admin = & powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\build-admin.ps1" | ConvertFrom-Json

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    stage = "C"
    preflight_ok = ($preflight.directories | Where-Object { -not $_.exists }).Count -eq 0
    verify_ok = [bool]$verify.all_present
    mobile_status = $mobile.status
    admin_status = $admin.status
    missing_env = @($preflight.env | Where-Object { -not $_.configured } | ForEach-Object { $_.name })
    missing_tools = @(
        if (-not $preflight.tools.hbuilderx) { "HBuilderX" }
    ) | Where-Object { $_ }
} | ConvertTo-Json -Depth 5
