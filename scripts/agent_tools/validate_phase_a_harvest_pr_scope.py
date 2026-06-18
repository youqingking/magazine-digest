#!/usr/bin/env python3
"""Validate Phase A Harvest PR scope and artifact triage."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


TRIAGE_DOC = "docs/factory/UNTRACKED_FACTORY_ARTIFACT_TRIAGE.md"
SCOPE_DOC = "docs/factory/PHASE_A_HARVEST_PR_SCOPE.md"
PR_BODY_DOC = "docs/factory/PHASE_A_HARVEST_PR_BODY.md"

WATCH_PATHS = (
    ".agents/skills/",
    ".mcp.json",
    "AGNO_EXTENSION_MANIFEST.md",
    "README_AGNO_EXTENSION.md",
    "agno_app_factory/",
    "artifacts/",
    "codex_prompts/",
    "docs/agents/",
    "docs/agno/",
    "docs/architecture/",
    "docs/brand/",
    "docs/factory/",
    "docs/harness/",
    "docs/launch/",
    "docs/market/",
    "docs/privacy/",
    "docs/product/",
    "docs/release/",
    "evals/agents/",
    "evals/agno_workflows/",
    "requirements/",
    "scripts/agent_tools/",
)

CLASSIFICATIONS = (
    "adopt_now",
    "archive_later",
    "ignore",
    "local_only",
    "needs_human",
)

REQUIRED_SCOPE_TERMS = (
    "Exact Intended PR Files",
    "Explicit Non-Goals",
    "Files Intentionally Left Untracked",
    "Files Intentionally Ignored",
    "Files Excluded From The Narrow PR",
    "Reviewer Checklist",
)

REQUIRED_TRIAGE_TERMS = CLASSIFICATIONS + (
    "Current Untracked Artifact Paths",
    "Branch-Diff Artifact Triage",
)

REQUIRED_PR_BODY_TERMS = (
    "Scope Summary",
    "Exact Files Intended For Review",
    "Non-Goals",
    "Excluded Artifacts",
    "Validation Evidence",
    "Remaining Risks",
    "Reviewer Checklist",
    "Follow-Up Artifact Adoption Thread",
)


def as_posix(path: str) -> str:
    return path.replace("\\", "/")


def run_git(root: Path, args: list[str]) -> tuple[int, str, str]:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            text=True,
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        return 127, "", str(exc)
    return result.returncode, result.stdout, result.stderr


def intended_pr_files(scope_text: str) -> list[str]:
    marker = "## Exact Intended PR Files"
    start = scope_text.find(marker)
    if start == -1:
        return []
    match = re.search(r"```text\n(?P<body>.*?)\n```", scope_text[start:], re.DOTALL)
    if not match:
        return []
    return [
        as_posix(line.strip())
        for line in match.group("body").splitlines()
        if line.strip() and not line.strip().startswith("#")
    ]


def untracked_artifact_paths(root: Path) -> tuple[list[str], str | None]:
    code, stdout, stderr = run_git(
        root,
        ["ls-files", "--others", "--exclude-standard", "--", *WATCH_PATHS],
    )
    if code != 0:
        return [], stderr.strip() or stdout.strip() or "git ls-files failed"
    return (
        sorted({as_posix(line.strip()) for line in stdout.splitlines() if line.strip()}),
        None,
    )


def branch_diff_paths(root: Path) -> tuple[list[str], str | None]:
    code, stdout, stderr = run_git(root, ["merge-base", "origin/main", "HEAD"])
    if code != 0:
        code, stdout, stderr = run_git(root, ["merge-base", "main", "HEAD"])
    if code != 0:
        return [], stderr.strip() or stdout.strip() or "git merge-base failed"

    base = stdout.strip()
    code, stdout, stderr = run_git(root, ["diff", "--name-only", base, "--"])
    if code != 0:
        return [], stderr.strip() or stdout.strip() or "git diff failed"
    return (
        sorted({as_posix(line.strip()) for line in stdout.splitlines() if line.strip()}),
        None,
    )


def is_post_merge_main(root: Path) -> bool:
    code, stdout, _stderr = run_git(root, ["branch", "--show-current"])
    if code != 0 or stdout.strip() not in {"main", "master"}:
        return False

    branch = stdout.strip()
    remote_ref = f"origin/{branch}"
    code, _stdout, _stderr = run_git(root, ["merge-base", "--is-ancestor", remote_ref, "HEAD"])
    return code == 0


def line_for_path(text: str, path: str) -> str | None:
    for line in text.splitlines():
        if path in line:
            return line
    return None


def is_out_of_scope_artifact(path: str) -> bool:
    return (
        path.startswith(".agents/skills/agent-")
        or path.startswith(".agents/skills/app-")
        or path.startswith(".agents/skills/agno-")
        or path.startswith(".agents/skills/architecture-planner/")
        or path.startswith(".agents/skills/aso-keyword-research/")
        or path.startswith(".agents/skills/google-play-listing/")
        or path.startswith(".agents/skills/harness-bootstrap/")
        or path.startswith(".agents/skills/launch-package/")
        or path.startswith(".agents/skills/mvp-scope/")
        or path.startswith(".agents/skills/privacy-disclosure-prep/")
        or path.startswith(".agents/skills/screenshot-storyboard/")
        or path == ".mcp.json"
        or path.startswith("AGNO_EXTENSION_MANIFEST.md")
        or path.startswith("README_AGNO_EXTENSION.md")
        or path.startswith("agno_app_factory/")
        or path.startswith("artifacts/")
        or path.startswith("codex_prompts/00_")
        or path.startswith("codex_prompts/01_")
        or path.startswith("codex_prompts/02_")
        or path.startswith("codex_prompts/03_")
        or path.startswith("codex_prompts/04_")
        or path.startswith("codex_prompts/05_")
        or path.startswith("codex_prompts/06_")
        or path.startswith("codex_prompts/07_")
        or path == "docs/agents/AGENT_IMPROVEMENT_LOG.md"
        or path == "docs/agents/AGENT_SCORECARD.md"
        or path == "docs/agents/APP_FACTORY_AGENT_TAXONOMY.md"
        or path.startswith("docs/agno/")
        or path == "docs/factory/APP_FACTORY_SHARED_ASSET_BOUNDARY.md"
        or path == "docs/factory/APP_FACTORY_AGENTS_AGNO_ROLLOUT_UPDATE.md"
        or path.startswith("docs/factory/codex_app_factory_harness_pack_v0_1/")
        or path.startswith("docs/factory/codex_app_factory_agno_extension_pack_v0_1/")
        or path.startswith("docs/factory/codex_app_factory_harness_agno_pack_v0_1/")
        or path in {
            "docs/harness/AGENT_LIFECYCLE.md",
            "docs/harness/CODEX_OPERATION_PROTOCOL.md",
            "docs/harness/FIRST_CODEX_LANDING_PACKET.md",
            "docs/harness/GOVERNANCE.md",
            "docs/harness/HARNESS_ASSET_MAP.md",
            "docs/harness/HARNESS_OPERATING_MANUAL.md",
            "docs/harness/SOURCES.md",
            "docs/privacy/DATA_INVENTORY_TEMPLATE.md",
            "docs/product/APP_SPEC_TEMPLATE.md",
            "docs/product/LAUNCH_INFO_TEMPLATE.md",
            "docs/release/PRELAUNCH_CHECKLIST.md",
        }
        or path.startswith("docs/launch/")
        or path in {"docs/architecture/.gitkeep", "docs/brand/.gitkeep", "docs/market/.gitkeep"}
        or path.startswith("evals/agents/")
        or path.startswith("evals/agno_workflows/")
        or path.startswith("requirements/agno")
        or path == "scripts/agent_tools/agno_smoke_run.py"
        or path == "scripts/agent_tools/build_launch_package.py"
        or path == "scripts/agent_tools/check_keyword_bytes.py"
        or path == "scripts/agent_tools/scan_privacy_usage.py"
        or path == "scripts/agent_tools/validate_agno_extension.py"
        or path == "scripts/agent_tools/validate_apple_metadata.py"
        or path == "scripts/agent_tools/validate_google_play_listing.py"
        or path == "scripts/agent_tools/validate_harness_assets.py"
        or path == "scripts/agent_tools/validate_screenshot_storyboard.py"
    )


def validate(root: Path) -> tuple[list[str], list[str], int, int]:
    errors: list[str] = []
    warnings: list[str] = []

    triage_path = root / TRIAGE_DOC
    scope_path = root / SCOPE_DOC
    pr_body_path = root / PR_BODY_DOC

    if not triage_path.is_file():
        errors.append(f"missing triage doc: {TRIAGE_DOC}")
        triage_text = ""
    else:
        triage_text = triage_path.read_text(encoding="utf-8")

    if not scope_path.is_file():
        errors.append(f"missing PR scope doc: {SCOPE_DOC}")
        scope_text = ""
    else:
        scope_text = scope_path.read_text(encoding="utf-8")

    if not pr_body_path.is_file():
        errors.append(f"missing PR body doc: {PR_BODY_DOC}")
        pr_body_text = ""
    else:
        pr_body_text = pr_body_path.read_text(encoding="utf-8")

    intended = intended_pr_files(scope_text)
    if not intended:
        errors.append("scope doc missing exact intended PR file block")

    for relative in intended:
        if not (root / relative).is_file():
            errors.append(f"missing intended Phase A Harvest file: {relative}")

    for relative in (
        TRIAGE_DOC,
        SCOPE_DOC,
        PR_BODY_DOC,
        "scripts/agent_tools/validate_phase_a_harvest_pr_scope.py",
    ):
        if intended and relative not in intended:
            errors.append(f"scope doc does not list required triage file: {relative}")

    for term in REQUIRED_SCOPE_TERMS:
        if scope_text and term not in scope_text:
            errors.append(f"scope doc missing term: {term}")

    for term in REQUIRED_TRIAGE_TERMS:
        if triage_text and term not in triage_text:
            errors.append(f"triage doc missing required term: {term}")

    for term in REQUIRED_PR_BODY_TERMS:
        if pr_body_text and term not in pr_body_text:
            errors.append(f"PR body doc missing term: {term}")

    untracked, untracked_error = untracked_artifact_paths(root)
    if untracked_error:
        errors.append(untracked_error)
    else:
        for path in untracked:
            line = line_for_path(triage_text, path)
            if line is None:
                errors.append(f"unclassified untracked artifact: {path}")
            elif not any(token in line for token in CLASSIFICATIONS):
                errors.append(f"untracked artifact lacks classification on its row: {path}")

    branch_paths, branch_error = branch_diff_paths(root)
    if branch_error:
        errors.append(branch_error)
    else:
        out_of_scope = [path for path in branch_paths if is_out_of_scope_artifact(path)]
        if out_of_scope:
            errors.append(
                "effective branch diff contains artifacts excluded from the narrow Phase A PR: "
                + ", ".join(out_of_scope[:30])
                + (" ..." if len(out_of_scope) > 30 else "")
            )
        unexpected = [
            path
            for path in branch_paths
            if intended and path not in intended and not is_out_of_scope_artifact(path)
        ]
        if unexpected:
            errors.append(
                "branch diff path is neither listed as intended nor classified as excluded: "
                + ", ".join(unexpected[:30])
                + (" ..." if len(unexpected) > 30 else "")
            )
        post_merge_main = is_post_merge_main(root)
        missing_from_diff = [
            path
            for path in intended
            if path not in branch_paths and not post_merge_main
        ]
        if missing_from_diff:
            errors.append(
                "scope doc lists files not present in the effective branch diff: "
                + ", ".join(missing_from_diff[:30])
                + (" ..." if len(missing_from_diff) > 30 else "")
            )

    gitignore_path = root / ".gitignore"
    if gitignore_path.is_file():
        gitignore_text = gitignore_path.read_text(encoding="utf-8")
        for pattern in ("tmp/", "__pycache__/", "*.pyc"):
            if pattern not in gitignore_text.splitlines():
                errors.append(f".gitignore missing generated/local ignore: {pattern}")

    code, stdout, stderr = run_git(root, ["ls-files", "--", "*__pycache__*", "*.pyc"])
    if code != 0:
        errors.append(stderr.strip() or stdout.strip() or "git ls-files pycache check failed")
    else:
        tracked_pycache = [as_posix(line.strip()) for line in stdout.splitlines() if line.strip()]
        if tracked_pycache:
            errors.append("tracked Python cache files should not be harvested: " + ", ".join(tracked_pycache))

    return errors, warnings, len(intended), len(untracked)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate Phase A Harvest PR scope and artifact triage."
    )
    parser.add_argument("root", nargs="?", default=".", help="Repository root")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    errors, warnings, intended_count, untracked_count = validate(root)

    print("PHASE_A_HARVEST_PR_SCOPE_VALIDATION")
    print(f"root={root}")
    print(f"checked_intended_files={intended_count}")
    print(f"untracked_artifact_candidates={untracked_count}")

    if warnings:
        print("warnings:")
        for warning in warnings:
            print(f"- {warning}")

    if errors:
        print("PHASE_A_HARVEST_PR_SCOPE_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PHASE_A_HARVEST_PR_SCOPE_VALIDATION_PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
