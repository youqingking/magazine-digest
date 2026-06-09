param()

$ErrorActionPreference = "Stop"

$commands = @(
    "powershell -ExecutionPolicy Bypass -File scripts/harness/verify.ps1",
    "powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-stage-b.ps1",
    "powershell -ExecutionPolicy Bypass -File scripts/contracts/sync-unicloud-database.ps1",
    "powershell -ExecutionPolicy Bypass -File scripts/bootstrap/generate-admin.ps1",
    "powershell -ExecutionPolicy Bypass -File scripts/bootstrap/build-admin.ps1",
    "powershell -ExecutionPolicy Bypass -File scripts/bootstrap/build-backend.ps1"
)

$results = @()

foreach ($command in $commands) {
    Invoke-Expression $command | Out-Null
    $results += [PSCustomObject]@{
        command = $command
        exit_code = $LASTEXITCODE
        status = if ($LASTEXITCODE -eq 0) { "passed" } else { "failed" }
    }

    if ($LASTEXITCODE -ne 0) {
        [PSCustomObject]@{
            timestamp = (Get-Date).ToString("o")
            status = "failed"
            results = $results
        } | ConvertTo-Json -Depth 5
        exit $LASTEXITCODE
    }
}

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    status = "passed"
    stage = "D"
    results = $results
} | ConvertTo-Json -Depth 5
