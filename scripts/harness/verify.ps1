param()

$ErrorActionPreference = "Stop"

$requiredFiles = @(
    "docs/PRD.md",
    "docs/ARCHITECTURE.md",
    "docs/DATA_CONTRACTS.md",
    "docs/OPERATIONS.md",
    "docs/HARNESS.md",
    "docs/TIME_AND_MONEY_RULES.md",
    "docs/OUT_OF_SCOPE.md",
    "AGENTS.md",
    "scripts/harness/preflight.ps1",
    "scripts/harness/verify.ps1",
    "scripts/harness/smoke.ps1",
    "scripts/harness/report.ps1",
    "scripts/contracts/validate-stage-b.ps1",
    "scripts/contracts/validate-stage-b.mjs",
    "fixtures/content/sample_article_variants/adult_short.md",
    "fixtures/content/sample_article_variants/adult_long.md",
    "fixtures/content/sample_article_variants/teen_short.md",
    "fixtures/content/sample_article_variants/teen_long.md"
)

$results = foreach ($file in $requiredFiles) {
    [PSCustomObject]@{
        path = $file
        exists = Test-Path $file
    }
}

[PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    files = $results
    all_present = (($results | Where-Object { -not $_.exists }).Count -eq 0)
} | ConvertTo-Json -Depth 4
