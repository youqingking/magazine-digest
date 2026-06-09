param()

$ErrorActionPreference = "Stop"

function Resolve-HBuilderXPath {
    $candidates = @(
        "D:\HBuilderX\HBuilderX.exe",
        $env:HBUILDERX_EXE,
        $env:HBUILDERX_PATH,
        "C:\Program Files\HBuilderX\HBuilderX.exe",
        "C:\Program Files (x86)\HBuilderX\HBuilderX.exe",
        "D:\Program Files\HBuilderX\HBuilderX.exe"
    ) | Where-Object { $_ }

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            return (Resolve-Path $candidate).Path
        }
    }

    return $null
}

$resolvedHBuilderX = Resolve-HBuilderXPath

if ($resolvedHBuilderX) {
    $env:HBUILDERX_EXE = $resolvedHBuilderX
    $env:HBUILDERX_PATH = $resolvedHBuilderX
}

node "scripts/bootstrap/collect-stage-e1-report.mjs" compile

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
