#!/usr/bin/env python3
"""Validate Mobile Runtime Foundation PR readiness without credentials."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


REQUIRED_FILES = [
    "docs/release/MOBILE_RUNTIME_FOUNDATION_PR_READINESS.md",
    "docs/architecture/SUPABASE_DRAFT_REVIEW_HANDOFF.md",
    "docs/mobile/NO_CREDENTIAL_RUNTIME_SMOKE_MATRIX.md",
    "docs/mobile/MOBILE_RUNTIME_SHELL.md",
    "docs/mobile/MOBILE_DEPENDENCY_WORKFLOW.md",
    "docs/mobile/SUPABASE_ENV_CONTRACT.md",
    "docs/architecture/RUNTIME_BOUNDARY.md",
    "docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md",
    "docs/architecture/SUPABASE_SCHEMA_CONTRACT.md",
    "docs/architecture/SUPABASE_RLS_CONTRACT.md",
    "docs/harness/COMMAND_SAFETY_MATRIX.md",
    "docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md",
    "docs/NEED_HUMAN.md",
    "infra/supabase/drafts/runtime-schema-draft.sql",
    "infra/supabase/drafts/runtime-rls-draft.sql",
    "scripts/agent_tools/validate_mobile_runtime_shell.py",
    "scripts/agent_tools/validate_mobile_dependency_workflow.py",
    "scripts/agent_tools/validate_runtime_data_port.py",
    "scripts/agent_tools/validate_supabase_runtime_contract.py",
    "package.json",
    "apps/mobile/package.json",
]

REQUIRED_DOC_TEXT = {
    "docs/release/MOBILE_RUNTIME_FOUNDATION_PR_READINESS.md": [
        "scope summary",
        "changed subsystems",
        "validation matrix",
        "merge risks",
        "rollback notes",
        "reviewer checklist",
        "explicit non-goals",
        "validate_mobile_runtime_foundation_pr.py",
        "validate_mobile_runtime_shell.py",
        "validate_mobile_dependency_workflow.py",
        "validate_runtime_data_port.py",
        "validate_supabase_runtime_contract.py",
        "npm.cmd --prefix apps/mobile run typecheck",
        "npm.cmd --prefix apps/mobile run smoke:fixture",
        "npm.cmd --prefix apps/mobile run start:smoke",
        "npm.cmd run validate:test-inputs",
        "npm.cmd run validate:preflight",
        "git diff --check",
        "git status --short",
        "generated outputs are restored",
        "No real Supabase",
    ],
    "docs/architecture/SUPABASE_DRAFT_REVIEW_HANDOFF.md": [
        "draft-only",
        "Must Not Be Applied Yet",
        "Open Human Decisions",
        "Schema Review Checklist",
        "RLS Review Checklist",
        "Future Migration Review Thread Scope",
        "infra/supabase/drafts/runtime-schema-draft.sql",
        "infra/supabase/drafts/runtime-rls-draft.sql",
        "infra/supabase/migrations",
        "auth.uid()",
        "product_key",
        "NEED_HUMAN",
    ],
    "docs/mobile/NO_CREDENTIAL_RUNTIME_SMOKE_MATRIX.md": [
        "Fixture Mode",
        "Supabase Missing-Env Mode",
        "typecheck",
        "smoke:fixture",
        "start:smoke",
        "Generated-Output Restore Rules",
        "EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase",
        "EXPO_PUBLIC_SUPABASE_URL",
        "missing_env",
        "git restore -- output/test-input-pack/reports/validation-report.json",
    ],
    "docs/runtime/GENERATED_OUTPUT_MUTATION_PROFILE.md": [
        "validate:test-inputs",
        "output/test-input-pack/reports/validation-report.json",
        "git restore -- output/test-input-pack/reports/validation-report.json",
    ],
    "docs/harness/COMMAND_SAFETY_MATRIX.md": [
        "validate:test-inputs",
        "validate:preflight",
        "generated-output-mutating",
        "credential-required",
    ],
}

REQUIRED_MOBILE_SCRIPTS = {
    "typecheck": "tsc --noEmit",
    "smoke:fixture": "smoke-fixture-reader.mjs",
    "start:smoke": "expo-start-smoke.mjs",
}

REQUIRED_ROOT_SCRIPTS = {
    "validate:test-inputs": "validate-synthetic-test-pack.ps1",
    "validate:preflight": "scripts/validate/preflight.ps1",
}

APPLIED_MIGRATION_DIRS = [
    "infra/supabase/migrations",
    "infra/supabase/applied",
    "supabase/migrations",
]

SECRET_PATTERNS = [
    re.compile(r"sbp_[A-Za-z0-9_-]{20,}"),
    re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}", re.IGNORECASE),
    re.compile(r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"),
    re.compile(r"https://[a-z0-9]{20}\.supabase\.co", re.IGNORECASE),
    re.compile(r"SUPABASE_SERVICE_ROLE\s*=\s*['\"]?[^'\"\s]+", re.IGNORECASE),
    re.compile(r"REVENUECAT_[A-Z0-9_]*KEY\s*=\s*['\"]?[^'\"\s]+", re.IGNORECASE),
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_json(path: Path) -> dict:
    return json.loads(read_text(path))


def require_text(relative: str, text: str, snippets: list[str], errors: list[str]) -> None:
    lowered = text.lower()
    for snippet in snippets:
        if snippet.lower() not in lowered:
            errors.append(f"{relative} missing required text: {snippet}")


def git_tracked_files(root: Path) -> list[str]:
    try:
        result = subprocess.run(
            ["git", "ls-files"],
            cwd=root,
            check=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
        )
    except (OSError, subprocess.CalledProcessError):
        return []
    return [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]


def is_env_file(relative: str) -> bool:
    name = Path(relative).name
    return name == ".env" or name.startswith(".env.") or name.endswith(".env") or name.endswith(".env.example")


def validate_required_files(root: Path, errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        if not (root / relative).exists():
            errors.append(f"Missing required file: {relative}")


def validate_docs(root: Path, errors: list[str]) -> None:
    for relative, snippets in REQUIRED_DOC_TEXT.items():
        path = root / relative
        if path.exists():
            require_text(relative, read_text(path), snippets, errors)


def validate_scripts(root: Path, errors: list[str]) -> None:
    root_package_path = root / "package.json"
    mobile_package_path = root / "apps/mobile/package.json"
    if not root_package_path.exists() or not mobile_package_path.exists():
        return

    root_scripts = read_json(root_package_path).get("scripts") or {}
    mobile_scripts = read_json(mobile_package_path).get("scripts") or {}

    for name, expected in REQUIRED_ROOT_SCRIPTS.items():
        value = str(root_scripts.get(name) or "")
        if expected not in value:
            errors.append(f"package.json script {name} must reference {expected}")

    for name, expected in REQUIRED_MOBILE_SCRIPTS.items():
        value = str(mobile_scripts.get(name) or "")
        if expected not in value:
            errors.append(f"apps/mobile/package.json script {name} must reference {expected}")


def validate_no_applied_migrations(root: Path, errors: list[str]) -> None:
    for relative in APPLIED_MIGRATION_DIRS:
        path = root / relative
        if not path.exists():
            continue
        sql_files = sorted(child for child in path.rglob("*.sql") if child.is_file())
        for sql_file in sql_files:
            errors.append(f"Applied migration SQL is not allowed in this PR gate: {sql_file.relative_to(root)}")


def validate_no_env_secrets(root: Path, errors: list[str]) -> None:
    tracked = git_tracked_files(root)
    tracked_envs = [relative for relative in tracked if is_env_file(relative)]
    for relative in tracked_envs:
        path = root / relative
        if not path.exists():
            continue
        if not relative.endswith(".env.example") and Path(relative).name != ".env.example":
            errors.append(f"Tracked non-example env file is not allowed: {relative}")
        text = read_text(path)
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"Potential committed secret in env file: {relative}")


def validate_no_live_supabase(root: Path, errors: list[str]) -> None:
    scanned_files = [
        "apps/mobile/package.json",
        "packages/core-runtime/package.json",
        "packages/core-runtime/src/seams/supabase-seam.ts",
        "apps/mobile/src/runtime/runtime-data-source.ts",
    ]
    forbidden = ["@supabase/supabase-js", "createClient(", "supabase.from(", "service_role"]
    for relative in scanned_files:
        path = root / relative
        if not path.exists():
            continue
        text = read_text(path)
        lowered = text.lower()
        for snippet in forbidden:
            if snippet.lower() in lowered:
                errors.append(f"Forbidden live Supabase snippet '{snippet}' found in {relative}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    validate_required_files(root, errors)
    validate_docs(root, errors)
    validate_scripts(root, errors)
    validate_no_applied_migrations(root, errors)
    validate_no_env_secrets(root, errors)
    validate_no_live_supabase(root, errors)

    if errors:
        print("MOBILE_RUNTIME_FOUNDATION_PR_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("MOBILE_RUNTIME_FOUNDATION_PR_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print(f"checked_existing_validators=4")
    print(f"checked_applied_migration_dirs={len(APPLIED_MIGRATION_DIRS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
