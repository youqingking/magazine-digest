param()

$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "admin/index.html",
    "admin/src/main.js",
    "admin/src/routes.js",
    "admin/src/services/generated-resources.js",
    "admin/src/services/workflow-stubs.js",
    "admin/src/services/contract-map.js",
    "admin/pages-generated/registry.generated.json"
)

if (-not (Test-Path "admin/pages-generated/registry.generated.json")) {
    & powershell -ExecutionPolicy Bypass -File ".\scripts\bootstrap\generate-admin.ps1" | Out-Null
}

$results = foreach ($file in $requiredFiles) {
    [PSCustomObject]@{
        path = $file
        exists = Test-Path $file
    }
}

$registry = Get-Content "admin/pages-generated/registry.generated.json" -Raw | ConvertFrom-Json

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    status = if (($results | Where-Object { -not $_.exists }).Count -eq 0) { "shell_ready" } else { "incomplete" }
    compile_mode = "static_admin_shell"
    generated_track = "admin/pages-generated"
    generated_resources = @($registry.resources)
    files = $results
} | ConvertTo-Json -Depth 5
