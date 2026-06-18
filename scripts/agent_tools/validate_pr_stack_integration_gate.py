#!/usr/bin/env python3
"""Validate stacked PR integration gate docs without credentials."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


REQUIRED_FILES = [
    "docs/release/STACKED_PR_INTEGRATION_GATE.md",
    "docs/release/MOBILE_RUNTIME_FOUNDATION_MERGE_DECISION.md",
    "docs/release/SUPABASE_REVIEW_DEPENDENT_PR_PLAN.md",
    "docs/release/MOBILE_RUNTIME_FOUNDATION_PR_READINESS.md",
    "docs/architecture/SUPABASE_DRAFT_REVIEW_HANDOFF.md",
    "docs/NEED_HUMAN.md",
    "package.json",
    "package-lock.json",
    "apps/mobile/package.json",
]

REQUIRED_GATE_TERMS = {
    "docs/release/STACKED_PR_INTEGRATION_GATE.md": [
        "codex/expo-shell-foundation",
        "5547897",
        "codex/supabase-migration-review",
        "codex/pr-stack-integration-gate-rerun",
        "branch relationship",
        "recommended pr order",
        "supabase review target",
        "validation summary",
        "npm.cmd ci",
        "validate_pr_stack_integration_gate.py",
        "generated outputs touched and restored",
        "merge risks",
        "rollback plan",
        "reviewer checklist",
        "explicit non-goals",
        "product_key",
        "premium body exposure",
        "notification read/archive",
        "public-safe change-log",
        "local RLS harness",
        "RevenueCat",
        "push",
        "applied migration",
    ],
    "docs/release/MOBILE_RUNTIME_FOUNDATION_MERGE_DECISION.md": [
        "Recommendation: MERGE",
        "5547897",
        "validation evidence",
        "required human checks",
        "package-lock / expo canary risk",
        "generated-output hygiene",
        "no-credential proof status",
        "hold conditions",
        "split conditions",
        "no applied",
        "Supabase",
    ],
    "docs/release/SUPABASE_REVIEW_DEPENDENT_PR_PLAN.md": [
        "should still target",
        "codex/expo-shell-foundation",
        "until the foundation merges",
        "e286135",
        "406ccf0",
        "reviewed-candidates",
        "validate_supabase_migration_review.py",
        "what must wait for human approval",
        "open decisions",
        "product_key",
        "premium body exposure",
        "notification read/archive mutation",
        "public-safe change-log payload",
        "local RLS harness ownership",
        "service-role-only",
    ],
}

APPLIED_MIGRATION_DIRS = [
    "infra/supabase/migrations",
    "infra/supabase/applied",
    "supabase/migrations",
]

SECRET_PATTERNS = [
    re.compile(r"sbp_[A-Za-z0-9_-]{20,}"),
    re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}", re.IGNORECASE),
    re.compile(r"https://[a-z0-9]{20}\.supabase\.co", re.IGNORECASE),
    re.compile(r"SUPABASE_SERVICE_ROLE\s*=\s*['\"]?[^'\"\s]+", re.IGNORECASE),
    re.compile(r"EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*['\"]eyJ[^'\"\s]+['\"]", re.IGNORECASE),
    re.compile(r"REVENUECAT_[A-Z0-9_]*KEY\s*=\s*['\"]?[^'\"\s]+", re.IGNORECASE),
    re.compile(r"(FCM|APNS|PUSH)_[A-Z0-9_]*SECRET\s*=\s*['\"]?[^'\"\s]+", re.IGNORECASE),
]

SECRET_SCAN_SUFFIXES = {".env", ".example", ".md", ".sql", ".json", ".ts", ".tsx", ".js", ".mjs"}
SECRET_SCAN_DIRS = [
    "apps/mobile",
    "docs",
    "infra/supabase",
    "packages/core-runtime",
    "scripts/agent_tools",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require_terms(relative: str, text: str, terms: list[str], errors: list[str]) -> None:
    lowered = text.lower()
    for term in terms:
        if term.lower() not in lowered:
            errors.append(f"{relative} missing required mention: {term}")


def git_ls_files(root: Path) -> list[str]:
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


def is_env_like(relative: str) -> bool:
    name = Path(relative).name.lower()
    return name == ".env" or name.startswith(".env.") or name.endswith(".env") or name.endswith(".env.example")


def validate_required_files(root: Path, errors: list[str]) -> None:
    for relative in REQUIRED_FILES:
        if not (root / relative).is_file():
            errors.append(f"Missing required file: {relative}")


def validate_required_terms(root: Path, errors: list[str]) -> None:
    for relative, terms in REQUIRED_GATE_TERMS.items():
        path = root / relative
        if path.is_file():
            require_terms(relative, read_text(path), terms, errors)


def validate_merge_recommendation(root: Path, errors: list[str]) -> None:
    path = root / "docs/release/MOBILE_RUNTIME_FOUNDATION_MERGE_DECISION.md"
    if not path.is_file():
        return
    text = read_text(path)
    if not re.search(r"Recommendation:\s+MERGE\b", text):
        errors.append("Merge decision must contain `Recommendation: MERGE`")


def validate_no_tracked_env_secrets(root: Path, errors: list[str]) -> None:
    for relative in git_ls_files(root):
        if not is_env_like(relative):
            continue
        path = root / relative
        if not path.is_file():
            continue
        if not relative.endswith(".env.example") and Path(relative).name != ".env.example":
            errors.append(f"Tracked non-example env file is not allowed: {relative}")
        text = read_text(path)
        for pattern in SECRET_PATTERNS:
            if pattern.search(text):
                errors.append(f"Potential committed secret in tracked env file: {relative}")


def validate_no_secret_patterns(root: Path, errors: list[str]) -> None:
    for base_relative in SECRET_SCAN_DIRS:
        base = root / base_relative
        if not base.exists():
            continue
        for path in base.rglob("*"):
            relative = str(path.relative_to(root)).replace("\\", "/")
            if not path.is_file():
                continue
            if path.suffix.lower() not in SECRET_SCAN_SUFFIXES and not is_env_like(relative):
                continue
            if ".git" in path.parts or "node_modules" in path.parts:
                continue
            text = read_text(path)
            for pattern in SECRET_PATTERNS:
                if pattern.search(text):
                    errors.append(f"Potential committed secret in {path.relative_to(root)}")


def validate_no_applied_migrations(root: Path, errors: list[str]) -> None:
    for relative in APPLIED_MIGRATION_DIRS:
        path = root / relative
        if not path.exists():
            continue
        for child in sorted(path.rglob("*")):
            if not child.is_file():
                continue
            rendered = str(child.relative_to(root)).replace("\\", "/")
            if child.suffix.lower() == ".sql":
                errors.append(f"Applied Supabase migration SQL is forbidden in this gate: {rendered}")
                continue
            text = read_text(child) if child.suffix.lower() in SECRET_SCAN_SUFFIXES else ""
            lowered = f"{rendered}\n{text}".lower()
            if "reviewed-candidates" in lowered or "candidate only" in lowered or "not production-ready" in lowered:
                errors.append(f"Reviewed candidate artifact appears in applied migration path: {rendered}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    validate_required_files(root, errors)
    validate_required_terms(root, errors)
    validate_merge_recommendation(root, errors)
    validate_no_tracked_env_secrets(root, errors)
    validate_no_secret_patterns(root, errors)
    validate_no_applied_migrations(root, errors)

    if errors:
        print("PR_STACK_INTEGRATION_GATE_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("PR_STACK_INTEGRATION_GATE_VALIDATION_PASSED")
    print(f"checked_required_files={len(REQUIRED_FILES)}")
    print(f"checked_gate_docs={len(REQUIRED_GATE_TERMS)}")
    print(f"checked_applied_migration_dirs={len(APPLIED_MIGRATION_DIRS)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
