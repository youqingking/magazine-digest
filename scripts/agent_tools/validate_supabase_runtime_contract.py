#!/usr/bin/env python3
"""Validate Supabase runtime contract drafts without connecting to Supabase."""

from __future__ import annotations

import re
import sys
from pathlib import Path


REQUIRED_FILES = [
    "docs/architecture/SUPABASE_SCHEMA_CONTRACT.md",
    "docs/architecture/SUPABASE_RLS_CONTRACT.md",
    "docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md",
    "docs/mobile/SUPABASE_ADAPTER_IMPLEMENTATION_PLAN.md",
    "docs/mobile/SUPABASE_ENV_CONTRACT.md",
    "docs/NEED_HUMAN.md",
    "infra/supabase/drafts/runtime-schema-draft.sql",
    "infra/supabase/drafts/runtime-rls-draft.sql",
]

REQUIRED_TABLES = [
    "products",
    "publications",
    "articles",
    "article_variants",
    "content_change_log",
    "user_content_state",
    "user_follows",
    "notification_inbox",
    "entitlement_snapshot",
    "runtime_sync_cursors",
]

REQUIRED_DOC_TERMS = [
    "product_key",
    "RLS",
    "user_id",
    "fail closed",
    "fail-closed",
    "service-role-only",
    "RuntimeContentRepository",
    "RuntimeScenarioRepository",
    "RuntimeEntitlementRepository",
    "RuntimeNotificationRepository",
    "fixture mode remains the default",
    "No real credentials",
]

REQUIRED_SQL_TERMS = [
    "enable row level security",
    "auth.uid()",
    "product_key",
    "user_id",
    "create policy",
    "Draft only",
]

SECRET_PATTERNS = [
    re.compile(r"sbp_[A-Za-z0-9_-]{20,}"),
    re.compile(r"sb_secret_[A-Za-z0-9_-]{20,}", re.IGNORECASE),
    re.compile(r"eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}"),
    re.compile(r"https://[a-z0-9]{20}\.supabase\.co", re.IGNORECASE),
    re.compile(r"SUPABASE_SERVICE_ROLE\s*=\s*['\"][^'\"]+['\"]"),
    re.compile(r"EXPO_PUBLIC_SUPABASE_ANON_KEY\s*=\s*['\"]eyJ[^'\"]+['\"]"),
]

SECRET_SCAN_SUFFIXES = {".md", ".sql", ".ts", ".tsx", ".js", ".json", ".example", ".env"}
SECRET_SCAN_DIRS = [
    "docs/architecture",
    "docs/mobile",
    "docs/runtime",
    "infra/supabase",
    "packages/core-runtime",
    "apps/mobile",
    "scripts/agent_tools",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require_text(relative: str, text: str, snippets: list[str], errors: list[str]) -> None:
    lowered = text.lower()
    for snippet in snippets:
        if snippet.lower() not in lowered:
            errors.append(f"{relative} missing required text: {snippet}")


def validate_schema_doc(root: Path, errors: list[str]) -> None:
    relative = "docs/architecture/SUPABASE_SCHEMA_CONTRACT.md"
    text = read_text(root / relative)
    require_text(relative, text, REQUIRED_DOC_TERMS, errors)
    for table in REQUIRED_TABLES:
        require_text(relative, text, [table], errors)


def validate_rls_doc(root: Path, errors: list[str]) -> None:
    relative = "docs/architecture/SUPABASE_RLS_CONTRACT.md"
    text = read_text(root / relative)
    require_text(
        relative,
        text,
        [
            "public",
            "published",
            "authenticated",
            "private",
            "product_key",
            "user_id",
            "auth.uid()",
            "service-role-only",
            "forbidden client writes",
            "fail closed",
        ],
        errors,
    )


def validate_adapter_plan(root: Path, errors: list[str]) -> None:
    relative = "docs/mobile/SUPABASE_ADAPTER_IMPLEMENTATION_PLAN.md"
    text = read_text(root / relative)
    require_text(
        relative,
        text,
        [
            "RuntimeContentRepository",
            "RuntimeScenarioRepository",
            "RuntimeEntitlementRepository",
            "RuntimeNotificationRepository",
            "fixture mode remains the default",
            "Supabase JavaScript SDK",
            "fail closed",
            "product_key",
            "user_id",
        ],
        errors,
    )


def validate_sql(root: Path, errors: list[str]) -> None:
    schema_relative = "infra/supabase/drafts/runtime-schema-draft.sql"
    rls_relative = "infra/supabase/drafts/runtime-rls-draft.sql"
    schema_text = read_text(root / schema_relative)
    rls_text = read_text(root / rls_relative)

    require_text(schema_relative, schema_text, ["Draft only", "create schema if not exists runtime"], errors)
    require_text(rls_relative, rls_text, REQUIRED_SQL_TERMS, errors)

    for table in REQUIRED_TABLES:
        require_text(schema_relative, schema_text, [f"runtime.{table}", "product_key"], errors)
        require_text(rls_relative, rls_text, [f"runtime.{table}"], errors)

    for user_table in [
        "user_content_state",
        "user_follows",
        "notification_inbox",
        "entitlement_snapshot",
        "runtime_sync_cursors",
    ]:
        table_block_pattern = re.compile(
            rf"create table if not exists runtime\.{re.escape(user_table)}\s*\((.*?)\);",
            re.IGNORECASE | re.DOTALL,
        )
        match = table_block_pattern.search(schema_text)
        if not match:
            errors.append(f"{schema_relative} missing table block for {user_table}")
            continue
        block = match.group(1).lower()
        if "product_key" not in block:
            errors.append(f"{schema_relative} table {user_table} missing product_key")
        if "user_id" not in block:
            errors.append(f"{schema_relative} table {user_table} missing user_id")


def validate_need_human(root: Path, errors: list[str]) -> None:
    relative = "docs/NEED_HUMAN.md"
    text = read_text(root / relative)
    require_text(relative, text, ["Supabase", "project", "secret"], errors)


def validate_no_dependency_change(root: Path, errors: list[str]) -> None:
    for relative in ["apps/mobile/package.json", "packages/core-runtime/package.json"]:
        path = root / relative
        if path.exists() and "@supabase/supabase-js" in read_text(path):
            errors.append(f"{relative} must not add @supabase/supabase-js for this no-credential draft")


def validate_no_secrets(root: Path, errors: list[str]) -> None:
    for base_relative in SECRET_SCAN_DIRS:
        base = root / base_relative
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.suffix.lower() not in SECRET_SCAN_SUFFIXES:
                continue
            text = read_text(path)
            for pattern in SECRET_PATTERNS:
                if pattern.search(text):
                    errors.append(f"Potential committed Supabase secret in {path.relative_to(root)}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if not (root / relative).exists():
            errors.append(f"Missing required file: {relative}")

    if not errors:
        validate_schema_doc(root, errors)
        validate_rls_doc(root, errors)
        validate_adapter_plan(root, errors)
        validate_sql(root, errors)
        validate_need_human(root, errors)
        validate_no_dependency_change(root, errors)
        validate_no_secrets(root, errors)

    if errors:
        print("SUPABASE_RUNTIME_CONTRACT_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("SUPABASE_RUNTIME_CONTRACT_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    print(f"checked_tables={len(REQUIRED_TABLES)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
