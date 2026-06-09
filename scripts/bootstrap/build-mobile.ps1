param()

$ErrorActionPreference = "Stop"

& "scripts/bootstrap/hbuilderx-compile-readiness.ps1" | Out-Null

$rawReportPath = "output/stage-e1/compile-report.json"
$normalizedDir = "output/stage-ui3"
$normalizedReportPath = Join-Path $normalizedDir "build-mobile-report.json"

if (-not (Test-Path $rawReportPath)) {
    throw "RAW_COMPILE_REPORT_MISSING: $rawReportPath"
}

New-Item -ItemType Directory -Force -Path $normalizedDir | Out-Null

$raw = Get-Content $rawReportPath -Raw | ConvertFrom-Json

$ignoredNodeOnlyPrefixes = @(
    "mobile/unpackage/",
    "mobile/uniCloud-aliyun/cloudfunctions/",
    "mobile/uni_modules/uni-captcha/uniCloud/",
    "mobile/uni_modules/uni-config-center/uniCloud/",
    "mobile/uni_modules/uni-id-common/uniCloud/",
    "mobile/uni_modules/uni-id-pages/uniCloud/"
)

$relevantNodeOnlyReferences = @(
    @($raw.findings.node_only_references) | Where-Object {
        $file = $_.file
        -not ($ignoredNodeOnlyPrefixes | Where-Object { $file.StartsWith($_) })
    }
)

$readinessPassed =
    (@($raw.findings.missing_files).Count -eq 0) -and
    (@($raw.findings.cross_root_imports).Count -eq 0) -and
    ($relevantNodeOnlyReferences.Count -eq 0) -and
    (($raw.findings.main_js_uses_create_ssr_app) -or ($raw.findings.main_js_uses_legacy_vue_mount)) -and
    (-not $raw.findings.app_vue_uses_slot_shell)

$realCompileAttempted = [bool]($raw.PSObject.Properties.Name -contains "real_compile_attempted" -and $raw.real_compile_attempted)
$toolDetected = [bool]$raw.environment.hbuilderx_path

if (-not $toolDetected) {
    $classification = "tool_missing"
} elseif (-not $readinessPassed) {
    $classification = "compile_readiness_failed"
} elseif ($raw.compile_success) {
    $classification = "real_compile_passed"
} elseif ($realCompileAttempted) {
    $classification = "real_compile_failed"
} else {
    $classification = "compile_readiness_passed_but_real_compile_not_triggered"
}

$normalized = [PSCustomObject]@{
    generated_at = (Get-Date).ToString("o")
    stage = "UI3.5"
    source_stage = $raw.stage
    classification = $classification
    compile_success = [bool]$raw.compile_success
    compile_readiness_passed = $readinessPassed
    real_compile_attempted = $realCompileAttempted
    tool_detected = $toolDetected
    compile_target = $raw.compile_target
    environment = $raw.environment
    pages = $raw.pages
    findings = [PSCustomObject]@{
        missing_files = @($raw.findings.missing_files)
        cross_root_imports = @($raw.findings.cross_root_imports)
        relevant_node_only_references = $relevantNodeOnlyReferences
        ignored_node_only_references = @($raw.findings.node_only_references) | Where-Object {
            $file = $_.file
            $ignoredNodeOnlyPrefixes | Where-Object { $file.StartsWith($_) }
        }
        main_js_uses_create_ssr_app = [bool]$raw.findings.main_js_uses_create_ssr_app
        main_js_uses_legacy_vue_mount = [bool]$raw.findings.main_js_uses_legacy_vue_mount
        app_vue_uses_slot_shell = [bool]$raw.findings.app_vue_uses_slot_shell
    }
    auto_steps = $raw.auto_steps
    manual_steps_required = $raw.manual_steps_required
    raw_stage_e1_conclusion = $raw.conclusion
    classification_notes = switch ($classification) {
        "tool_missing" { @("HBuilderX executable not detected; readiness cannot advance to real compile.") }
        "compile_readiness_failed" { @("Project shell has readiness blockers unrelated to manual HBuilderX click-through.") }
        "compile_readiness_passed_but_real_compile_not_triggered" { @("Shell readiness passed after excluding generated output and cloudfunction-only Node references.", "No trustworthy automated signal proves that HBuilderX performed a real compile in this run.") }
        "real_compile_passed" { @("A real compile was attempted and passed.") }
        "real_compile_failed" { @("A real compile was attempted and failed.") }
    }
}

$json = $normalized | ConvertTo-Json -Depth 8
Set-Content -Path $normalizedReportPath -Value $json -Encoding UTF8
$json
