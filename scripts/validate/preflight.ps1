param()

$ErrorActionPreference = "Stop"

function Test-CommandExists {
    param([string]$CommandName)
    try {
        $null = Get-Command $CommandName -ErrorAction Stop
        return $true
    } catch {
        return $false
    }
}

function Get-CommandVersion {
    param(
        [string]$CommandName,
        [string[]]$Args = @("--version")
    )

    if (-not (Test-CommandExists -CommandName $CommandName)) {
        return $null
    }

    try {
        $output = & $CommandName @Args 2>$null | Select-Object -First 1
        if ($null -eq $output) {
            return "available"
        }
        return ($output | Out-String).Trim()
    } catch {
        return "available"
    }
}

function Get-GitBranch {
    if (-not (Test-CommandExists -CommandName "git")) {
        return $null
    }

    try {
        return ((git branch --show-current) | Out-String).Trim()
    } catch {
        return $null
    }
}

function Get-GitStatusSummary {
    if (-not (Test-CommandExists -CommandName "git")) {
        return @("git not found")
    }

    try {
        return @(git status --short --branch)
    } catch {
        return @("git status unavailable")
    }
}

$requiredPaths = @(
    "AGENTS.md",
    "docs/STACK_DECISION.md",
    "docs/MIGRATION_AUDIT.md",
    "docs/TARGET_REPO_MAP.md",
    "docs/WORKTREE_PLAN.md",
    "docs/VALIDATION_MATRIX.md",
    "docs/OUT_OF_SCOPE.md",
    "docs/NEED_HUMAN.md",
    "docs/NEXT_THREAD_PROMPT.md",
    "pnpm-workspace.yaml",
    "package.json",
    "scripts/validate/preflight.ps1",
    "scripts/validate/preflight.sh",
    "packages/core-contracts/README.md",
    "packages/core-domain/README.md",
    "packages/core-ui/README.md",
    "infra/supabase/README.md"
)

$pathChecks = foreach ($path in $requiredPaths) {
    [PSCustomObject]@{
        path = $path
        exists = Test-Path $path
    }
}

$missing = @($pathChecks | Where-Object { -not $_.exists })
$branch = Get-GitBranch
$statusSummary = Get-GitStatusSummary
$isGitRepo = Test-Path ".git"
$onProtectedBranch = $branch -in @("main", "master")

$report = [PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    cwd = (Resolve-Path ".").Path
    git = [PSCustomObject]@{
        is_repo = $isGitRepo
        branch = $branch
        on_protected_branch = $onProtectedBranch
        summary = $statusSummary
    }
    tools = [PSCustomObject]@{
        node = Get-CommandVersion -CommandName "node"
        pnpm = Get-CommandVersion -CommandName "pnpm"
        npm = Get-CommandVersion -CommandName "npm"
        git = Get-CommandVersion -CommandName "git"
    }
    required_paths = $pathChecks
    result = [PSCustomObject]@{
        missing_count = @($missing).Count
        passed = (@($missing).Count -eq 0) -and $isGitRepo -and (-not $onProtectedBranch)
    }
}

$report | ConvertTo-Json -Depth 6

if (-not $report.result.passed) {
    exit 1
}
