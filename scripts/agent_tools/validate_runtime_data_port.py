#!/usr/bin/env python3
"""Validate the no-credential runtime data port and Supabase seam contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path


REQUIRED_FILES = [
    "packages/core-runtime/src/runtime-data-port.ts",
    "packages/core-runtime/src/adapters/runtime-fixture-adapter.ts",
    "packages/core-runtime/src/seams/supabase-seam.ts",
    "apps/mobile/src/runtime/runtime-data-source.ts",
    "apps/mobile/.env.example",
    "docs/mobile/SUPABASE_ENV_CONTRACT.md",
    "docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md",
]

REQUIRED_PORT_TEXT = [
    "RuntimeContentRepository",
    "RuntimeScenarioRepository",
    "RuntimeEntitlementRepository",
    "RuntimeNotificationRepository",
    "productKey",
    "product_key",
    "unavailable",
]

REQUIRED_FIXTURE_ADAPTER_TEXT = [
    "createRuntimeFixtureRepository",
    "RuntimeContentRepository",
    "RuntimeScenarioRepository",
    "RuntimeEntitlementRepository",
    "RuntimeNotificationRepository",
    "buildRuntimeShellState",
    "fixture",
]

REQUIRED_SUPABASE_TEXT = [
    "createSupabaseRuntimeRepository",
    "RuntimeContentRepository",
    "RuntimeScenarioRepository",
    "RuntimeEntitlementRepository",
    "RuntimeNotificationRepository",
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_PRODUCT_KEY",
    "unavailable",
    "connects: false",
]

REQUIRED_SOURCE_TEXT = [
    "EXPO_PUBLIC_RUNTIME_DATA_SOURCE",
    "fixture",
    "supabase",
    "createRuntimeFixtureRepository",
    "createSupabaseRuntimeRepository",
]

REQUIRED_ENV_TEXT = [
    "EXPO_PUBLIC_RUNTIME_DATA_SOURCE=fixture",
    "EXPO_PUBLIC_RUNTIME_SCENARIO_ID=current",
    "EXPO_PUBLIC_SUPABASE_URL",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY",
    "EXPO_PUBLIC_PRODUCT_KEY",
]

REQUIRED_DOC_TEXT = {
    "docs/mobile/SUPABASE_ENV_CONTRACT.md": [
        "EXPO_PUBLIC_RUNTIME_DATA_SOURCE=fixture",
        "EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase",
        "EXPO_PUBLIC_SUPABASE_URL",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY",
        "EXPO_PUBLIC_PRODUCT_KEY",
        "fails closed",
        "product_key",
        "No real credentials",
    ],
    "docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md": [
        "RuntimeContentRepository",
        "RuntimeScenarioRepository",
        "RuntimeEntitlementRepository",
        "RuntimeNotificationRepository",
        "product_key",
        "schema",
        "RLS",
        "No real credentials",
    ],
}

FORBIDDEN_SNIPPETS = [
    "createClient(",
    "supabase.from(",
    "supabase.auth.",
    "service_role",
    "SUPABASE_SERVICE_ROLE",
]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def require_snippets(relative: str, text: str, snippets: list[str], errors: list[str]) -> None:
    for snippet in snippets:
        if snippet not in text:
            errors.append(f"{relative} missing required text: {snippet}")


def validate_package_exports(root: Path, errors: list[str]) -> None:
    package_path = root / "packages/core-runtime/package.json"
    if not package_path.exists():
        errors.append("Missing packages/core-runtime/package.json")
        return
    package = json.loads(read_text(package_path))
    exports = package.get("exports") or {}
    for export_name in [
        "./runtime-data-port",
        "./adapters/runtime-fixture-adapter",
        "./seams/supabase-seam",
    ]:
        if export_name not in exports:
            errors.append(f"packages/core-runtime/package.json missing export: {export_name}")


def validate_mobile_package(root: Path, errors: list[str]) -> None:
    package_path = root / "apps/mobile/package.json"
    if not package_path.exists():
        errors.append("Missing apps/mobile/package.json")
        return
    package_text = read_text(package_path)
    if "@supabase/supabase-js" in package_text:
        errors.append("apps/mobile/package.json must not add Supabase SDK for the no-credential seam")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        if not (root / relative).exists():
            errors.append(f"Missing required file: {relative}")

    file_checks = {
        "packages/core-runtime/src/runtime-data-port.ts": REQUIRED_PORT_TEXT,
        "packages/core-runtime/src/adapters/runtime-fixture-adapter.ts": REQUIRED_FIXTURE_ADAPTER_TEXT,
        "packages/core-runtime/src/seams/supabase-seam.ts": REQUIRED_SUPABASE_TEXT,
        "apps/mobile/src/runtime/runtime-data-source.ts": REQUIRED_SOURCE_TEXT,
        "apps/mobile/.env.example": REQUIRED_ENV_TEXT,
    }

    for relative, snippets in file_checks.items():
        path = root / relative
        if path.exists():
            require_snippets(relative, read_text(path), snippets, errors)

    for relative, snippets in REQUIRED_DOC_TEXT.items():
        path = root / relative
        if path.exists():
            require_snippets(relative, read_text(path), snippets, errors)

    for base_relative in ["apps/mobile", "packages/core-runtime"]:
        base = root / base_relative
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix.lower() not in {".ts", ".tsx", ".js", ".json", ".md", ".example"}:
                continue
            text = read_text(path)
            for snippet in FORBIDDEN_SNIPPETS:
                if snippet in text:
                    errors.append(f"Forbidden snippet '{snippet}' found in {path.relative_to(root)}")

    validate_package_exports(root, errors)
    validate_mobile_package(root, errors)

    if errors:
        print("RUNTIME_DATA_PORT_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("RUNTIME_DATA_PORT_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
