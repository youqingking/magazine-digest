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

function Get-HBuilderXPath {
    $envCandidates = @(
        [Environment]::GetEnvironmentVariable("HBUILDERX_PATH"),
        [Environment]::GetEnvironmentVariable("HBUILDERX_HOME"),
        [Environment]::GetEnvironmentVariable("HBUILDERX_DIR")
    ) | Where-Object { $_ -and $_.Trim() -ne "" }

    foreach ($candidate in $envCandidates) {
        if (Test-Path $candidate -PathType Leaf) {
            return $candidate
        }

        $exeCandidate = Join-Path $candidate "HBuilderX.exe"
        if (Test-Path $exeCandidate) {
            return $exeCandidate
        }
    }

    $pathCommands = @("HBuilderX.exe", "cli.exe")
    foreach ($command in $pathCommands) {
        try {
            $resolved = Get-Command $command -ErrorAction Stop | Select-Object -First 1 -ExpandProperty Source
            if ($resolved -and (Test-Path $resolved)) {
                return $resolved
            }
        } catch {
        }
    }

    $candidates = @(
        "$env:ProgramFiles\HBuilderX\HBuilderX.exe",
        "$env:ProgramFiles(x86)\HBuilderX\HBuilderX.exe",
        "$env:LOCALAPPDATA\Programs\HBuilderX\HBuilderX.exe",
        "D:\HBuilderX\HBuilderX.exe",
        "D:\HBuilderX0\HBuilderX.exe",
        "D:\Program Files\HBuilderX\HBuilderX.exe",
        "D:\Program Files (x86)\HBuilderX\HBuilderX.exe",
        "E:\HBuilderX\HBuilderX.exe",
        "E:\HBuilderX0\HBuilderX.exe",
        "C:\Program Files\HBuilderX\HBuilderX.exe",
        "C:\Program Files (x86)\HBuilderX\HBuilderX.exe"
    ) | Where-Object { $_ -and $_.Trim() -ne "" }

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return $candidate
        }
    }

    $driveRoots = @("C:\", "D:\", "E:\") | Where-Object { Test-Path $_ }
    foreach ($driveRoot in $driveRoots) {
        $dynamicMatches = Get-ChildItem -Path $driveRoot -Directory -Filter "HBuilderX*" -ErrorAction SilentlyContinue
        foreach ($match in $dynamicMatches) {
            $exeCandidate = Join-Path $match.FullName "HBuilderX.exe"
            if (Test-Path $exeCandidate) {
                return $exeCandidate
            }
        }
    }

    return $null
}

function Get-GitStatus {
    if (-not (Test-CommandExists -CommandName "git")) {
        return @{
            available = $false
            branch = $null
            summary = @("git not found")
        }
    }

    $safeDir = (Resolve-Path ".").Path.Replace("\", "/")

    try {
        $branch = (& git -c "safe.directory=$safeDir" branch --show-current 2>$null | Out-String).Trim()
        $status = & git -c "safe.directory=$safeDir" status --short --branch 2>$null
        return @{
            available = $true
            branch = $branch
            summary = @($status)
        }
    } catch {
        return @{
            available = $true
            branch = $null
            summary = @("git status unavailable: $($_.Exception.Message)")
        }
    }
}

$requiredDirs = @(
    "docs",
    "scripts",
    "scripts/harness",
    "fixtures",
    "fixtures/content",
    "fixtures/content/sample_article_variants"
)

$requiredEnvVars = @(
    "ALICLOUD_SPACE_ID",
    "ALICLOUD_CLIENT_SECRET",
    "UNI_ADMIN_BASE_URL",
    "PUSH_APP_KEY",
    "PRODUCT_KEY_DEFAULT"
)

$dirChecks = foreach ($dir in $requiredDirs) {
    [PSCustomObject]@{
        path = $dir
        exists = Test-Path $dir
    }
}

$envChecks = foreach ($name in $requiredEnvVars) {
    $value = [Environment]::GetEnvironmentVariable($name)
    [PSCustomObject]@{
        name = $name
        configured = -not [string]::IsNullOrWhiteSpace($value)
    }
}

$gitStatus = Get-GitStatus
$hbuilderx = Get-HBuilderXPath

$report = [PSCustomObject]@{
    timestamp = (Get-Date).ToString("o")
    cwd = (Resolve-Path ".").Path
    tools = [PSCustomObject]@{
        node = Get-CommandVersion -CommandName "node"
        pnpm = Get-CommandVersion -CommandName "pnpm"
        npm = Get-CommandVersion -CommandName "npm"
        git = Get-CommandVersion -CommandName "git"
        hbuilderx = if ($hbuilderx) { $hbuilderx } else { $null }
    }
    directories = $dirChecks
    env = $envChecks
    git = [PSCustomObject]@{
        available = $gitStatus.available
        branch = $gitStatus.branch
        summary = $gitStatus.summary
    }
}

$report | ConvertTo-Json -Depth 6
