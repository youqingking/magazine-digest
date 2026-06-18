#!/usr/bin/env python3
"""Scan app privacy evidence and generate disclosure-prep reports."""

from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "privacy_disclosure_prep.v1"
DEFAULT_OUTPUT_DIR = "play-store-launch/reports"
SKILL_DIR = Path(__file__).resolve().parents[1]
SDK_REGISTRY_PATH = SKILL_DIR / "references" / "sdk-signal-registry.json"
OFFICIAL_DATA_SAFETY_URL = "https://support.google.com/googleplay/android-developer/answer/10787469?hl=en"
NEED_HUMAN = "NEED_HUMAN"
AUTO_PARSED = "AUTO_PARSED"
PLAY_CONSOLE_CSV_COLUMNS = [
    "Question ID (machine readable)",
    "Response ID (machine readable)",
    "Response value",
    "Answer requirement",
    "Human-friendly question label",
]

CLAIM_STATUSES = {
    "observed_in_repo",
    "inferred",
    "not_observed",
    "missing",
    "conflict",
    "needs_human",
    "blocked",
    "not_applicable",
}
CLAIM_CLASSES = {"C0", "C1", "C2", "C3", "C4", "C5"}
HIGH_REVIEW_CLASSES = {"C3", "C4", "C5"}

GOOGLE_DATA_TYPE_MAP = {
    ("Location", "Location"): "Approximate or precise location",
    ("Location", "Precise location"): "Precise location",
    ("Location", "Approximate location"): "Approximate location",
    ("Location", "Background location"): "Approximate or precise location",
    ("Personal info", "Email address"): "Email address",
    ("Personal info", "Phone number"): "Phone number",
    ("Personal info", "User ID"): "User IDs",
    ("Personal info", "Name"): "Name",
    ("Personal info", "Age or birth date"): "Other personal info",
    ("Personal info", "Address"): "Address",
    ("Financial info", "Payment or purchase info"): "Purchase history",
    ("Health and fitness", "Health or fitness"): "Health info or fitness info",
    ("Messages", "Messages"): "Other in-app messages",
    ("Photos and videos", "Photos or videos"): "Photos or videos",
    ("Photos and videos", "Photos"): "Photos",
    ("Photos and videos", "Videos"): "Videos",
    ("Photos and videos", "Camera"): "Photos or videos",
    ("Audio files", "Audio"): "Voice or sound recordings",
    ("Audio files", "Microphone"): "Voice or sound recordings",
    ("Contacts", "Contacts"): "Contacts",
    ("Calendar", "Calendar"): "Calendar events",
    ("Files and docs", "Files or documents"): "Files and docs",
    ("Files and docs", "External storage"): "Files and docs",
    ("Files and docs", "External storage write"): "Files and docs",
    ("App activity", "Analytics event"): "App interactions",
    ("App activity", "Backend log field set"): "Other actions",
    ("Web browsing", "Web URL or browsing signal"): "Web browsing history",
    ("App info and performance", "Diagnostics"): "Diagnostics",
    ("Device or other IDs", "Device or other ID"): "Device or other IDs",
    ("Device or other IDs", "Advertising ID"): "Device or other IDs",
    ("Device or other IDs", "Push notification token candidate"): "Device or other IDs",
    ("Device or other IDs", "Phone/device state"): "Device or other IDs",
}

SDK_CATEGORY_DEFAULT_TYPE = {
    "Location": "Approximate or precise location",
    "Personal info": "Other personal info",
    "Financial info": "Purchase history",
    "Health and fitness": "Health info or fitness info",
    "Messages": "Other in-app messages",
    "Photos and videos": "Photos or videos",
    "Audio files": "Other audio files",
    "Files and docs": "Files and docs",
    "Calendar": "Calendar events",
    "Contacts": "Contacts",
    "App activity": "App interactions",
    "Web browsing": "Web browsing history",
    "App info and performance": "Diagnostics",
    "Device or other IDs": "Device or other IDs",
}

DATA_SAFETY_PURPOSES = (
    "App functionality",
    "Analytics",
    "Developer communications",
    "Advertising or marketing",
    "Fraud prevention, security, and compliance",
    "Personalization",
    "Account management",
)

OFFICIAL_DATA_TYPE_RESPONSE_MAP = {
    ("Personal info", "Name"): ["PSL_NAME"],
    ("Personal info", "Email address"): ["PSL_EMAIL"],
    ("Personal info", "User IDs"): ["PSL_USER_ACCOUNT"],
    ("Personal info", "Address"): ["PSL_ADDRESS"],
    ("Personal info", "Phone number"): ["PSL_PHONE"],
    ("Personal info", "Other personal info"): ["PSL_OTHER_PERSONAL"],
    ("Financial info", "Purchase history"): ["PSL_PURCHASE_HISTORY"],
    ("Health and fitness", "Health information"): ["PSL_HEALTH"],
    ("Health and fitness", "Fitness information"): ["PSL_FITNESS"],
    ("Messages", "Other in-app messages"): ["PSL_OTHER_MESSAGES"],
    ("Photos and videos", "Photos"): ["PSL_PHOTOS"],
    ("Photos and videos", "Videos"): ["PSL_VIDEOS"],
    ("Audio files", "Voice or sound recordings"): ["PSL_AUDIO"],
    ("Audio files", "Other audio files"): ["PSL_OTHER_AUDIO"],
    ("Files and docs", "Files and docs"): ["PSL_FILES_AND_DOCS"],
    ("Calendar", "Calendar events"): ["PSL_CALENDAR"],
    ("Contacts", "Contacts"): ["PSL_CONTACTS"],
    ("App activity", "App interactions"): ["PSL_USER_INTERACTION"],
    ("App activity", "Other actions"): ["PSL_OTHER_APP_ACTIVITY"],
    ("Web browsing", "Web browsing history"): ["PSL_WEB_BROWSING_HISTORY"],
    ("App info and performance", "Diagnostics"): ["PSL_PERFORMANCE_DIAGNOSTICS"],
    ("Device or other IDs", "Device or other IDs"): ["PSL_DEVICE_ID"],
    ("Location", "Approximate location"): ["PSL_APPROX_LOCATION"],
    ("Location", "Precise location"): ["PSL_PRECISE_LOCATION"],
}

OFFICIAL_PURPOSE_RESPONSE_MAP = {
    "App functionality": "PSL_APP_FUNCTIONALITY",
    "Analytics": "PSL_ANALYTICS",
    "Developer communications": "PSL_DEVELOPER_COMMUNICATIONS",
    "Advertising or marketing": "PSL_ADVERTISING",
    "Fraud prevention, security, and compliance": "PSL_FRAUD_PREVENTION_SECURITY",
    "Personalization": "PSL_PERSONALIZATION",
    "Account management": "PSL_ACCOUNT_MANAGEMENT",
}

SKIP_PREFIXES = (
    ".git/",
    ".codex/",
    "node_modules/",
    ".expo/",
    ".next/",
    "dist/",
    "build/",
    "coverage/",
    "output/",
    "artifacts/",
    "play-store-launch/",
    "mobile/unpackage/",
    "android/build/",
    "ios/build/",
    "runtime/releases/",
    "runtime/generated/",
)
SKIP_SUFFIXES = (
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".gif",
    ".ico",
    ".pdf",
    ".zip",
    ".apk",
    ".aab",
    ".keystore",
    ".jks",
    ".p12",
    ".mp4",
    ".mov",
    ".mp3",
    ".wav",
    ".lockb",
)
TEXT_SUFFIXES = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".java",
    ".kt",
    ".swift",
    ".xml",
    ".json",
    ".jsonl",
    ".yaml",
    ".yml",
    ".gradle",
    ".properties",
    ".plist",
    ".dart",
    ".py",
    ".rb",
    ".go",
    ".php",
    ".md",
    ".txt",
    ".html",
}
DATA_FLOW_SUFFIXES = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".java",
    ".kt",
    ".swift",
    ".xml",
    ".json",
    ".yaml",
    ".yml",
    ".gradle",
    ".properties",
    ".plist",
    ".dart",
    ".py",
    ".rb",
    ".go",
    ".php",
}
SOURCE_SUFFIXES = {
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".mjs",
    ".cjs",
    ".java",
    ".kt",
    ".swift",
    ".dart",
    ".py",
    ".rb",
    ".go",
    ".php",
}

PERMISSION_MAP = {
    "ACCESS_FINE_LOCATION": ("Location", "Precise location"),
    "ACCESS_COARSE_LOCATION": ("Location", "Approximate location"),
    "ACCESS_BACKGROUND_LOCATION": ("Location", "Background location"),
    "CAMERA": ("Photos and videos", "Camera"),
    "READ_MEDIA_IMAGES": ("Photos and videos", "Photos"),
    "READ_MEDIA_VIDEO": ("Photos and videos", "Videos"),
    "READ_EXTERNAL_STORAGE": ("Files and docs", "External storage"),
    "WRITE_EXTERNAL_STORAGE": ("Files and docs", "External storage write"),
    "RECORD_AUDIO": ("Audio files", "Microphone"),
    "READ_CONTACTS": ("Contacts", "Contacts"),
    "WRITE_CONTACTS": ("Contacts", "Contacts write"),
    "READ_CALENDAR": ("Calendar", "Calendar"),
    "WRITE_CALENDAR": ("Calendar", "Calendar write"),
    "POST_NOTIFICATIONS": ("Device or other IDs", "Push notification token candidate"),
    "READ_PHONE_STATE": ("Device or other IDs", "Phone/device state"),
    "com.google.android.gms.permission.AD_ID": ("Device or other IDs", "Advertising ID"),
    "AD_ID": ("Device or other IDs", "Advertising ID"),
}

DATA_PATTERNS: list[dict[str, Any]] = [
    {"pattern": r"\b(email|emailAddress)\b", "category": "Personal info", "type": "Email address", "identity": True},
    {"pattern": r"\b(phone|phoneNumber|mobileNumber|tel)\b", "category": "Personal info", "type": "Phone number", "identity": True},
    {"pattern": r"\b(userId|user_id|uid|accountId|profileId)\b", "category": "Personal info", "type": "User ID", "identity": True},
    {"pattern": r"\b(name|displayName|fullName|username)\b", "category": "Personal info", "type": "Name", "identity": True},
    {"pattern": r"\b(age|birthday|birthDate|dateOfBirth)\b", "category": "Personal info", "type": "Age or birth date", "identity": True, "child_signal": True},
    {"pattern": r"\b(address|postal|zipCode)\b", "category": "Personal info", "type": "Address", "identity": True},
    {"pattern": r"\b(latitude|longitude|lat|lng|gps|geofence|location)\b", "category": "Location", "type": "Location", "sensitive": True},
    {"pattern": r"\b(camera|photo|image|video|mediaLibrary)\b", "category": "Photos and videos", "type": "Photos or videos", "sensitive": True},
    {"pattern": r"\b(microphone|audio|voice|recording)\b", "category": "Audio files", "type": "Audio", "sensitive": True},
    {"pattern": r"\b(contact|contacts|addressBook)\b", "category": "Contacts", "type": "Contacts", "sensitive": True},
    {"pattern": r"\b(calendar|reminder)\b", "category": "Calendar", "type": "Calendar", "sensitive": True},
    {"pattern": r"\b(payment|billing|card|invoice|subscription|purchase|revenue)\b", "category": "Financial info", "type": "Payment or purchase info", "sensitive": True},
    {"pattern": r"\b(health|medical|fitness|workout|steps|heart)\b", "category": "Health and fitness", "type": "Health or fitness", "sensitive": True},
    {"pattern": r"\b(message|chat|sms)\b", "category": "Messages", "type": "Messages", "sensitive": True},
    {"pattern": r"\b(attachment|upload|documentFile|documentId|userFile|uploadedFile)\b", "category": "Files and docs", "type": "Files or documents"},
    {"pattern": r"\b(logEvent|track|screenView|analytics|eventName|event_name)\b", "category": "App activity", "type": "Analytics event"},
    {"pattern": r"\b(crash|exception|diagnostic|performance|breadcrumb)\b", "category": "App info and performance", "type": "Diagnostics"},
    {"pattern": r"\b(deviceId|androidId|advertisingId|idfa|installationId|pushToken|expoPushToken)\b", "category": "Device or other IDs", "type": "Device or other ID", "tracking": True},
    {"pattern": r"\b(webview|referrer|browserHistory|visitedUrl|pageUrl|currentUrl)\b", "category": "Web browsing", "type": "Web URL or browsing signal"},
]

ANALYTICS_CALL_RE = re.compile(r"\b(logEvent|track|identify|setUserId|setUserProperties|captureException|setUser)\s*\(", re.IGNORECASE)
NETWORK_CALL_RE = re.compile(r"\b(fetch|axios|graphql|mutation|post|put|patch)\b", re.IGNORECASE)
STORAGE_CALL_RE = re.compile(r"\b(AsyncStorage|SecureStore|localStorage|SQLite|cookie|Keychain|SharedPreferences)\b", re.IGNORECASE)
AUTH_RE = re.compile(r"\b(signIn|signin|login|logIn|register|signup|signUp|auth|oauth|createUser|currentUser|profile)\b", re.IGNORECASE)
DELETE_RE = re.compile(r"\b(deleteAccount|deleteUser|account/delete|delete-account|注销账号|删除账号|Data deletion|data deletion)\b", re.IGNORECASE)
CHILD_RE = re.compile(r"\b(children|kids|family|families|teen|minor|student|age|birthday)\b|儿童|未成年人|青少年|家庭", re.IGNORECASE)
PRIVACY_URL_RE = re.compile(r"https?://[^\s\"'<>)]*privacy[^\s\"'<>)]*", re.IGNORECASE)
URL_RE = re.compile(r"^https?://[^\s\"'<>]+$", re.IGNORECASE)
PRIVACY_KEY_RE = re.compile(r"\b(privacyUrl|privacyPolicyUrl|privacy_policy_url|privacyPolicy)\b", re.IGNORECASE)
DATA_DELETION_URL_RE = re.compile(r"https?://[^\s\"'<>)]*(delete|deletion|account)[^\s\"'<>)]*", re.IGNORECASE)
OWNER_PRIVACY_INPUT_PATHS = (
    "play-store-launch/inputs/privacy-data-safety-owner-input.json",
    "play-store-launch/inputs/google-data-safety-owner-input.json",
    "play-store-launch/inputs/google-play-listing.json",
)
PLACEHOLDER_VALUES = {"", "NEED_HUMAN", "TODO", "TBD", "N/A", "NA", "UNKNOWN", "未确认", "待确认"}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def as_posix(path: str | Path) -> str:
    return str(path).replace("\\", "/")


def read_text(path: Path, max_bytes: int = 2_000_000) -> str:
    if not path.is_file():
        return ""
    try:
        if path.stat().st_size > max_bytes:
            return ""
        return path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return ""


def read_json(path: Path) -> Any | None:
    text = read_text(path)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def is_placeholder_value(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return value.strip().upper() in PLACEHOLDER_VALUES
    return False


def first_json_value(data: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in data:
            return data.get(key)
    return None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def sha256_text(text: str) -> str:
    return "sha256:" + hashlib.sha256(text.encode("utf-8", errors="replace")).hexdigest()


def dedupe_keep_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for item in items:
        if item in seen:
            continue
        seen.add(item)
        result.append(item)
    return result


def human_review_status(required: bool = True) -> str:
    return NEED_HUMAN if required else AUTO_PARSED


def safe_observed_value(key: str, value: Any) -> Any:
    lowered = key.lower()
    if any(token in lowered for token in ("secret", "token", "apikey", "api_key", "private", "password", "credential")):
        return "<redacted_possible_secret>"
    if isinstance(value, str) and len(value) > 300:
        return value[:300] + f"...<truncated {len(value) - 300} chars>"
    return value


def is_candidate_file(path: str) -> bool:
    normalized = as_posix(path)
    lowered = normalized.lower()
    if any(lowered.startswith(prefix.lower()) for prefix in SKIP_PREFIXES):
        return False
    if lowered.endswith(SKIP_SUFFIXES):
        return False
    name = Path(normalized).name.lower()
    if name in {"prd.md", "agents.md"}:
        return False
    if name in {".env", ".env.local", ".env.production", "google-services.json"}:
        return name == "google-services.json"
    return True


def visible_files(root: Path) -> tuple[list[str], dict[str, Any]]:
    try:
        result = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
        )
    except OSError as exc:
        result = None
        git_error = str(exc)
    else:
        git_error = result.stderr.strip() if result.returncode != 0 else ""

    if result and result.returncode == 0:
        raw_files = [line.strip().replace("\\", "/") for line in result.stdout.splitlines() if line.strip()]
        mode = "git_ls_files_exclude_standard"
    else:
        raw_files = [
            path.relative_to(root).as_posix()
            for path in root.rglob("*")
            if path.is_file()
        ]
        mode = "filesystem_fallback"

    selected = [path for path in raw_files if is_candidate_file(path)]
    skipped = len(raw_files) - len(selected)
    return selected, {
        "file_discovery_mode": mode,
        "ignored_paths_respected": mode == "git_ls_files_exclude_standard",
        "git_error": git_error,
        "raw_file_count": len(raw_files),
        "file_count_scanned": len(selected),
        "file_count_skipped": skipped,
        "skip_prefixes": list(SKIP_PREFIXES),
    }


def git_commit(root: Path) -> str:
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            check=False,
        )
    except OSError:
        return ""
    return result.stdout.strip() if result.returncode == 0 else ""


def load_sdk_registry() -> dict[str, Any]:
    data = read_json(SDK_REGISTRY_PATH)
    return data if isinstance(data, dict) else {}


def add_evidence(
    evidence: list[dict[str, Any]],
    *,
    source_type: str,
    source_ref: str,
    observed_key: str,
    observed_value: Any,
    parser: str,
    line_start: int | None = None,
    line_end: int | None = None,
    confidence: float = 1.0,
) -> str:
    evidence_id = f"evidence.{len(evidence) + 1:04d}"
    safe_value = safe_observed_value(observed_key, observed_value)
    entry: dict[str, Any] = {
        "evidence_id": evidence_id,
        "source_type": source_type,
        "source_ref": source_ref,
        "parser": parser,
        "observed_key": observed_key,
        "observed_value": safe_value,
        "snippet_hash": sha256_text(f"{source_ref}:{observed_key}:{safe_value}"),
        "confidence": confidence,
    }
    if line_start is not None:
        entry["line_start"] = line_start
        entry["line_end"] = line_end or line_start
    evidence.append(entry)
    return evidence_id


def add_claim(
    claims: list[dict[str, Any]],
    *,
    claim_id: str,
    question: str,
    status: str,
    answer_state: str,
    claim_class: str,
    evidence_refs: list[str],
    value: Any,
    confidence: float,
    limitations: list[str] | None = None,
    human_review_required: bool | None = None,
) -> None:
    if status not in CLAIM_STATUSES:
        status = "needs_human"
    if claim_class not in CLAIM_CLASSES:
        claim_class = "C3"
    review = claim_class in HIGH_REVIEW_CLASSES if human_review_required is None else human_review_required
    claims.append({
        "claim_id": claim_id,
        "question": question,
        "status": status,
        "answer_state": answer_state,
        "claim_class": claim_class,
        "human_review_required": bool(review),
        "review_status": human_review_status(bool(review)),
        "value": value,
        "confidence": confidence,
        "evidence_refs": evidence_refs,
        "limitations": limitations or [],
    })


def line_number_for(text: str, pattern: str, flags: int = re.IGNORECASE) -> int | None:
    regex = re.compile(pattern, flags)
    for index, line in enumerate(text.splitlines(), start=1):
        if regex.search(line):
            return index
    return None


def flatten_dependencies(data: dict[str, Any]) -> dict[str, str]:
    deps: dict[str, str] = {}
    for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        value = data.get(key)
        if isinstance(value, dict):
            for name, version in value.items():
                deps[str(name)] = str(version)
    return deps


def iter_dependencies(data: dict[str, Any]) -> list[tuple[str, str, str]]:
    deps: list[tuple[str, str, str]] = []
    for scope in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
        value = data.get(scope)
        if isinstance(value, dict):
            for name, version in value.items():
                deps.append((str(name), str(version), scope))
    return deps


def detect_platforms(root: Path, files: list[str], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    platforms: list[dict[str, Any]] = []
    file_set = set(files)

    def mark(platform: str, reason: str, source: str) -> None:
        if any(item["platform"] == platform for item in platforms):
            return
        evidence_id = add_evidence(
            evidence,
            source_type="platform_signal",
            source_ref=source,
            observed_key=f"platform.{platform}",
            observed_value=reason,
            parser="file_presence",
            confidence=0.95,
        )
        platforms.append({"platform": platform, "reason": reason, "evidence_refs": [evidence_id]})

    if "app.json" in file_set or any(path.endswith("app.config.js") or path.endswith("app.config.ts") for path in files):
        mark("expo", "Expo app config found", "app.json" if "app.json" in file_set else "app.config.*")
    if "package.json" in file_set:
        pkg = read_json(root / "package.json")
        if isinstance(pkg, dict) and "expo" in flatten_dependencies(pkg):
            mark("expo", "expo dependency found", "package.json")
        deps = flatten_dependencies(pkg) if isinstance(pkg, dict) else {}
        if any(name in deps for name in ("react-native", "expo")):
            mark("react_native", "React Native or Expo dependency found", "package.json")
    if any(path.endswith("AndroidManifest.xml") or path.endswith("build.gradle") for path in files):
        mark("android", "Android native config found", "AndroidManifest.xml/build.gradle")
    if any(path.endswith("Info.plist") or Path(path).name == "Podfile" for path in files):
        mark("ios", "iOS config found", "Info.plist/Podfile")
    if "pubspec.yaml" in file_set:
        mark("flutter", "Flutter pubspec found", "pubspec.yaml")
    if any("capacitor.config" in path or path.endswith("config.xml") for path in files):
        mark("capacitor_cordova", "Capacitor/Cordova config found", "capacitor/config.xml")
    if any(re.search(r"(^|/)(server|api|routes|controllers|prisma|supabase)(/|$)", path) for path in files):
        mark("backend_or_api", "Backend/API source paths found", "server/api/routes/prisma/supabase")
    return platforms


def classify_sdk(name: str, registry: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    lowered = name.lower()
    for sdk_id, meta in registry.items():
        patterns = [str(item).lower() for item in meta.get("patterns", [])]
        if any(pattern in lowered for pattern in patterns):
            return sdk_id, meta
    if lowered.startswith("expo"):
        return "expo", {
            "category": "app_framework",
            "third_party": "Expo",
            "data_categories": ["App info and performance"],
            "risk": "framework",
        }
    if lowered in {"react-native", "react", "androidx.core", "com.android.application"}:
        return lowered, {
            "category": "app_framework",
            "third_party": "",
            "data_categories": [],
            "risk": "framework",
        }
    return "", {}


def collect_package_dependencies(root: Path, files: list[str], evidence: list[dict[str, Any]], registry: dict[str, Any]) -> list[dict[str, Any]]:
    inventories: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    package_files = [path for path in files if Path(path).name == "package.json"]
    for relative in package_files:
        data = read_json(root / relative)
        if not isinstance(data, dict):
            continue
        deps = iter_dependencies(data)
        for dep_name, version, scope in sorted(deps):
            sdk_id, meta = classify_sdk(dep_name, registry)
            is_known = bool(sdk_id)
            if not is_known and scope != "dependencies":
                continue
            if not is_known and relative != "package.json":
                continue
            if not is_known and dep_name.startswith("@types/"):
                continue
            key = (relative, dep_name)
            if key in seen:
                continue
            seen.add(key)
            evidence_id = add_evidence(
                evidence,
                source_type="package_manifest",
                source_ref=relative,
                observed_key=f"dependency.{dep_name}",
                observed_value={"version": version, "scope": scope},
                parser="json",
                confidence=1.0,
            )
            inventories.append({
                "sdk_id": sdk_id or dep_name,
                "name": dep_name,
                "version": version,
                "dependency_scope": scope,
                "category": meta.get("category", "runtime_dependency_unknown_privacy_relevance"),
                "third_party": meta.get("third_party", ""),
                "data_categories": meta.get("data_categories", []),
                "risk": meta.get("risk", "unknown"),
                "source_ref": relative,
                "status": "declared_only",
                "evidence_refs": [evidence_id],
                "human_review_required": meta.get("category") not in {"app_framework", None},
                "review_status": human_review_status(meta.get("category") not in {"app_framework", None}),
            })
    return inventories


def collect_gradle_and_pods(root: Path, files: list[str], evidence: list[dict[str, Any]], registry: dict[str, Any]) -> list[dict[str, Any]]:
    inventories: list[dict[str, Any]] = []
    for relative in files:
        name = Path(relative).name
        if not (name.endswith(".gradle") or name in {"Podfile", "Podfile.lock", "pubspec.yaml"}):
            continue
        text = read_text(root / relative)
        if not text:
            continue
        for sdk_id, meta in registry.items():
            patterns = [str(item) for item in meta.get("patterns", [])]
            for pattern in patterns:
                if pattern.lower() not in text.lower():
                    continue
                evidence_id = add_evidence(
                    evidence,
                    source_type="native_dependency_manifest",
                    source_ref=relative,
                    observed_key=f"sdk_pattern.{pattern}",
                    observed_value=pattern,
                    parser="text_pattern",
                    line_start=line_number_for(text, re.escape(pattern)),
                    confidence=0.85,
                )
                inventories.append({
                    "sdk_id": sdk_id,
                    "name": pattern,
                    "version": "unknown",
                    "category": meta.get("category", "unknown"),
                    "third_party": meta.get("third_party", ""),
                    "data_categories": meta.get("data_categories", []),
                    "risk": meta.get("risk", "unknown"),
                    "source_ref": relative,
                    "status": "declared_only",
                    "evidence_refs": [evidence_id],
                    "human_review_required": True,
                    "review_status": NEED_HUMAN,
                })
                break
    return inventories


def update_sdk_usage(root: Path, files: list[str], sdk_inventory: list[dict[str, Any]], evidence: list[dict[str, Any]], registry: dict[str, Any]) -> None:
    if not sdk_inventory:
        return
    source_files = [path for path in files if Path(path).suffix.lower() in SOURCE_SUFFIXES and is_app_source_path(path)]
    text_cache: dict[str, str] = {}
    for item in sdk_inventory:
        patterns = registry.get(item["sdk_id"], {}).get("patterns", []) or [item["name"]]
        matches = 0
        for relative in source_files:
            text = text_cache.setdefault(relative, read_text(root / relative))
            if not text:
                continue
            lowered = text.lower()
            matched = next((pattern for pattern in patterns if str(pattern).lower() in lowered), "")
            if not matched:
                continue
            matches += 1
            line = line_number_for(text, re.escape(str(matched)))
            evidence_id = add_evidence(
                evidence,
                source_type="sdk_code_usage",
                source_ref=relative,
                observed_key=f"sdk_usage.{item['sdk_id']}",
                observed_value=matched,
                parser="text_pattern",
                line_start=line,
                confidence=0.8,
            )
            item["evidence_refs"].append(evidence_id)
            if re.search(r"\b(init|initialize|configure|createClient|setup|logEvent|track|captureException)\b", text, re.IGNORECASE):
                item["status"] = "initialized_or_used"
            else:
                item["status"] = "imported"
            if matches >= 3:
                break


def collect_permissions(root: Path, files: list[str], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    permissions: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    candidates = [
        path for path in files
        if path.endswith("AndroidManifest.xml") or Path(path).name in {"app.json", "app.config.js", "app.config.ts", "Info.plist"}
    ]
    for relative in candidates:
        text = read_text(root / relative)
        if not text:
            continue
        for permission, (category, data_type) in PERMISSION_MAP.items():
            if permission not in text:
                continue
            key = (relative, permission)
            if key in seen:
                continue
            seen.add(key)
            evidence_id = add_evidence(
                evidence,
                source_type="permission_manifest",
                source_ref=relative,
                observed_key=f"permission.{permission}",
                observed_value=permission,
                parser="manifest_pattern",
                line_start=line_number_for(text, re.escape(permission), flags=0),
                confidence=0.95,
            )
            permissions.append({
                "permission": permission,
                "data_category": category,
                "data_type": data_type,
                "source_ref": relative,
                "status": "observed_in_repo",
                "evidence_refs": [evidence_id],
                "human_review_required": True,
                "review_status": NEED_HUMAN,
            })
    return permissions


def interesting_text_files(files: list[str]) -> list[str]:
    result: list[str] = []
    for relative in files:
        suffix = Path(relative).suffix.lower()
        if suffix not in TEXT_SUFFIXES:
            continue
        if Path(relative).name in {"package-lock.json", "yarn.lock", "pnpm-lock.yaml"}:
            continue
        if Path(relative).name in {"google-services.json", "GoogleService-Info.plist"}:
            continue
        result.append(relative)
    return result


def is_app_source_path(relative: str) -> bool:
    lowered = relative.lower().replace("\\", "/")
    if lowered.startswith(("scripts/", "docs/", ".github/", "test/", "tests/", "__tests__/")):
        return False
    if lowered.startswith((
        "app/",
        "apps/",
        "mobile/",
        "src/",
        "android/",
        "ios/",
        "server/",
        "backend/",
        "api/",
        "pages/",
        "components/",
        "cloudfunctions/",
        "functions/",
        "supabase/",
        "prisma/",
    )):
        return True
    return Path(lowered).name in {"app.js", "app.tsx", "index.js", "index.ts", "main.js", "main.ts", "main.dart"}


def sink_for_line(line: str, sdk_inventory: list[dict[str, Any]]) -> tuple[str, str, bool]:
    if ANALYTICS_CALL_RE.search(line):
        third_party = next((item.get("third_party", "") for item in sdk_inventory if item.get("category") in {"analytics", "crash_reporting"}), "")
        return "analytics_or_crash_event", third_party, bool(third_party)
    if NETWORK_CALL_RE.search(line):
        return "network_request_candidate", "", True
    if STORAGE_CALL_RE.search(line):
        return "local_storage_candidate", "", False
    return "code_reference", "", False


def ignore_data_pattern_match(item: dict[str, Any], line: str) -> bool:
    lowered = line.lower()
    if item["category"] == "Location" and any(token in lowered for token in ("window.location", "location.hash", "location.href", "location.pathname")):
        return True
    if item["category"] == "Files and docs" and any(token in lowered for token in ("document.queryselector", "document.getelement", "document.createelement", "document.addeventlistener")):
        return True
    return False


def collect_data_flows(root: Path, files: list[str], evidence: list[dict[str, Any]], sdk_inventory: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flows: list[dict[str, Any]] = []
    per_pattern_counts: dict[str, int] = {}
    for relative in [path for path in interesting_text_files(files) if Path(path).suffix.lower() in DATA_FLOW_SUFFIXES and is_app_source_path(path)]:
        text = read_text(root / relative)
        if not text:
            continue
        lines = text.splitlines()
        for line_index, line in enumerate(lines, start=1):
            if len(flows) >= 350:
                return flows
            for item in DATA_PATTERNS:
                if per_pattern_counts.get(item["pattern"], 0) >= 12:
                    continue
                if not re.search(item["pattern"], line, re.IGNORECASE):
                    continue
                if ignore_data_pattern_match(item, line):
                    continue
                sink, third_party, shared_candidate = sink_for_line(line, sdk_inventory)
                linked = bool(item.get("identity")) or bool(re.search(r"\b(userId|user_id|uid|email|account|profile)\b", line, re.IGNORECASE))
                tracking = bool(item.get("tracking")) or bool(re.search(r"\b(advertisingId|idfa|identify|setUserId)\b", line, re.IGNORECASE))
                evidence_id = add_evidence(
                    evidence,
                    source_type="code_data_signal",
                    source_ref=relative,
                    observed_key=f"data_signal.{item['category']}.{item['type']}",
                    observed_value=line.strip()[:240],
                    parser="regex_line",
                    line_start=line_index,
                    confidence=0.65,
                )
                flows.append({
                    "flow_id": f"data_flow.{len(flows) + 1:04d}",
                    "data_category": item["category"],
                    "data_type": item["type"],
                    "source_ref": relative,
                    "line_start": line_index,
                    "source_signal": line.strip()[:240],
                    "sink": sink,
                    "third_party": third_party,
                    "linked_to_identity": "yes_observed" if linked else "candidate_or_unknown",
                    "used_for_tracking": "candidate_inferred" if tracking else "not_observed",
                    "shared_with_third_parties": "candidate_inferred" if shared_candidate or third_party else "not_observed",
                    "confidence": 0.65,
                    "evidence_refs": [evidence_id],
                    "review_status": NEED_HUMAN,
                    "sensitive": bool(item.get("sensitive")),
                    "child_signal": bool(item.get("child_signal")),
                })
                per_pattern_counts[item["pattern"]] = per_pattern_counts.get(item["pattern"], 0) + 1
                break
    return flows


def collect_backend_log_flows(root: Path, samples: list[str], allowed_files: set[str], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    flows: list[dict[str, Any]] = []
    for sample in samples:
        relative = as_posix(sample)
        if relative not in allowed_files:
            add_evidence(
                evidence,
                source_type="backend_log_sample_rejected",
                source_ref=".",
                observed_key="backend_log_sample.rejected",
                observed_value={"path": relative, "reason": "not_visible_by_git_ls_files_or_filtered"},
                parser="privacy_scan.py",
                confidence=1.0,
            )
            continue
        path = root / relative
        text = read_text(path, max_bytes=1_000_000)
        if not text:
            continue
        for index, raw_line in enumerate(text.splitlines()[:200], start=1):
            keys: list[str] = []
            endpoint = ""
            try:
                value = json.loads(raw_line)
            except json.JSONDecodeError:
                value = None
            if isinstance(value, dict):
                keys = sorted(str(key) for key in value.keys())
                endpoint = str(value.get("path") or value.get("endpoint") or value.get("url") or "")
            else:
                keys = re.findall(r"\b(userId|email|phone|ip|userAgent|deviceId|session|endpoint|path|url)\b", raw_line, re.IGNORECASE)
            if not keys:
                continue
            evidence_id = add_evidence(
                evidence,
                source_type="backend_log_sample",
                source_ref=relative,
                observed_key="log_sample.keys",
                observed_value={"keys": keys[:20], "endpoint": endpoint},
                parser="jsonl_or_text",
                line_start=index,
                confidence=0.75,
            )
            flows.append({
                "flow_id": f"backend_log_flow.{len(flows) + 1:04d}",
                "data_category": "App activity",
                "data_type": "Backend log field set",
                "source_ref": relative,
                "line_start": index,
                "source_signal": {"keys": keys[:20], "endpoint": endpoint},
                "sink": "backend_log_sample",
                "third_party": "",
                "linked_to_identity": "yes_observed" if any(key.lower() in {"userid", "email", "phone"} for key in keys) else "candidate_or_unknown",
                "used_for_tracking": "candidate_inferred" if any(key.lower() in {"deviceid", "session"} for key in keys) else "not_observed",
                "shared_with_third_parties": "needs_human",
                "confidence": 0.75,
                "evidence_refs": [evidence_id],
                "review_status": NEED_HUMAN,
                "sensitive": False,
                "child_signal": False,
            })
    return flows


def google_data_type(category: str, data_type: str) -> str:
    return GOOGLE_DATA_TYPE_MAP.get((category, data_type), SDK_CATEGORY_DEFAULT_TYPE.get(category, data_type))


def purposes_for_flow(flow: dict[str, Any]) -> list[str]:
    purposes: list[str] = []
    sink = str(flow.get("sink", ""))
    category = str(flow.get("data_category", ""))
    data_type = str(flow.get("data_type", ""))
    source_signal = str(flow.get("source_signal", "")).lower()

    if sink in {"analytics_or_crash_event", "backend_log_sample"} or category in {"App activity", "App info and performance"}:
        purposes.append("Analytics")
    if category in {"Personal info"} or any(token in source_signal for token in ("account", "profile", "login", "signin", "signup")):
        purposes.append("Account management")
    if category in {"Financial info"}:
        purposes.append("App functionality")
    if category in {"Device or other IDs"} or "security" in source_signal:
        purposes.append("Fraud prevention, security, and compliance")
    if flow.get("used_for_tracking") == "candidate_inferred":
        purposes.append("Advertising or marketing")
    if not purposes:
        purposes.append("App functionality")
    return [purpose for purpose in DATA_SAFETY_PURPOSES if purpose in set(purposes)]


def merge_yes_need_human(current: str, incoming: str) -> str:
    priority = {"YES_CANDIDATE": 3, NEED_HUMAN: 2, "NO_NOT_OBSERVED": 1}
    return incoming if priority.get(incoming, 0) > priority.get(current, 0) else current


def add_data_safety_row(
    rows: dict[tuple[str, str], dict[str, Any]],
    *,
    category: str,
    data_type: str,
    collected: str,
    shared: str,
    linked_to_identity: str,
    used_for_tracking: str,
    purposes: list[str],
    evidence_refs: list[str],
    source_kinds: list[str],
    confidence: float,
) -> None:
    official_type = google_data_type(category, data_type)
    key = (category, official_type)
    if key not in rows:
        rows[key] = {
            "category": category,
            "data_type": official_type,
            "collected": "NO_NOT_OBSERVED",
            "shared": "NO_NOT_OBSERVED",
            "processed_ephemerally": NEED_HUMAN,
            "required_or_optional": NEED_HUMAN,
            "purposes": [],
            "purposes_review_status": NEED_HUMAN,
            "linked_to_identity": NEED_HUMAN,
            "used_for_tracking": "NO_NOT_OBSERVED",
            "review_status": NEED_HUMAN,
            "source_kinds": [],
            "confidence": confidence,
            "evidence_refs": [],
            "notes": [
                "这是 Google Play Data safety 填表草稿；collected/shared/ephemeral/required/purpose 必须由人工最终确认。",
            ],
        }
    row = rows[key]
    row["collected"] = merge_yes_need_human(row["collected"], collected)
    row["shared"] = merge_yes_need_human(row["shared"], shared)
    row["linked_to_identity"] = merge_yes_need_human(
        row["linked_to_identity"],
        "YES_CANDIDATE" if linked_to_identity == "yes_observed" else NEED_HUMAN,
    )
    row["used_for_tracking"] = merge_yes_need_human(
        row["used_for_tracking"],
        "YES_CANDIDATE" if used_for_tracking == "candidate_inferred" else "NO_NOT_OBSERVED",
    )
    row["purposes"] = dedupe_keep_order(row["purposes"] + purposes)
    row["source_kinds"] = dedupe_keep_order(row["source_kinds"] + source_kinds)
    row["evidence_refs"] = dedupe_keep_order(row["evidence_refs"] + evidence_refs)[:30]
    row["confidence"] = max(float(row["confidence"]), confidence)


def draft_answer_has_signal(value: bool) -> str:
    return "YES_CANDIDATE" if value else "NO_NOT_OBSERVED"


def data_safety_human_review_items(draft: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    global_questions = draft.get("global_questions", {})
    if isinstance(global_questions, dict):
        for key, value in global_questions.items():
            if not isinstance(value, dict) or value.get("review_status") != NEED_HUMAN:
                continue
            items.append({
                "item_id": f"global.{key}",
                "field_path": f"global_questions.{key}",
                "review_status": NEED_HUMAN,
                "draft_answer": value.get("draft_answer"),
                "confidence": value.get("confidence", 0),
                "reason": value.get("reason", "该字段需要人工确认后才能进入 Play Console。"),
                "evidence_refs": value.get("evidence_refs", []),
            })
    data_types = draft.get("data_types", [])
    if isinstance(data_types, list):
        for index, row in enumerate(data_types):
            if not isinstance(row, dict):
                continue
            field_base = f"data_types[{index}]"
            for field in ("collected", "shared", "processed_ephemerally", "required_or_optional", "purposes", "linked_to_identity", "used_for_tracking"):
                value = row.get(field)
                purpose_review = field == "purposes" and row.get("purposes_review_status") == NEED_HUMAN
                needs_review = value == NEED_HUMAN or row.get("review_status") == NEED_HUMAN or purpose_review
                if not needs_review:
                    continue
                items.append({
                    "item_id": f"{field_base}.{field}",
                    "field_path": f"{field_base}.{field}",
                    "review_status": NEED_HUMAN,
                    "data_category": row.get("category"),
                    "data_type": row.get("data_type"),
                    "draft_answer": value,
                    "confidence": row.get("confidence", 0),
                    "reason": "逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。",
                    "evidence_refs": row.get("evidence_refs", []),
                })
    return items


def build_data_safety_form_draft(
    sdk_inventory: list[dict[str, Any]],
    permission_inventory: list[dict[str, Any]],
    data_flows: list[dict[str, Any]],
    privacy_policy: dict[str, Any],
    account_deletion: dict[str, Any],
    risks: list[dict[str, Any]],
) -> dict[str, Any]:
    rows: dict[tuple[str, str], dict[str, Any]] = {}

    for flow in data_flows:
        sink = str(flow.get("sink", ""))
        collected = "YES_CANDIDATE" if sink in {"analytics_or_crash_event", "network_request_candidate", "backend_log_sample"} else NEED_HUMAN
        if flow.get("third_party"):
            shared = "YES_CANDIDATE"
        elif flow.get("shared_with_third_parties") == "candidate_inferred":
            shared = NEED_HUMAN
        else:
            shared = "NO_NOT_OBSERVED"
        add_data_safety_row(
            rows,
            category=str(flow.get("data_category", "")),
            data_type=str(flow.get("data_type", "")),
            collected=collected,
            shared=shared,
            linked_to_identity=str(flow.get("linked_to_identity", "")),
            used_for_tracking=str(flow.get("used_for_tracking", "")),
            purposes=purposes_for_flow(flow),
            evidence_refs=list(flow.get("evidence_refs", [])),
            source_kinds=["code_or_log_signal"],
            confidence=float(flow.get("confidence", 0.5)),
        )

    for permission in permission_inventory:
        add_data_safety_row(
            rows,
            category=str(permission.get("data_category", "")),
            data_type=str(permission.get("data_type", "")),
            collected=NEED_HUMAN,
            shared=NEED_HUMAN,
            linked_to_identity=NEED_HUMAN,
            used_for_tracking="candidate_inferred" if permission.get("data_type") == "Advertising ID" else "not_observed",
            purposes=["App functionality"],
            evidence_refs=list(permission.get("evidence_refs", [])),
            source_kinds=["permission"],
            confidence=float(permission.get("confidence", 0.75)),
        )

    for sdk in sdk_inventory:
        categories = [str(category) for category in sdk.get("data_categories", []) if category]
        for category in categories:
            add_data_safety_row(
                rows,
                category=category,
                data_type=SDK_CATEGORY_DEFAULT_TYPE.get(category, category),
                collected=NEED_HUMAN,
                shared=NEED_HUMAN if sdk.get("third_party") else "NO_NOT_OBSERVED",
                linked_to_identity=NEED_HUMAN,
                used_for_tracking="candidate_inferred" if sdk.get("category") in {"ads", "attribution"} or "tracking" in str(sdk.get("risk", "")) else "not_observed",
                purposes=["Analytics"] if sdk.get("category") in {"analytics", "crash_reporting"} else ["App functionality"],
                evidence_refs=list(sdk.get("evidence_refs", [])),
                source_kinds=["sdk_inventory"],
                confidence=0.6,
            )

    privacy_urls = privacy_policy.get("urls", [])
    primary_privacy_url = privacy_urls[0]["url"] if privacy_urls else NEED_HUMAN
    deletion_urls = account_deletion.get("data_deletion_urls", [])
    third_party_sdk_count = len([item for item in sdk_inventory if item.get("third_party")])
    tracking_candidate_count = len([
        flow for flow in data_flows if flow.get("used_for_tracking") == "candidate_inferred"
    ]) + len([
        item for item in sdk_inventory if item.get("category") in {"ads", "attribution"} or "tracking" in str(item.get("risk", ""))
    ])

    form_rows = sorted(rows.values(), key=lambda item: (item["category"], item["data_type"]))
    draft = {
        "schema_version": "google_play_data_safety_draft.v1",
        "official_source": OFFICIAL_DATA_SAFETY_URL,
        "review_status": NEED_HUMAN,
        "non_final_notice": "这是给人工填写 Play Console Data safety 表单用的证据草稿，不是最终提交答案。",
        "global_questions": {
            "does_app_collect_or_share_user_data": {
                "draft_answer": draft_answer_has_signal(bool(form_rows)),
                "review_status": NEED_HUMAN,
                "confidence": 0.75 if form_rows else 0.3,
                "evidence_refs": dedupe_keep_order([ref for row in form_rows for ref in row.get("evidence_refs", [])])[:30],
            },
            "is_all_user_data_collected_encrypted_in_transit": {
                "draft_answer": NEED_HUMAN,
                "review_status": NEED_HUMAN,
                "confidence": 0.0,
                "reason": "静态扫描不能证明所有传输路径均使用加密，也不能证明第三方 SDK 传输行为。",
                "evidence_refs": [],
            },
            "can_users_request_data_deletion": {
                "draft_answer": "YES_CANDIDATE" if deletion_urls or account_deletion.get("deletion_flow_observed") else NEED_HUMAN,
                "review_status": NEED_HUMAN,
                "confidence": 0.65 if deletion_urls or account_deletion.get("deletion_flow_observed") else 0.2,
                "reason": "Play Console 需要确认删除请求机制；如果 app 支持账号创建，还需要确认账号和关联数据删除路径。",
                "evidence_refs": dedupe_keep_order(account_deletion.get("deletion_evidence_refs", [])),
            },
            "privacy_policy_url": {
                "draft_answer": primary_privacy_url,
                "review_status": NEED_HUMAN,
                "confidence": 0.85 if privacy_urls else 0.1,
                "reason": "必须由人工确认这是 app 自有、公开可访问且覆盖当前数据行为的隐私政策 URL。",
                "evidence_refs": dedupe_keep_order([ref for item in privacy_urls for ref in item.get("evidence_refs", [])]),
            },
            "third_party_sdk_or_external_sharing": {
                "draft_answer": "YES_CANDIDATE" if third_party_sdk_count else "NO_NOT_OBSERVED",
                "review_status": NEED_HUMAN,
                "confidence": 0.7 if third_party_sdk_count else 0.35,
                "third_party_sdk_count": third_party_sdk_count,
                "evidence_refs": dedupe_keep_order([ref for item in sdk_inventory if item.get("third_party") for ref in item.get("evidence_refs", [])])[:30],
            },
            "tracking": {
                "draft_answer": "YES_CANDIDATE" if tracking_candidate_count else "NO_NOT_OBSERVED",
                "review_status": NEED_HUMAN,
                "confidence": 0.65 if tracking_candidate_count else 0.35,
                "tracking_candidate_count": tracking_candidate_count,
                "evidence_refs": dedupe_keep_order(
                    [ref for flow in data_flows if flow.get("used_for_tracking") == "candidate_inferred" for ref in flow.get("evidence_refs", [])]
                    + [ref for item in sdk_inventory if item.get("category") in {"ads", "attribution"} for ref in item.get("evidence_refs", [])]
                )[:30],
            },
            "children_or_sensitive_data_risk": {
                "draft_answer": "YES_CANDIDATE" if risks else "NO_NOT_OBSERVED",
                "review_status": NEED_HUMAN,
                "confidence": 0.7 if risks else 0.35,
                "risk_count": len(risks),
                "evidence_refs": dedupe_keep_order([ref for risk in risks for ref in risk.get("evidence_refs", [])])[:30],
            },
        },
        "data_types": form_rows,
    }
    draft["human_review_items"] = data_safety_human_review_items(draft)
    return draft


def owner_privacy_policy_candidates(root: Path, evidence: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    matches: list[dict[str, Any]] = []
    placeholders: list[dict[str, Any]] = []
    for relative in OWNER_PRIVACY_INPUT_PATHS:
        path = root / relative
        data = read_json(path)
        if not isinstance(data, dict):
            continue
        value = first_json_value(data, ("privacyPolicyUrl", "privacy_policy_url", "privacy_policy"))
        if isinstance(value, str) and URL_RE.match(value.strip()) and not is_placeholder_value(value):
            evidence_id = add_evidence(
                evidence,
                source_type="privacy_policy_url_owner_input",
                source_ref=relative,
                observed_key="privacy_policy.url",
                observed_value=value.strip(),
                parser="owner_input_json",
                confidence=0.95,
            )
            matches.append({
                "url": value.strip(),
                "source_ref": relative,
                "reason": "owner_input_candidate",
                "evidence_refs": [evidence_id],
                "reachability": "not_checked",
            })
        else:
            evidence_id = add_evidence(
                evidence,
                source_type="privacy_policy_url_placeholder",
                source_ref=relative,
                observed_key="privacy_policy.placeholder",
                observed_value=value if value is not None else "missing_privacyPolicyUrl",
                parser="owner_input_json",
                confidence=0.8,
            )
            placeholders.append({
                "url": "",
                "source_ref": relative,
                "reason": "owner_input_missing_or_placeholder",
                "evidence_refs": [evidence_id],
                "reachability": "not_checked",
            })
    return matches, placeholders


def detect_privacy_policy(root: Path, files: list[str], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    matches: list[dict[str, Any]] = []
    third_party_or_placeholder: list[dict[str, Any]] = []
    owner_matches, owner_placeholders = owner_privacy_policy_candidates(root, evidence)
    matches.extend(owner_matches)
    third_party_or_placeholder.extend(owner_placeholders)
    candidate_files = [path for path in files if Path(path).suffix.lower() in TEXT_SUFFIXES or Path(path).name in {"app.json", "package.json"}]
    for relative in candidate_files:
        if relative.lower().startswith("scripts/"):
            continue
        text = read_text(root / relative)
        if not text:
            continue
        for line_number, line_text in enumerate(text.splitlines(), start=1):
            if PRIVACY_KEY_RE.search(line_text) and ("xxx" in line_text.lower() or "todo" in line_text.lower() or "example.com" in line_text.lower()):
                evidence_id = add_evidence(
                    evidence,
                    source_type="privacy_policy_url_placeholder",
                    source_ref=relative,
                    observed_key="privacy_policy.placeholder",
                    observed_value=line_text.strip()[:240],
                    parser="privacy_key_regex",
                    line_start=line_number,
                    confidence=0.85,
                )
                third_party_or_placeholder.append({
                    "url": "",
                    "source_ref": relative,
                    "reason": "placeholder_or_todo",
                    "evidence_refs": [evidence_id],
                    "reachability": "not_checked",
                })
        for match in PRIVACY_URL_RE.finditer(text):
            url = match.group(0).rstrip(".,;")
            line = text[:match.start()].count("\n") + 1
            line_text = text.splitlines()[line - 1] if line - 1 < len(text.splitlines()) else ""
            third_party_candidate = bool(re.search(r"huawei|consumerprivacy|authentication|sdk|provider", line_text, re.IGNORECASE))
            evidence_id = add_evidence(
                evidence,
                source_type="privacy_policy_url_candidate" if third_party_candidate else "privacy_policy_url",
                source_ref=relative,
                observed_key="privacy_policy.url",
                observed_value=url,
                parser="url_regex",
                line_start=line,
                confidence=0.9,
            )
            target = third_party_or_placeholder if third_party_candidate else matches
            target.append({
                "url": url,
                "source_ref": relative,
                "reason": "third_party_policy_candidate" if third_party_candidate else "app_policy_candidate",
                "evidence_refs": [evidence_id],
                "reachability": "not_checked",
            })
            if len(matches) >= 5:
                break
        if len(matches) >= 5:
            break
    if matches:
        return {
            "status": "observed_in_repo",
            "answer_state": "url_observed_content_needs_human_review",
            "review_status": NEED_HUMAN,
            "urls": matches,
            "rejected_or_placeholder_urls": third_party_or_placeholder,
            "human_review_required": True,
        }
    return {
        "status": "blocked",
        "answer_state": "url_missing_or_only_third_party_placeholder_observed",
        "review_status": NEED_HUMAN,
        "urls": [],
        "rejected_or_placeholder_urls": third_party_or_placeholder,
        "human_review_required": True,
    }


def detect_account_deletion(root: Path, files: list[str], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    account_refs: list[str] = []
    deletion_refs: list[str] = []
    deletion_urls: list[dict[str, Any]] = []
    for relative in interesting_text_files(files):
        if relative.lower().startswith("scripts/"):
            continue
        text = read_text(root / relative)
        if not text:
            continue
        for regex, bucket, source_type, observed_key in (
            (AUTH_RE, account_refs, "account_signal", "account.auth_or_profile"),
            (DELETE_RE, deletion_refs, "account_deletion_signal", "account.deletion_flow"),
        ):
            match = regex.search(text)
            if not match:
                continue
            evidence_id = add_evidence(
                evidence,
                source_type=source_type,
                source_ref=relative,
                observed_key=observed_key,
                observed_value=match.group(0),
                parser="regex_text",
                line_start=text[:match.start()].count("\n") + 1,
                confidence=0.7,
            )
            bucket.append(evidence_id)
        for match in DATA_DELETION_URL_RE.finditer(text):
            line = text[:match.start()].count("\n") + 1
            url = match.group(0).rstrip(".,;")
            evidence_id = add_evidence(
                evidence,
                source_type="data_deletion_url",
                source_ref=relative,
                observed_key="account.data_deletion_url",
                observed_value=url,
                parser="url_regex",
                line_start=line,
                confidence=0.85,
            )
            deletion_refs.append(evidence_id)
            deletion_urls.append({"url": url, "source_ref": relative, "evidence_refs": [evidence_id]})
    account_observed = bool(account_refs)
    deletion_observed = bool(deletion_refs)
    if account_observed and not deletion_observed:
        status = "blocked"
        answer = "account_observed_deletion_missing"
    elif account_observed and deletion_observed:
        status = "observed_in_repo"
        answer = "account_and_deletion_signal_observed_needs_human_review"
    elif deletion_observed:
        status = "observed_in_repo"
        answer = "deletion_signal_observed_account_scope_needs_human_review"
    else:
        status = "not_observed"
        answer = "account_system_not_observed_in_scan_scope"
    return {
        "status": status,
        "answer_state": answer,
        "review_status": NEED_HUMAN,
        "account_observed": account_observed,
        "deletion_flow_observed": deletion_observed,
        "data_deletion_urls": deletion_urls,
        "account_evidence_refs": account_refs[:20],
        "deletion_evidence_refs": deletion_refs[:20],
        "human_review_required": True,
    }


def detect_children_sensitive_risks(root: Path, files: list[str], evidence: list[dict[str, Any]], data_flows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    risks: list[dict[str, Any]] = []
    for relative in interesting_text_files(files):
        if relative.lower().startswith("scripts/"):
            continue
        text = read_text(root / relative)
        if not text:
            continue
        match = CHILD_RE.search(text)
        if match:
            evidence_id = add_evidence(
                evidence,
                source_type="children_risk_signal",
                source_ref=relative,
                observed_key="children_or_age_signal",
                observed_value=match.group(0),
                parser="regex_text",
                line_start=text[:match.start()].count("\n") + 1,
                confidence=0.65,
            )
            risks.append({
                "risk_id": f"children_risk.{len(risks) + 1:04d}",
                "risk_type": "children_or_age_signal",
                "status": "needs_human",
                "review_status": NEED_HUMAN,
                "source_ref": relative,
                "evidence_refs": [evidence_id],
                "human_review_required": True,
            })
            if len(risks) >= 20:
                break
    sensitive_categories = sorted({flow["data_category"] for flow in data_flows if flow.get("sensitive")})
    for category in sensitive_categories:
        refs = [ref for flow in data_flows if flow["data_category"] == category for ref in flow["evidence_refs"]][:5]
        risks.append({
            "risk_id": f"sensitive_data.{category.lower().replace(' ', '_')}",
            "risk_type": "sensitive_data_category",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "data_category": category,
            "evidence_refs": refs,
            "human_review_required": True,
        })
    return risks


def disclosure_matrix(
    sdk_inventory: list[dict[str, Any]],
    permission_inventory: list[dict[str, Any]],
    data_flows: list[dict[str, Any]],
    privacy_policy: dict[str, Any],
    account_deletion: dict[str, Any],
    risks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    third_party = [item for item in sdk_inventory if item.get("third_party")]
    tracking = [
        item for item in sdk_inventory
        if "tracking" in str(item.get("risk", "")) or item.get("category") in {"ads", "attribution"}
    ] + [flow for flow in data_flows if flow.get("used_for_tracking") == "candidate_inferred"]
    identity = [flow for flow in data_flows if flow.get("linked_to_identity") == "yes_observed"]
    return [
        {"question": "使用了哪些 SDK", "status": "observed_in_repo" if sdk_inventory else "blocked", "review_status": NEED_HUMAN, "summary": f"发现 {len(sdk_inventory)} 个 SDK/依赖候选。"},
        {"question": "收集哪些用户数据", "status": "observed_in_repo" if data_flows or permission_inventory else "not_observed", "review_status": NEED_HUMAN, "summary": f"发现 {len(data_flows)} 条数据流信号、{len(permission_inventory)} 条权限信号。"},
        {"question": "是否关联身份", "status": "inferred" if identity else "not_observed", "review_status": NEED_HUMAN, "summary": f"身份关联候选 {len(identity)} 条。"},
        {"question": "是否用于追踪", "status": "needs_human" if tracking else "not_observed", "review_status": NEED_HUMAN, "summary": f"追踪候选 {len(tracking)} 条。"},
        {"question": "是否与第三方共享", "status": "needs_human" if third_party else "not_observed", "review_status": NEED_HUMAN, "summary": f"第三方 SDK/共享候选 {len(third_party)} 个。"},
        {"question": "是否有账号删除流程", "status": account_deletion["status"], "review_status": NEED_HUMAN, "summary": account_deletion["answer_state"]},
        {"question": "是否有隐私政策 URL", "status": privacy_policy["status"], "review_status": NEED_HUMAN, "summary": privacy_policy["answer_state"]},
        {"question": "是否有儿童/敏感数据风险", "status": "needs_human" if risks else "not_observed", "review_status": NEED_HUMAN, "summary": f"风险信号 {len(risks)} 条。"},
    ]


def build_claims(
    evidence: list[dict[str, Any]],
    sdk_inventory: list[dict[str, Any]],
    permission_inventory: list[dict[str, Any]],
    data_flows: list[dict[str, Any]],
    privacy_policy: dict[str, Any],
    account_deletion: dict[str, Any],
    risks: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    claims: list[dict[str, Any]] = []
    scan_refs = [evidence[0]["evidence_id"]] if evidence else []
    add_claim(
        claims,
        claim_id="privacy.scan_scope.current_repo",
        question="是否完成当前 repo 的隐私证据扫描",
        status="observed_in_repo",
        answer_state="scan_completed",
        claim_class="C0",
        evidence_refs=scan_refs,
        value="扫描器已生成当前 repo 的证据账本。",
        confidence=0.9,
        limitations=["静态扫描不能证明运行时所有分支和生产服务行为。"],
        human_review_required=False,
    )
    add_claim(
        claims,
        claim_id="privacy.sdk_inventory",
        question="使用了哪些 SDK",
        status="observed_in_repo" if sdk_inventory else "blocked",
        answer_state="sdk_candidates_observed" if sdk_inventory else "sdk_inventory_missing",
        claim_class="C1" if sdk_inventory else "C5",
        evidence_refs=[ref for item in sdk_inventory for ref in item.get("evidence_refs", [])][:20] or scan_refs,
        value={"count": len(sdk_inventory), "sdks": [item["name"] for item in sdk_inventory[:30]]},
        confidence=0.85 if sdk_inventory else 0.2,
        limitations=["依赖存在不等于 SDK 一定在运行时收集数据；需结合 release artifact 和 SDK 文档人工确认。"],
    )
    add_claim(
        claims,
        claim_id="privacy.data_collection",
        question="收集哪些用户数据",
        status="observed_in_repo" if data_flows or permission_inventory else "not_observed",
        answer_state="data_signal_observed" if data_flows or permission_inventory else "not_observed_in_scan_scope",
        claim_class="C3",
        evidence_refs=([ref for flow in data_flows for ref in flow.get("evidence_refs", [])][:20]
                       + [ref for item in permission_inventory for ref in item.get("evidence_refs", [])][:10]) or scan_refs,
        value={
            "data_categories": sorted({flow["data_category"] for flow in data_flows} | {item["data_category"] for item in permission_inventory}),
            "flow_count": len(data_flows),
            "permission_count": len(permission_inventory),
        },
        confidence=0.7,
        limitations=["源码字段命中是披露候选，不是最终 Play Console 答案。"],
    )
    identity_refs = [ref for flow in data_flows if flow.get("linked_to_identity") == "yes_observed" for ref in flow.get("evidence_refs", [])][:20]
    add_claim(
        claims,
        claim_id="privacy.identity_linkage",
        question="是否关联身份",
        status="inferred" if identity_refs else "not_observed",
        answer_state="identity_linkage_candidate" if identity_refs else "not_observed_in_scan_scope",
        claim_class="C3",
        evidence_refs=identity_refs or scan_refs,
        value={"identity_linked_flow_count": len(identity_refs)},
        confidence=0.65 if identity_refs else 0.35,
        limitations=["静态扫描不能证明所有数据是否最终关联到身份；需要后端和隐私负责人确认。"],
    )
    tracking_refs = [ref for flow in data_flows if flow.get("used_for_tracking") == "candidate_inferred" for ref in flow.get("evidence_refs", [])]
    tracking_refs += [ref for item in sdk_inventory if item.get("category") in {"ads", "attribution"} for ref in item.get("evidence_refs", [])]
    add_claim(
        claims,
        claim_id="privacy.tracking",
        question="是否用于追踪",
        status="needs_human" if tracking_refs else "not_observed",
        answer_state="tracking_candidate" if tracking_refs else "not_observed_in_scan_scope",
        claim_class="C4",
        evidence_refs=tracking_refs[:20] or scan_refs,
        value={"tracking_candidate_count": len(tracking_refs)},
        confidence=0.7 if tracking_refs else 0.35,
        limitations=["追踪定义依赖 SDK 行为、用户同意、广告标识使用和跨 app 场景，必须人工审核。"],
    )
    third_party_refs = [ref for item in sdk_inventory if item.get("third_party") for ref in item.get("evidence_refs", [])]
    add_claim(
        claims,
        claim_id="privacy.third_party_sharing",
        question="是否与第三方共享",
        status="needs_human" if third_party_refs else "not_observed",
        answer_state="third_party_sdk_candidate" if third_party_refs else "not_observed_in_scan_scope",
        claim_class="C4",
        evidence_refs=third_party_refs[:20] or scan_refs,
        value={"third_party_sdk_count": len([item for item in sdk_inventory if item.get("third_party")])},
        confidence=0.75 if third_party_refs else 0.35,
        limitations=["第三方 SDK 存在通常需要披露审核，但共享目的和数据字段需查 SDK 文档和运行配置。"],
    )
    add_claim(
        claims,
        claim_id="privacy.account_deletion",
        question="是否有账号删除流程",
        status=account_deletion["status"],
        answer_state=account_deletion["answer_state"],
        claim_class="C5" if account_deletion["status"] == "blocked" else "C3",
        evidence_refs=(account_deletion.get("account_evidence_refs", []) + account_deletion.get("deletion_evidence_refs", []))[:20] or scan_refs,
        value=account_deletion,
        confidence=0.75,
        limitations=["删除流程是否覆盖服务端关联数据、备份和保留周期需要人工确认。"],
    )
    add_claim(
        claims,
        claim_id="privacy.policy_url",
        question="是否有隐私政策 URL",
        status=privacy_policy["status"],
        answer_state=privacy_policy["answer_state"],
        claim_class="C5" if privacy_policy["status"] == "blocked" else "C3",
        evidence_refs=[ref for url in privacy_policy.get("urls", []) for ref in url.get("evidence_refs", [])] or scan_refs,
        value=privacy_policy,
        confidence=0.9 if privacy_policy.get("urls") else 0.2,
        limitations=["URL 内容是否覆盖当前 app 和 SDK 行为需要人工审核。"],
    )
    add_claim(
        claims,
        claim_id="privacy.children_sensitive_risk",
        question="是否有儿童/敏感数据风险",
        status="needs_human" if risks else "not_observed",
        answer_state="risk_candidate" if risks else "not_observed_in_scan_scope",
        claim_class="C4",
        evidence_refs=[ref for risk in risks for ref in risk.get("evidence_refs", [])][:20] or scan_refs,
        value={"risk_count": len(risks), "risk_types": sorted({risk.get("risk_type", "") for risk in risks})},
        confidence=0.7 if risks else 0.35,
        limitations=["目标受众、儿童吸引力和敏感数据政策必须人工确认。"],
    )
    return claims


def build_human_gates_and_blockers(claims: list[dict[str, Any]], privacy_policy: dict[str, Any], account_deletion: dict[str, Any], sdk_inventory: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    gates: list[dict[str, Any]] = []
    blockers: list[dict[str, Any]] = []
    for claim in claims:
        if claim.get("human_review_required"):
            gates.append({
                "gate_id": f"human.{claim['claim_id']}",
                "claim_id": claim["claim_id"],
                "reason": claim["question"],
                "status": "needs_human",
                "review_status": NEED_HUMAN,
                "evidence_refs": claim.get("evidence_refs", []),
            })
    if privacy_policy["status"] == "blocked":
        blockers.append({
            "blocker_id": "privacy_policy_url_missing",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "未在扫描范围内发现隐私政策 URL。",
            "unblock_action": "提供公开可访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享和删除流程。",
            "evidence_refs": [],
        })
    if account_deletion["status"] == "blocked":
        blockers.append({
            "blocker_id": "account_deletion_missing",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "扫描到账号/auth/profile 信号，但未发现删除账号流程或 Data deletion URL。",
            "unblock_action": "补齐真实账号删除流程或 Data deletion URL，并确认服务端关联数据删除/保留规则。",
            "evidence_refs": account_deletion.get("account_evidence_refs", []),
        })
    if not sdk_inventory:
        blockers.append({
            "blocker_id": "sdk_inventory_missing",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "未能从 manifest 或源码中生成 SDK/依赖清单。",
            "unblock_action": "确认项目根目录和依赖 manifest 是否正确；对非标准项目提供依赖清单证据。",
            "evidence_refs": [],
        })
    return gates, blockers


def overall_status(blockers: list[dict[str, Any]], gates: list[dict[str, Any]]) -> str:
    if blockers:
        return "blocked"
    if gates:
        return "pass_with_human_review"
    return "pass"


def render_markdown(data: dict[str, Any]) -> str:
    matrix_rows = "\n".join(
        f"| {item['question']} | `{item['status']}` | `{item.get('review_status', NEED_HUMAN)}` | {item['summary']} |"
        for item in data["disclosure_question_matrix"]
    )
    sdk_rows = "\n".join(
        f"| `{item['name']}` | `{item['category']}` | `{item['status']}` | {item.get('third_party') or '无直接第三方名'} | `{item['source_ref']}` |"
        for item in data["sdk_inventory"][:50]
    ) or "| 无 | 无 | 无 | 无 | 无 |"
    permission_rows = "\n".join(
        f"| `{item['permission']}` | {item['data_category']} | {item['data_type']} | `{item['source_ref']}` |"
        for item in data["permission_inventory"][:50]
    ) or "| 无 | 无 | 无 | 无 |"
    flow_rows = "\n".join(
        f"| {flow['data_category']} | {flow['data_type']} | `{flow['sink']}` | `{flow['linked_to_identity']}` | `{flow['used_for_tracking']}` | `{flow['shared_with_third_parties']}` | `{flow['source_ref']}:{flow['line_start']}` |"
        for flow in data["data_flows"][:60]
    ) or "| 扫描范围内未发现 | 无 | 无 | 无 | 无 | 无 | 无 |"
    form_globals = data.get("data_safety_form_draft", {}).get("global_questions", {})
    form_global_rows = "\n".join(
        f"| `{key}` | `{value.get('draft_answer')}` | `{value.get('review_status', NEED_HUMAN)}` | {value.get('reason', '')} |"
        for key, value in form_globals.items()
    ) or "| 无 | 无 | 无 | 无 |"
    form_type_rows = "\n".join(
        f"| {item['category']} | {item['data_type']} | `{item['collected']}` | `{item['shared']}` | `{item['processed_ephemerally']}` | `{item['required_or_optional']}` | {', '.join(item.get('purposes', [])) or NEED_HUMAN} | `{item['review_status']}` |"
        for item in data.get("data_safety_form_draft", {}).get("data_types", [])[:80]
    ) or "| 扫描范围内未形成数据类型草稿 | 无 | 无 | 无 | 无 | 无 | 无 | 无 |"
    blocker_rows = "\n".join(
        f"- `{item['blocker_id']}`：{item['reason']} 解除方式：{item['unblock_action']}"
        for item in data["blockers"]
    ) or "- 无阻塞项；仍需人工审核标记为 `human_review_required` 的 claim。"
    risk_rows = "\n".join(
        f"- `{risk['risk_id']}` / `{risk['risk_type']}` / `{risk['status']}` / evidence={','.join(risk.get('evidence_refs', [])) or '无'}"
        for risk in data["children_sensitive_risks"][:40]
    ) or "- 扫描范围内未发现儿童或敏感数据风险信号；这不等于无风险。"
    privacy_urls = data["privacy_policy"].get("urls", [])
    privacy_text = "\n".join(
        f"- `{item['url']}` 来源 `{item['source_ref']}`，可达性 `{item['reachability']}`"
        for item in privacy_urls
    ) or "- 未发现隐私政策 URL。"
    deletion_urls = data["account_deletion"].get("data_deletion_urls", [])
    deletion_text = "\n".join(
        f"- `{item['url']}` 来源 `{item['source_ref']}`"
        for item in deletion_urls
    ) or "- 未发现 Data deletion URL。"
    platforms = ", ".join(f"`{item['platform']}`" for item in data["detected_platforms"]) or "`unknown`"
    return f"""# privacy-disclosure-prep 隐私披露准备报告

生成时间：`{data['generated_at']}`

## 总状态

- overall_status: `{data['overall_status']}`
- 发现平台：{platforms}
- 非最终声明：本报告不是法律意见，不是 Play Console 最终答案，不证明 Data safety 已正确、完整或可提交。
- 官方口径来源：Google Play Data safety 表单说明 `{OFFICIAL_DATA_SAFETY_URL}`
- NEED_HUMAN 规则：凡是代码不能证明的 Play Console 答案、app 自有隐私政策 URL、删除请求机制、共享/追踪/用途/是否必需，均标记为 `NEED_HUMAN`。

## 扫描范围

- root: `{data['root']}`
- git_commit: `{data['project_fingerprint'].get('git_commit') or 'unknown'}`
- file_discovery_mode: `{data['scan_policy']['file_discovery_mode']}`
- ignored_paths_respected: `{data['scan_policy']['ignored_paths_respected']}`
- scanned/skipped/raw: `{data['scan_policy']['file_count_scanned']}` / `{data['scan_policy']['file_count_skipped']}` / `{data['scan_policy']['raw_file_count']}`

## 披露问题矩阵

| 问题 | 证据状态 | 人工确认 | 摘要 |
| --- | --- | --- | --- |
{matrix_rows}

## Google Play Data safety 填表草稿

该部分按 Google Play Data safety 官方问题组织，只能作为人工填表依据。

### 全局问题

| Play Console 字段 | 草稿答案 | 人工确认 | 说明 |
| --- | --- | --- | --- |
{form_global_rows}

### 数据类型明细

| 数据类别 | Google Play 数据类型 | Collected | Shared | Ephemeral | Required/Optional | 用途候选 | 人工确认 |
| --- | --- | --- | --- | --- | --- | --- | --- |
{form_type_rows}

## SDK 清单

| SDK/依赖 | 分类 | 使用状态 | 第三方 | 来源 |
| --- | --- | --- | --- | --- |
{sdk_rows}

## 权限清单

| 权限 | 数据类别 | 数据类型 | 来源 |
| --- | --- | --- | --- |
{permission_rows}

## 数据流候选

| 数据类别 | 数据类型 | Sink | 关联身份 | 追踪 | 第三方共享 | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
{flow_rows}

## 隐私政策 URL

状态：`{data['privacy_policy']['status']}` / `{data['privacy_policy']['answer_state']}` / `{data['privacy_policy'].get('review_status', NEED_HUMAN)}`

{privacy_text}

## 账号删除流程

状态：`{data['account_deletion']['status']}` / `{data['account_deletion']['answer_state']}` / `{data['account_deletion'].get('review_status', NEED_HUMAN)}`

{deletion_text}

## 儿童和敏感数据风险

{risk_rows}

## 阻塞项

{blocker_rows}

## 人工审核项

- human_review_gates: `{len(data['human_review_gates'])}`
- 人工确认标记值：`NEED_HUMAN`
- 所有 C3/C4/C5 claim 必须由 owner/legal/privacy 人工确认，不能直接用于 Play Console 提交。

## 证据索引

- evidence_count: `{len(data['evidence'])}`
- evidence_jsonl: `{data['output_paths']['evidence_jsonl']}`
- machine_json: `{data['output_paths']['machine_json']}`
- data_safety_markdown: `{data['output_paths']['data_safety_markdown']}`
- data_safety_json: `{data['output_paths']['data_safety_json']}`
- data_safety_csv: `{data['output_paths']['data_safety_csv']}`
- data_safety_play_console_template_csv: `{data['output_paths'].get('data_safety_play_console_template_csv', '未提供官方 CSV 模板，未生成')}`
"""


def build_data_safety_form_artifact(data: dict[str, Any]) -> dict[str, Any]:
    draft = data["data_safety_form_draft"]
    return {
        "schema_version": draft["schema_version"],
        "generated_at": data["generated_at"],
        "root": data["root"],
        "project_fingerprint": data["project_fingerprint"],
        "overall_status": data["overall_status"],
        "official_source": draft["official_source"],
        "review_status": NEED_HUMAN,
        "non_final_notice": draft["non_final_notice"],
        "csv_notice": (
            "Google Play Console 支持从 Data safety 页面导出/导入 CSV，并可下载 sample CSV；"
            "本 CSV 是证据草稿映射，不是官方导出的可直接导入模板。"
        ),
        "global_questions": draft["global_questions"],
        "data_types": draft["data_types"],
        "human_review_items": draft.get("human_review_items", []),
        "blockers": data["blockers"],
        "limitations": data["limitations"],
        "source_reports": {
            "machine_json": data["output_paths"]["machine_json"],
            "evidence_jsonl": data["output_paths"]["evidence_jsonl"],
        },
    }


def render_data_safety_form_markdown(artifact: dict[str, Any]) -> str:
    global_rows = "\n".join(
        f"| `{key}` | `{value.get('draft_answer')}` | `{value.get('review_status', NEED_HUMAN)}` | `{value.get('confidence', 0)}` | {value.get('reason', '需要人工确认。')} | {', '.join(value.get('evidence_refs', [])) or '无'} |"
        for key, value in artifact["global_questions"].items()
    ) or "| 无 | 无 | 无 | 无 | 无 | 无 |"
    data_rows = "\n".join(
        f"| {item['category']} | {item['data_type']} | `{item['collected']}` | `{item['shared']}` | `{item['processed_ephemerally']}` | `{item['required_or_optional']}` | {', '.join(item.get('purposes', [])) or NEED_HUMAN} | `{item.get('linked_to_identity')}` | `{item.get('used_for_tracking')}` | `{item.get('confidence', 0)}` | `{item['review_status']}` | {', '.join(item.get('evidence_refs', [])) or '无'} |"
        for item in artifact.get("data_types", [])[:120]
    ) or "| 扫描范围内未形成数据类型草稿 | 无 | 无 | 无 | 无 | 无 | 无 | 无 | 无 | 无 | 无 | 无 |"
    review_rows = "\n".join(
        f"| `{item['field_path']}` | {item.get('data_category') or '全局问题'} | {item.get('data_type') or '无'} | `{item.get('draft_answer')}` | `{item.get('review_status')}` | `{item.get('confidence', 0)}` | {item.get('reason', '')} |"
        for item in artifact.get("human_review_items", [])[:160]
    ) or "| 无 | 无 | 无 | 无 | 无 | 无 | 无 |"
    blocker_rows = "\n".join(
        f"- `{item['blocker_id']}` / `{item.get('review_status', NEED_HUMAN)}`：{item['reason']} 解除方式：{item['unblock_action']}"
        for item in artifact.get("blockers", [])
    ) or "- 无阻塞项；仍需人工确认所有 `NEED_HUMAN` 字段。"
    return f"""# Google Play Data safety 表单草稿

生成时间：`{artifact['generated_at']}`

## 使用边界

- 官方说明：`{artifact['official_source']}`
- 总状态：`{artifact['overall_status']}`
- 人工确认状态：`{artifact['review_status']}`
- 非最终声明：{artifact['non_final_notice']}
- CSV 说明：{artifact['csv_notice']}

## 全局问题

| Play Console 字段 | 草稿答案 | 人工确认 | 置信度 | 中文解释 | 证据 |
| --- | --- | --- | --- | --- | --- |
{global_rows}

## 逐数据类型草稿

| 数据类别 | Google Play 数据类型 | Collected | Shared | Ephemeral | Required/Optional | 用途候选 | 身份关联 | Tracking | 置信度 | 人工确认 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
{data_rows}

## 人工确认清单

| 字段路径 | 数据类别 | 数据类型 | 草稿答案 | 状态 | 置信度 | 原因 |
| --- | --- | --- | --- | --- | --- | --- |
{review_rows}

## 阻塞项

{blocker_rows}

## 后续填表说明

- `YES_CANDIDATE` 表示仓库证据提示可能为 Yes，不是最终 Yes。
- `NO_NOT_OBSERVED` 表示扫描范围内未发现，不是最终 No。
- `NEED_HUMAN` 表示必须由 app owner、legal 或 privacy 人工确认后再填写 Play Console。
"""


def data_safety_form_csv_rows(artifact: dict[str, Any]) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    notice = artifact.get("csv_notice", "")
    for key, value in artifact.get("global_questions", {}).items():
        rows.append({
            "section": "global_question",
            "field_path": f"global_questions.{key}",
            "play_console_question": key,
            "data_category": "",
            "data_type": "",
            "draft_answer": value.get("draft_answer", ""),
            "response_value": "",
            "review_status": value.get("review_status", NEED_HUMAN),
            "confidence": value.get("confidence", 0),
            "evidence_refs": ";".join(value.get("evidence_refs", [])),
            "notes": value.get("reason", notice),
        })
    for index, row in enumerate(artifact.get("data_types", [])):
        category = row.get("category", "")
        data_type = row.get("data_type", "")
        for field in ("collected", "shared", "processed_ephemerally", "required_or_optional", "purposes", "linked_to_identity", "used_for_tracking"):
            value = row.get(field, "")
            if isinstance(value, list):
                value = ";".join(str(item) for item in value)
            rows.append({
                "section": "data_type",
                "field_path": f"data_types[{index}].{field}",
                "play_console_question": field,
                "data_category": category,
                "data_type": data_type,
                "draft_answer": value,
                "response_value": "",
                "review_status": NEED_HUMAN if field == "purposes" else row.get("review_status", NEED_HUMAN),
                "confidence": row.get("confidence", 0),
                "evidence_refs": ";".join(row.get("evidence_refs", [])),
                "notes": "近似 Play Console CSV 草稿；必须用官方导出的 CSV/sample CSV 对齐后再导入。",
            })
    return rows


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "section",
        "field_path",
        "play_console_question",
        "data_category",
        "data_type",
        "draft_answer",
        "response_value",
        "review_status",
        "confidence",
        "evidence_refs",
        "notes",
    ]
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=fieldnames, lineterminator="\n")
    writer.writeheader()
    writer.writerows(rows)
    path.write_text(buffer.getvalue(), encoding="utf-8")


def read_play_console_csv_template(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = [dict(row) for row in reader]
        fieldnames = list(reader.fieldnames or [])
    return rows, fieldnames


def official_response_id_index(artifact: dict[str, Any]) -> dict[str, dict[str, Any]]:
    index: dict[str, dict[str, Any]] = {}
    for item in artifact.get("data_types", []):
        if not isinstance(item, dict):
            continue
        response_ids = OFFICIAL_DATA_TYPE_RESPONSE_MAP.get((str(item.get("category", "")), str(item.get("data_type", ""))), [])
        for response_id in response_ids:
            index[response_id] = item
    return index


def play_console_template_response_value(
    template_row: dict[str, str],
    artifact: dict[str, Any],
    response_index: dict[str, dict[str, Any]],
) -> str:
    question_id = template_row.get("Question ID (machine readable)", "")
    response_id = template_row.get("Response ID (machine readable)", "")
    globals_ = artifact.get("global_questions", {})

    if question_id == "PSL_DATA_COLLECTION_COLLECTS_PERSONAL_DATA":
        value = globals_.get("does_app_collect_or_share_user_data", {}).get("draft_answer")
        return "TRUE" if value == "YES_CANDIDATE" else ""
    if question_id == "PSL_DATA_COLLECTION_USER_REQUEST_DELETE":
        value = globals_.get("can_users_request_data_deletion", {}).get("draft_answer")
        return "TRUE" if value == "YES_CANDIDATE" else ""
    if question_id == "PSL_DATA_COLLECTION_ENCRYPTED_IN_TRANSIT":
        return ""

    if question_id.startswith("PSL_DATA_TYPES_"):
        item = response_index.get(response_id)
        if not item:
            return ""
        if item.get("collected") == "YES_CANDIDATE" or item.get("shared") == "YES_CANDIDATE":
            return "TRUE"
        return ""

    if not question_id.startswith("PSL_DATA_USAGE_RESPONSES:"):
        return ""
    parts = question_id.split(":")
    if len(parts) < 3:
        return ""
    data_response_id = parts[1]
    usage_question = parts[2]
    item = response_index.get(data_response_id)
    if not item:
        return ""

    if usage_question == "PSL_DATA_USAGE_COLLECTION_AND_SHARING":
        if response_id == "PSL_DATA_USAGE_ONLY_COLLECTED" and item.get("collected") == "YES_CANDIDATE":
            return "TRUE"
        if response_id == "PSL_DATA_USAGE_ONLY_SHARED" and item.get("shared") == "YES_CANDIDATE":
            return "TRUE"
        return ""
    if usage_question == "PSL_DATA_USAGE_EPHEMERAL":
        return ""
    if usage_question == "DATA_USAGE_USER_CONTROL":
        return ""
    if usage_question in {"DATA_USAGE_COLLECTION_PURPOSE", "DATA_USAGE_SHARING_PURPOSE"}:
        if usage_question == "DATA_USAGE_COLLECTION_PURPOSE" and item.get("collected") != "YES_CANDIDATE":
            return ""
        if usage_question == "DATA_USAGE_SHARING_PURPOSE" and item.get("shared") != "YES_CANDIDATE":
            return ""
        purpose_ids = {OFFICIAL_PURPOSE_RESPONSE_MAP.get(purpose) for purpose in item.get("purposes", [])}
        if response_id in purpose_ids:
            return "TRUE"
        return ""
    return ""


def write_play_console_template_csv(template_path: Path, output_path: Path, artifact: dict[str, Any]) -> dict[str, Any]:
    rows, fieldnames = read_play_console_csv_template(template_path)
    if fieldnames != PLAY_CONSOLE_CSV_COLUMNS:
        raise ValueError(f"Unexpected Play Console CSV headers: {fieldnames}")
    response_index = official_response_id_index(artifact)
    generated_rows: list[dict[str, str]] = []
    filled = 0
    for row in rows:
        generated = {column: row.get(column, "") for column in PLAY_CONSOLE_CSV_COLUMNS}
        generated["Response value"] = play_console_template_response_value(generated, artifact, response_index)
        if generated["Response value"]:
            filled += 1
        generated_rows.append(generated)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=PLAY_CONSOLE_CSV_COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(generated_rows)
    return {
        "template_path": as_posix(template_path),
        "output_path": as_posix(output_path),
        "template_row_count": len(rows),
        "response_value_filled_count": filled,
        "headers": fieldnames,
        "review_status": NEED_HUMAN,
        "notes": [
            "输出文件保持官方 CSV 的列和行结构，并清空了模板示例答案后重新写入当前 app 的候选答案。",
            "空白 Response value 表示当前静态证据无法安全填写，必须人工确认。",
            "即使 Response value 已填 TRUE，也只是候选草稿，导入 Play Console 前必须人工审核。",
        ],
    }


def write_evidence_jsonl(path: Path, evidence: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(item, ensure_ascii=False, sort_keys=True) for item in evidence]
    path.write_text("\n".join(lines) + ("\n" if lines else ""), encoding="utf-8")


def generate(
    root: Path,
    output_dir: Path,
    backend_log_samples: list[str],
    play_console_csv_template: str = "",
) -> dict[str, Any]:
    files, scan_policy = visible_files(root)
    evidence: list[dict[str, Any]] = []
    scan_evidence = add_evidence(
        evidence,
        source_type="scan_policy",
        source_ref=".",
        observed_key="scan.files",
        observed_value={
            "file_discovery_mode": scan_policy["file_discovery_mode"],
            "file_count_scanned": scan_policy["file_count_scanned"],
            "ignored_paths_respected": scan_policy["ignored_paths_respected"],
        },
        parser="privacy_scan.py",
        confidence=1.0,
    )
    registry = load_sdk_registry()
    platforms = detect_platforms(root, files, evidence)
    sdk_inventory = collect_package_dependencies(root, files, evidence, registry)
    sdk_inventory.extend(collect_gradle_and_pods(root, files, evidence, registry))
    update_sdk_usage(root, files, sdk_inventory, evidence, registry)
    permission_inventory = collect_permissions(root, files, evidence)
    data_flows = collect_data_flows(root, files, evidence, sdk_inventory)
    data_flows.extend(collect_backend_log_flows(root, backend_log_samples, set(files), evidence))
    privacy_policy = detect_privacy_policy(root, files, evidence)
    account_deletion = detect_account_deletion(root, files, evidence)
    risks = detect_children_sensitive_risks(root, files, evidence, data_flows)
    data_safety_form_draft = build_data_safety_form_draft(
        sdk_inventory,
        permission_inventory,
        data_flows,
        privacy_policy,
        account_deletion,
        risks,
    )
    matrix = disclosure_matrix(sdk_inventory, permission_inventory, data_flows, privacy_policy, account_deletion, risks)
    claims = build_claims(evidence, sdk_inventory, permission_inventory, data_flows, privacy_policy, account_deletion, risks)
    human_gates, blockers = build_human_gates_and_blockers(claims, privacy_policy, account_deletion, sdk_inventory)
    machine_path = output_dir / "privacy-disclosure-prep-output.json"
    human_path = output_dir / "privacy-disclosure-prep.zh.md"
    evidence_path = output_dir / "privacy-disclosure-prep-evidence.jsonl"
    data_safety_json_path = output_dir / "data-safety-form-draft.json"
    data_safety_markdown_path = output_dir / "data-safety-form-draft.zh.md"
    data_safety_csv_path = output_dir / "data-safety-form-draft.csv"
    play_console_template_path: Path | None = None
    play_console_output_path: Path | None = None
    if play_console_csv_template:
        play_console_template_path = Path(play_console_csv_template)
        if not play_console_template_path.is_absolute():
            play_console_template_path = root / play_console_template_path
        play_console_template_path = play_console_template_path.resolve()
        if not play_console_template_path.is_file():
            raise FileNotFoundError(f"Play Console CSV template not found: {play_console_template_path}")
        play_console_output_path = output_dir / "data-safety-form-draft.play-console-template.csv"
    output_paths = {
        "machine_json": as_posix(machine_path),
        "human_markdown": as_posix(human_path),
        "evidence_jsonl": as_posix(evidence_path),
        "data_safety_json": as_posix(data_safety_json_path),
        "data_safety_markdown": as_posix(data_safety_markdown_path),
        "data_safety_csv": as_posix(data_safety_csv_path),
    }
    if play_console_output_path:
        output_paths["data_safety_play_console_template_csv"] = as_posix(play_console_output_path)
    data: dict[str, Any] = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "root": str(root),
        "scan_policy": scan_policy,
        "project_fingerprint": {
            "git_commit": git_commit(root),
            "skill_path": as_posix(SKILL_DIR / "SKILL.md"),
            "skill_scanner": as_posix(Path(__file__).resolve()),
        },
        "overall_status": "",
        "detected_platforms": platforms,
        "disclosure_question_matrix": matrix,
        "sdk_inventory": sdk_inventory,
        "permission_inventory": permission_inventory,
        "data_flows": data_flows,
        "data_safety_form_draft": data_safety_form_draft,
        "privacy_policy": privacy_policy,
        "account_deletion": account_deletion,
        "children_sensitive_risks": risks,
        "claims": claims,
        "evidence": evidence,
        "human_review_gates": human_gates,
        "blockers": blockers,
        "limitations": [
            "静态扫描不能证明生产运行时所有数据行为。",
            "第三方 SDK 的实际数据处理需结合 SDK 文档、控制台配置、release artifact 和人工审核。",
            "`not_observed` 只表示扫描范围内未发现，不能解释为不存在或不收集。",
        ],
        "output_paths": output_paths,
    }
    data["overall_status"] = overall_status(blockers, human_gates)
    data_safety_artifact = build_data_safety_form_artifact(data)
    if play_console_template_path and play_console_output_path:
        template_summary = write_play_console_template_csv(play_console_template_path, play_console_output_path, data_safety_artifact)
        data_safety_artifact["official_template_csv"] = template_summary
        data["data_safety_form_draft"]["official_template_csv"] = template_summary
    write_json(machine_path, data)
    write_text(human_path, render_markdown(data))
    write_json(data_safety_json_path, data_safety_artifact)
    write_text(data_safety_markdown_path, render_data_safety_form_markdown(data_safety_artifact))
    write_csv(data_safety_csv_path, data_safety_form_csv_rows(data_safety_artifact))
    write_evidence_jsonl(evidence_path, evidence)
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="生成 Google Play 隐私披露准备证据。")
    parser.add_argument("--root", default=".", help="目标 app 项目根目录")
    parser.add_argument("--output-dir", default=DEFAULT_OUTPUT_DIR, help="报告输出目录")
    parser.add_argument(
        "--backend-log-sample",
        action="append",
        default=[],
        help="可选：已脱敏、未被 .gitignore 忽略的后端日志样本路径，可重复提供",
    )
    parser.add_argument(
        "--play-console-csv-template",
        default="",
        help="可选：Google Play Console Data safety 官方 sample/export CSV，用于生成同列同结构的官方模板草稿 CSV",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = root / output_dir
    data = generate(
        root,
        output_dir.resolve(),
        [as_posix(item) for item in args.backend_log_sample],
        args.play_console_csv_template,
    )
    print(f"overall_status={data['overall_status']}")
    print(f"sdk_count={len(data['sdk_inventory'])}")
    print(f"data_flow_count={len(data['data_flows'])}")
    print(f"human_review_gates={len(data['human_review_gates'])}")
    print(f"blockers={len(data['blockers'])}")
    print(f"human_report={data['output_paths']['human_markdown']}")
    print(f"machine_report={data['output_paths']['machine_json']}")
    print(f"evidence_jsonl={data['output_paths']['evidence_jsonl']}")
    print(f"data_safety_markdown={data['output_paths']['data_safety_markdown']}")
    print(f"data_safety_json={data['output_paths']['data_safety_json']}")
    print(f"data_safety_csv={data['output_paths']['data_safety_csv']}")
    if "data_safety_play_console_template_csv" in data["output_paths"]:
        print(f"data_safety_play_console_template_csv={data['output_paths']['data_safety_play_console_template_csv']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
