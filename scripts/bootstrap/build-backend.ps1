param()

$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "backend/index.mjs",
    "backend/cli.mjs",
    "backend/runtime/create-runtime.mjs",
    "backend/adapters/fixture-repository.mjs",
    "backend/contracts/surfaces.mjs",
    "docs/LOCAL_RUNTIME.md",
    "docs/BACKEND_SURFACES.md"
)

$results = foreach ($file in $requiredFiles) {
    [PSCustomObject]@{
        path = $file
        exists = Test-Path $file
    }
}

if (($results | Where-Object { -not $_.exists }).Count -ne 0) {
    [PSCustomObject]@{
        timestamp = (Get-Date).ToString("o")
        status = "missing_files"
        files = $results
    } | ConvertTo-Json -Depth 4
    exit 1
}

node .\backend\cli.mjs | Out-Null

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    status = "local_runtime_ready"
    runtime = "fixture_backed"
    output = "output/stage-d/backend-smoke.json"
    files = $results
} | ConvertTo-Json -Depth 4
