#!/usr/bin/env python3
"""Validate the Expo mobile dependency workflow contract."""

from __future__ import annotations

import json
import sys
from pathlib import Path


REQUIRED_FILES = [
    "package.json",
    "package-lock.json",
    "apps/mobile/package.json",
    "apps/mobile/tsconfig.json",
    "docs/mobile/MOBILE_DEPENDENCY_WORKFLOW.md",
    "scripts/mobile/smoke-fixture-reader.mjs",
    "scripts/mobile/expo-start-smoke.mjs",
]

WORKFLOW_DOC_REQUIRED_TEXT = [
    "npm",
    "npm.cmd install",
    "--include-workspace-root",
    "--legacy-peer-deps",
    "package-lock.json",
    "apps/mobile/package.json",
    "node_modules",
    "no-credential",
    "typecheck",
    "smoke:fixture",
    "start:smoke",
]

MOBILE_REQUIRED_DEPENDENCIES = [
    "expo",
    "expo-router",
    "react",
    "react-dom",
    "react-native",
    "react-native-safe-area-context",
    "react-native-screens",
]


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def script_value(package_json: dict, name: str) -> str:
    return str((package_json.get("scripts") or {}).get(name) or "")


def main() -> int:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    errors: list[str] = []

    for relative in REQUIRED_FILES:
      if not (root / relative).exists():
          errors.append(f"Missing required file: {relative}")

    root_package_path = root / "package.json"
    mobile_package_path = root / "apps/mobile/package.json"
    lockfile_path = root / "package-lock.json"
    workflow_doc_path = root / "docs/mobile/MOBILE_DEPENDENCY_WORKFLOW.md"

    root_package = read_json(root_package_path) if root_package_path.exists() else {}
    mobile_package = read_json(mobile_package_path) if mobile_package_path.exists() else {}
    lockfile = read_json(lockfile_path) if lockfile_path.exists() else {}

    workspaces = root_package.get("workspaces") or []
    for expected in ["apps/*", "packages/*"]:
        if expected not in workspaces:
            errors.append(f"Root package.json workspaces missing {expected}")

    mobile_scripts = mobile_package.get("scripts") or {}
    if not script_value(mobile_package, "typecheck"):
        errors.append("apps/mobile/package.json missing typecheck script")
    if not (script_value(mobile_package, "start") or script_value(mobile_package, "start:expo")):
        errors.append("apps/mobile/package.json missing start or start:expo script")
    if "smoke-fixture-reader.mjs" not in script_value(mobile_package, "smoke:fixture"):
        errors.append("apps/mobile/package.json smoke:fixture must run scripts/mobile/smoke-fixture-reader.mjs")
    if "expo-start-smoke.mjs" not in script_value(mobile_package, "start:smoke"):
        errors.append("apps/mobile/package.json start:smoke must run scripts/mobile/expo-start-smoke.mjs")

    mobile_dependencies = mobile_package.get("dependencies") or {}
    mobile_dev_dependencies = mobile_package.get("devDependencies") or {}
    for dependency in MOBILE_REQUIRED_DEPENDENCIES:
        if dependency not in mobile_dependencies:
            errors.append(f"apps/mobile/package.json missing dependency: {dependency}")
    for dependency in ["typescript", "@types/react"]:
        if dependency not in mobile_dev_dependencies:
            errors.append(f"apps/mobile/package.json missing devDependency: {dependency}")

    root_expo_version = (root_package.get("dependencies") or {}).get("expo")
    mobile_expo_version = mobile_dependencies.get("expo")
    if root_expo_version and mobile_expo_version and root_expo_version.lstrip("^~") != mobile_expo_version.lstrip("^~"):
        errors.append("Root and apps/mobile Expo versions must stay aligned")

    lock_packages = lockfile.get("packages") or {}
    for workspace_path in ["apps/mobile", "packages/core-runtime"]:
        if workspace_path not in lock_packages:
            errors.append(f"package-lock.json missing workspace package: {workspace_path}")
    if "node_modules/typescript" not in lock_packages:
        errors.append("package-lock.json missing installed TypeScript package")
    if "node_modules/expo-router" not in lock_packages and "apps/mobile/node_modules/expo-router" not in lock_packages:
        errors.append("package-lock.json missing installed Expo Router package")

    if workflow_doc_path.exists():
        workflow_doc = read_text(workflow_doc_path)
        for snippet in WORKFLOW_DOC_REQUIRED_TEXT:
            if snippet not in workflow_doc:
                errors.append(f"docs/mobile/MOBILE_DEPENDENCY_WORKFLOW.md missing text: {snippet}")

    if errors:
        print("MOBILE_DEPENDENCY_WORKFLOW_VALIDATION_FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("MOBILE_DEPENDENCY_WORKFLOW_VALIDATION_PASSED")
    print(f"mobile_scripts={','.join(sorted(mobile_scripts))}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
