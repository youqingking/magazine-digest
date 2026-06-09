$ErrorActionPreference = 'Stop'

$outputPath = Join-Path $PWD 'output/pdf/app-summary.pdf'

function Escape-PdfText {
    param([string]$Text)
    return $Text.Replace('\', '\\').Replace('(', '\(').Replace(')', '\)')
}

$lines = @(
    @{ Text = 'App Summary'; Size = 22; X = 54; Y = 752 },
    @{ Text = 'Single-page summary based only on repository evidence'; Size = 10; X = 54; Y = 736 },
    @{ Text = 'Repo state: no commits, no checked-out app files'; Size = 10; X = 360; Y = 752 },

    @{ Text = 'WHAT IT IS'; Size = 12; X = 54; Y = 700 },
    @{ Text = 'This repository does not contain an application implementation yet.'; Size = 10; X = 54; Y = 684 },
    @{ Text = 'It is currently an empty Git repo with metadata only, so the app description is Not found in repo.'; Size = 10; X = 54; Y = 671 },

    @{ Text = 'WHO IT''S FOR'; Size = 12; X = 54; Y = 640 },
    @{ Text = '- Primary user/persona: Not found in repo.'; Size = 10; X = 54; Y = 624 },

    @{ Text = 'WHAT IT DOES'; Size = 12; X = 54; Y = 594 },
    @{ Text = '- Core user-facing functionality: Not found in repo.'; Size = 10; X = 54; Y = 578 },
    @{ Text = '- Screens, routes, or commands: Not found in repo.'; Size = 10; X = 54; Y = 565 },
    @{ Text = '- Backend/API behavior: Not found in repo.'; Size = 10; X = 54; Y = 552 },
    @{ Text = '- Authentication or account features: Not found in repo.'; Size = 10; X = 54; Y = 539 },
    @{ Text = '- Data storage or persistence behavior: Not found in repo.'; Size = 10; X = 54; Y = 526 },
    @{ Text = '- Background jobs, sync, or automation: Not found in repo.'; Size = 10; X = 54; Y = 513 },

    @{ Text = 'HOW IT WORKS'; Size = 12; X = 54; Y = 478 },
    @{ Text = 'No architecture for components, services, or data flow is present in the worktree.'; Size = 10; X = 54; Y = 462 },
    @{ Text = 'Evidence: .git/HEAD -> refs/heads/master; .git/config has only default core Git settings.'; Size = 10; X = 54; Y = 449 },
    @{ Text = 'No branch refs or checked-out source files are present, and Git reports the branch has no commits.'; Size = 10; X = 54; Y = 436 },

    @{ Text = 'HOW TO RUN'; Size = 12; X = 54; Y = 401 },
    @{ Text = '- Install/setup steps: Not found in repo.'; Size = 10; X = 54; Y = 385 },
    @{ Text = '- Entry point or start command: Not found in repo.'; Size = 10; X = 54; Y = 372 },
    @{ Text = '- Required environment variables/config: Not found in repo.'; Size = 10; X = 54; Y = 359 },

    @{ Text = 'REPOSITORY NOTE'; Size = 12; X = 54; Y = 324 },
    @{ Text = '- Initialize or fetch actual app files into this repository.'; Size = 10; X = 54; Y = 308 },
    @{ Text = '- Add docs such as a README, run command, and architecture notes.'; Size = 10; X = 54; Y = 295 },
    @{ Text = '- Re-run this summary once the app source is present.'; Size = 10; X = 54; Y = 282 },
    @{ Text = 'These steps are inferred from repo state, not existing repo instructions.'; Size = 9; X = 54; Y = 265 },

    @{ Text = 'Generated from local repo inspection only. Missing information is intentionally labeled Not found in repo.'; Size = 8.5; X = 54; Y = 66 }
)

$contentParts = New-Object System.Collections.Generic.List[string]
$contentParts.Add("0.11 0.20 0.28 rg")
$contentParts.Add("0.11 0.20 0.28 RG")
$contentParts.Add("2 w")
$contentParts.Add("54 728 m 558 728 l S")

foreach ($line in $lines) {
    $escaped = Escape-PdfText $line.Text
    $contentParts.Add("BT /F1 $($line.Size) Tf 1 0 0 1 $($line.X) $($line.Y) Tm ($escaped) Tj ET")
}

$content = ($contentParts -join "`n") + "`n"
$contentBytes = [System.Text.Encoding]::ASCII.GetBytes($content)
$contentLength = $contentBytes.Length

$objects = @(
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Count 1 /Kids [3 0 R] >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Length $contentLength >>`nstream`n$content" + "endstream"
)

$builder = New-Object System.Text.StringBuilder
[void]$builder.Append("%PDF-1.4`n")

$offsets = New-Object System.Collections.Generic.List[int]
for ($i = 0; $i -lt $objects.Count; $i++) {
    $offsets.Add([System.Text.Encoding]::ASCII.GetByteCount($builder.ToString()))
    [void]$builder.AppendFormat("{0} 0 obj`n{1}`nendobj`n", $i + 1, $objects[$i])
}

$xrefOffset = [System.Text.Encoding]::ASCII.GetByteCount($builder.ToString())
[void]$builder.Append("xref`n")
[void]$builder.AppendFormat("0 {0}`n", $objects.Count + 1)
[void]$builder.Append("0000000000 65535 f `n")
foreach ($offset in $offsets) {
    [void]$builder.AppendFormat("{0:0000000000} 00000 n `n", $offset)
}
[void]$builder.Append("trailer`n")
[void]$builder.AppendFormat("<< /Size {0} /Root 1 0 R >>`n", $objects.Count + 1)
[void]$builder.Append("startxref`n")
[void]$builder.AppendFormat("{0}`n", $xrefOffset)
[void]$builder.Append("%%EOF")

[System.IO.File]::WriteAllBytes($outputPath, [System.Text.Encoding]::ASCII.GetBytes($builder.ToString()))
Write-Output $outputPath
