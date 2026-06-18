#!/usr/bin/env python3
"""Validate the no-credential Expo mobile runtime shell foundation."""

from __future__ import annotations

import json
import sys
from pathlib import Path


REQUIRED_FILES = [
    "apps/mobile/app/_layout.tsx",
    "apps/mobile/app/index.tsx",
    "apps/mobile/app/article/[articleId].tsx",
    "apps/mobile/app/debug.tsx",
    "apps/mobile/src/runtime/runtime-fixture-source.ts",
    "apps/mobile/src/runtime/use-runtime-fixture.ts",
    "packages/core-runtime/src/runtime-fixture-reader.ts",
    "packages/core-runtime/src/seams/supabase-seam.ts",
    "packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts",
    "packages/core-runtime/src/seams/notification-seam.ts",
    "docs/mobile/MOBILE_RUNTIME_SHELL.md",
    "docs/mobile/RUNTIME_FIXTURE_READER.md",
]

FORBIDDEN_SNIPPETS = [
    "createClient(",
    "@supabase/",
    "Purchases.configure",
    "react-native-purchases",
    "Notifications.getExpoPushTokenAsync",
    "expo-notifications",
    "pdf-parse",
    "playwright",
    "cheerio",
    "openai",
    "markdown generation",
    "prompt generation",
]

REQUIRED_TEXT = {
    "apps/mobile/app/index.tsx": ["product_key", "scenario", "Discovery"],
    "apps/mobile/app/article/[articleId].tsx": ["product_key", "markdown_body", "unavailable"],
    "apps/mobile/app/debug.tsx": ["Supabase", "RevenueCat", "notification", "selected scenario"],
    "packages/core-runtime/src/runtime-fixture-reader.ts": [
        "product_key",
        "contentDetail",
        "discoveryCatalog",
        "missing",
        "empty",
    ],
    "docs/mobile/MOBILE_RUNTIME_SHELL.md": [
        "Expo Router",
        "product_key",
        "Supabase seam",
        "RevenueCat",
        "notification",
        "not implement",
    ],
    "docs/mobile/RUNTIME_FIXTURE_READER.md": [
        "mobile/fixtures/runtime/current/runtime.bundle.json",
        "s01_normal_full_matrix",
        "generated",
        "fallback",
    ],
}


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def validate_runtime_fixture(root: Path, errors: list[str]) -> None:
    current_bundle = root / "mobile/fixtures/runtime/current/runtime.bundle.json"
    scenario_bundle = root / "mobile/fixtures/runtime/scenarios/s01_normal_full_matrix.bundle.json"

    for bundle_path in [current_bundle, scenario_bundle]:
        if not bundle_path.exists():
            errors.append(f"Missing fixture bundle: {bundle_path.relative_to(root)}")
            continue
        bundle = json.loads(read_text(bundle_path))
        metadata = bundle.get("metadata") or {}
        if not metadata.get("product_key"):
            errors.append(f"Fixture lacks metadata.product_key: {bundle_path.relative_to(root)}")
        if not metadata.get("scenario_id"):
            errors.append(f"Fixture lacks metadata.scenario_id: {bundle_path.relative_to(root)}")
        if "contentDetail" not in bundle:
            errors.append(f"Fixture lacks contentDetail: {bundle_path.relative_to(root)}")
        if "discoveryCatalog" not in bundle and "contentSyncDelta" not in bundle:
            errors.append(f"Fixture lacks discovery/sync data: {bundle_path.relative_to(root)}")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        path = root / relative
        if not path.exists():
            errors.append(f"Missing required file: {relative}")

    for relative, snippets in REQUIRED_TEXT.items():
        path = root / relative
        if not path.exists():
            continue
        text = read_text(path)
        for snippet in snippets:
            if snippet not in text:
                errors.append(f"{relative} missing required text: {snippet}")

    shell_paths = [
        root / "apps/mobile",
        root / "packages/core-runtime",
        root / "docs/mobile",
    ]
    for base in shell_paths:
        if not base.exists():
            continue
        for path in base.rglob("*"):
            if path.suffix.lower() not in {".ts", ".tsx", ".js", ".json", ".md"}:
                continue
            text = read_text(path)
            lowered = text.lower()
            for snippet in FORBIDDEN_SNIPPETS:
                if snippet.lower() in lowered:
                    errors.append(f"Forbidden snippet '{snippet}' found in {path.relative_to(root)}")

    validate_runtime_fixture(root, errors)

    if errors:
        print("MOBILE_RUNTIME_SHELL_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("MOBILE_RUNTIME_SHELL_VALIDATION_PASSED")
    print(f"checked_files={len(REQUIRED_FILES)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
