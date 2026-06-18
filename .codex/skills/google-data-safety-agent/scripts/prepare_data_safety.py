#!/usr/bin/env python3
"""Prepare evidence-bound Google Play Data safety draft materials."""

from __future__ import annotations

import argparse
import csv
import io
import json
import os
import re
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any


SCHEMA_VERSION = "google_data_safety_agent_output.v1"
SOURCE_SCHEMA_VERSION = "google_data_safety_source_of_truth.v1"
REPORT_FILENAMES = {
    "human": "google-data-safety-agent.zh.md",
    "machine": "google-data-safety-agent-output.json",
    "source": "google-data-safety-source-of-truth.json",
    "evidence": "google-data-safety-evidence.jsonl",
    "csv": "google-data-safety-form-draft.csv",
}
IGNORED_SCAN_PARTS = {
    ".codex",
    ".git",
    ".hg",
    ".svn",
    ".idea",
    ".gradle",
    ".dart_tool",
    ".expo",
    ".next",
    ".nuxt",
    ".turbo",
    "__pycache__",
    "artifacts",
    "build",
    "dist",
    "node_modules",
    "output",
    "play-store-launch",
    "tmp",
    "uni_modules",
    "Pods",
    "DerivedData",
}
IGNORED_SCAN_PREFIXES = (
    "data/real-content/",
    "docs/",
    "domains/",
    "fixtures/",
    "runtime/",
    "ops/intake/",
)
TEXT_EXTENSIONS = {".js", ".mjs", ".cjs", ".ts", ".tsx", ".vue", ".json", ".xml", ".yaml", ".yml", ".kt", ".java", ".swift"}
MAX_TEXT_BYTES = 220_000
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")
PRIVACY_URL = re.compile(r"https?://[^\s)>\]]*privacy[^\s)>\]]*", re.I)
URL = re.compile(r"^https?://[^\s\"'<>]+$", re.I)
PLACEHOLDER_VALUES = {"", "NEED_HUMAN", "TODO", "TBD", "N/A", "NA", "UNKNOWN", "未确认", "待确认"}
OWNER_INPUT_PATHS = (
    "play-store-launch/inputs/privacy-data-safety-owner-input.json",
    "play-store-launch/inputs/google-data-safety-owner-input.json",
    "play-store-launch/inputs/google-play-listing.json",
)
DATA_TYPE_OWNER_FIELDS = {
    "collected": ("collected", "isCollected"),
    "shared": ("shared", "isShared"),
    "processed_ephemerally": ("processed_ephemerally", "processedEphemerally"),
    "required_or_optional": ("required_or_optional", "requiredOrOptional"),
    "purposes": ("purposes", "purpose"),
    "linked_to_identity": ("linked_to_identity", "linkedToIdentity"),
    "used_for_tracking": ("used_for_tracking", "usedForTracking"),
}

SDK_HINTS = {
    "analytics": ("analytics", "amplitude", "segment", "mixpanel", "posthog", "firebase-analytics", "google-analytics", "umeng", "event"),
    "ads": ("admob", "advertising", "applovin", "ironsource", "unity-ads", "facebook-ads", "idfa", "aaid"),
    "crash_reporting": ("sentry", "crashlytics", "bugsnag", "rollbar"),
    "payment": ("stripe", "revenuecat", "purchases", "billing", "unipay", "alipay", "wechatpay", "paypal", "payment"),
    "push": ("expo-notifications", "firebase-messaging", "push", "jpush", "notification"),
    "auth": ("auth0", "firebase-auth", "uni-id", "oauth", "login", "openid"),
    "cloud_backend": ("supabase", "firebase", "unicloud", "aws", "aliyun", "cloud"),
    "social_login": ("facebook", "google", "apple", "weixin", "wechat", "qq", "huawei", "alipay"),
}

DATA_SIGNALS = [
    {
        "category": "Personal info",
        "data_type": "User IDs",
        "patterns": (r"user[_-]?id", r"\buid\b", r"openid", r"unionid", r"uni-id-users", r"user_profiles?", r"account"),
        "purposes": ["Account management", "App functionality"],
        "linked_to_identity": "YES_CANDIDATE",
    },
    {
        "category": "Personal info",
        "data_type": "Name",
        "patterns": (r"user[_-]?name", r"nickname", r"realname", r"real[_-]?name", r"profile[_-]?name", r"姓名", r"昵称"),
        "purposes": ["Account management"],
        "linked_to_identity": "YES_CANDIDATE",
    },
    {
        "category": "Personal info",
        "data_type": "Email address",
        "patterns": (r"\bemail\b", r"mail_address", r"邮箱"),
        "purposes": ["Account management"],
        "linked_to_identity": "YES_CANDIDATE",
    },
    {
        "category": "Personal info",
        "data_type": "Phone number",
        "patterns": (r"phone", r"mobile[_-]?phone", r"phone[_-]?number", r"sms", r"手机号", r"电话"),
        "purposes": ["Account management", "Fraud prevention, security, and compliance"],
        "linked_to_identity": "YES_CANDIDATE",
    },
    {
        "category": "Personal info",
        "data_type": "Address",
        "patterns": (r"address_line", r"shipping[_-]?address", r"postal[_-]?address", r"street[_-]?address", r"收货地址"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Financial info",
        "data_type": "Purchase history",
        "patterns": (r"payment_orders?", r"subscription_records?", r"purchase", r"billing", r"entitlement", r"pricing", r"订单", r"订阅", r"支付"),
        "purposes": ["App functionality", "Payments"],
        "linked_to_identity": "YES_CANDIDATE",
    },
    {
        "category": "Photos and videos",
        "data_type": "Photos or videos",
        "patterns": (r"avatar", r"user[_-]?photo", r"profile[_-]?image", r"photo[_-]?upload", r"image[_-]?upload", r"cropimage", r"图片上传", r"照片"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Files and docs",
        "data_type": "Files and docs",
        "patterns": (r"file[_-]?upload", r"uploaded[_-]?files?", r"attachment", r"document[_-]?upload", r"\bpdf\b", r"文件上传", r"附件"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "App activity",
        "data_type": "App interactions",
        "patterns": (r"event_logs?", r"event_metrics?", r"analytics", r"experiment", r"metrics", r"user_content_state", r"reading", r"follows?", r"interaction", r"埋点", r"指标"),
        "purposes": ["Analytics", "App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "App info and performance",
        "data_type": "Crash logs",
        "patterns": (r"crash", r"exception", r"error[_-]?log", r"sentry", r"crashlytics"),
        "purposes": ["Analytics", "App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "App info and performance",
        "data_type": "Diagnostics",
        "patterns": (r"diagnostic", r"audit_logs?", r"performance", r"healthcheck", r"device-diagnostics", r"trace"),
        "purposes": ["Analytics", "App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Device or other IDs",
        "data_type": "Device or other IDs",
        "patterns": (r"device[_-]?id", r"device_installations?", r"\bcid\b", r"push[_-]?cid", r"installation", r"identifier", r"idfa", r"aaid"),
        "purposes": ["App functionality", "Fraud prevention, security, and compliance"],
        "linked_to_identity": "NEED_HUMAN",
        "tracking": "YES_CANDIDATE",
    },
    {
        "category": "Messages",
        "data_type": "Other in-app messages",
        "patterns": (r"message", r"notification_inbox", r"inbox", r"comment", r"chat", r"消息", r"通知"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Location",
        "data_type": "Approximate or precise location",
        "patterns": (r"geolocation", r"latitude", r"longitude", r"\bgps\b", r"location_permission", r"定位权限"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Contacts",
        "data_type": "Contacts",
        "patterns": (r"contacts?", r"address_book", r"通讯录"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Calendar",
        "data_type": "Calendar events",
        "patterns": (r"calendar", r"calendar_event", r"日历"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Web browsing",
        "data_type": "Web browsing history",
        "patterns": (r"browser_history", r"browsing_history", r"url_history", r"visited_urls?", r"浏览记录"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
    {
        "category": "Health and fitness",
        "data_type": "Health info or fitness info",
        "patterns": (r"health_info", r"fitness", r"medical", r"heart_rate", r"健康数据", r"健身数据"),
        "purposes": ["App functionality"],
        "linked_to_identity": "NEED_HUMAN",
    },
]

ACCOUNT_PATTERNS = (r"\bauth\b", r"login", r"sign[-_ ]?in", r"register", r"account", r"profile", r"uni-id", r"logout", r"登录", r"注册", r"账号", r"账户")
DELETE_PATTERNS = (r"delete[-_ ]?account", r"close[-_ ]?account", r"deactivate", r"注销", r"删除账号")
ANALYTICS_PATTERNS = (r"analytics", r"event_logs?", r"event_metrics?", r"experiment", r"metrics", r"埋点")
PAYMENT_PATTERNS = (r"payment", r"billing", r"subscription", r"purchase", r"pricing", r"entitlement", r"unipay", r"stripe", r"alipay", r"订阅", r"支付")
CRASH_PATTERNS = (r"crashlytics", r"\bcrash\b", r"\bsentry\b", r"\bbugsnag\b", r"\brollbar\b", r"error[_-]?log")
AD_PATTERNS = (r"admob", r"advertising[_-]?id", r"advertising[_-]?sdk", r"idfa", r"aaid", r"applovin", r"ironsource")
CHILDREN_PATTERNS = (r"target[_-]?audience.*children", r"child[_-]?directed", r"kids", r"families", r"under\s*13", r"儿童模式", r"面向儿童")


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def rel(root: Path, path: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8-sig", errors="replace")
    except OSError:
        return ""


def load_json(path: Path) -> Any:
    if not path.exists() or not path.is_file():
        return None
    try:
        return json.loads(read_text(path))
    except json.JSONDecodeError:
        return None


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def compact(value: str, limit: int = 220) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value if len(value) <= limit else value[: limit - 3].rstrip() + "..."


def unique(values: list[str]) -> list[str]:
    output = []
    seen: set[str] = set()
    for value in values:
        normalized = re.sub(r"\s+", " ", str(value)).strip()
        if not normalized:
            continue
        key = normalized.casefold()
        if key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


def is_placeholder(value: Any) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        normalized = value.strip()
        return normalized.upper() in PLACEHOLDER_VALUES
    return False


def is_real_text(value: Any) -> bool:
    return isinstance(value, str) and not is_placeholder(value)


def normalize_owner_answer(value: Any) -> Any:
    if is_placeholder(value):
        return "NEED_HUMAN"
    if isinstance(value, bool):
        return "YES_OWNER_CONFIRMED" if value else "NO_OWNER_CONFIRMED"
    if isinstance(value, str):
        normalized = value.strip()
        lowered = normalized.lower()
        if lowered in {"yes", "true", "y"}:
            return "YES_OWNER_CONFIRMED"
        if lowered in {"no", "false", "n"}:
            return "NO_OWNER_CONFIRMED"
        return normalized
    return value


def first_value(data: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for key in keys:
        if key in data:
            return data.get(key)
    return None


def load_owner_inputs(root: Path, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    for relative in OWNER_INPUT_PATHS:
        path = root / relative
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        ev_id = evidence_add(
            evidence,
            root,
            "owner_data_safety_input",
            path,
            {
                "schema_version": data.get("schema_version"),
                "status": data.get("status"),
                "keys": sorted(str(key) for key in data.keys()),
            },
            note="Owner-provided launch/privacy/Data safety input.",
        )
        files.append({"source": rel(root, path), "data": data, "evidence_id": ev_id})
    return {
        "status": "observed" if files else "missing",
        "files": files,
        "evidence_ids": [item["evidence_id"] for item in files],
    }


def owner_input_value(owner_inputs: dict[str, Any], keys: tuple[str, ...]) -> Any:
    for item in owner_inputs.get("files", []):
        data = item.get("data")
        if not isinstance(data, dict):
            continue
        value = first_value(data, keys)
        if value is not None:
            return value
    return None


def owner_privacy_url(owner_inputs: dict[str, Any]) -> str:
    value = owner_input_value(owner_inputs, ("privacyPolicyUrl", "privacy_policy_url", "privacy_policy"))
    if is_real_text(value) and URL.match(str(value).strip()):
        return str(value).strip()
    return ""


def owner_data_type_index(owner_inputs: dict[str, Any]) -> dict[tuple[str, str], dict[str, Any]]:
    indexed: dict[tuple[str, str], dict[str, Any]] = {}
    for item in owner_inputs.get("files", []):
        data = item.get("data")
        if not isinstance(data, dict):
            continue
        rows = data.get("dataTypes") or data.get("data_types") or []
        if not isinstance(rows, list):
            continue
        for row in rows:
            if not isinstance(row, dict):
                continue
            category = str(row.get("category") or "").strip()
            data_type = str(row.get("data_type") or row.get("dataType") or "").strip()
            if not category or not data_type:
                continue
            indexed[(category.casefold(), data_type.casefold())] = {
                "row": row,
                "source": item.get("source"),
                "evidence_id": item.get("evidence_id"),
            }
    return indexed


def evidence_add(evidence: list[dict[str, Any]], root: Path, field: str, source: str | Path, value: Any, *, status: str = "observed", note: str = "") -> str:
    source_text = rel(root, source) if isinstance(source, Path) else source
    if isinstance(value, (dict, list)):
        excerpt = json.dumps(value, ensure_ascii=False)
    else:
        excerpt = "" if value is None else str(value)
    row_id = f"ev_{len(evidence) + 1:04d}"
    evidence.append(
        {
            "id": row_id,
            "field": field,
            "source": source_text,
            "status": status,
            "excerpt": compact(excerpt, 360),
            "note": note,
        }
    )
    return row_id


def run_git_ls_files(root: Path) -> list[Path]:
    try:
        completed = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root,
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=25,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
    if completed.returncode != 0:
        return []
    return [(root / line).resolve() for line in completed.stdout.splitlines() if (root / line).is_file()]


def should_scan_file(root: Path, path: Path) -> bool:
    relative = rel(root, path)
    normalized = relative.replace("\\", "/")
    parts = PurePosixPath(relative).parts
    if any(part in IGNORED_SCAN_PARTS for part in parts):
        return False
    if any(normalized.startswith(prefix) for prefix in IGNORED_SCAN_PREFIXES):
        return False
    if path.suffix.lower() not in TEXT_EXTENSIONS:
        return False
    try:
        if path.stat().st_size > MAX_TEXT_BYTES:
            return False
    except OSError:
        return False
    return True


def iter_project_files(root: Path) -> list[Path]:
    tracked = run_git_ls_files(root)
    if tracked:
        return [path for path in tracked if should_scan_file(root, path)]
    files = []
    for current, dirs, names in os.walk(root):
        dirs[:] = [name for name in dirs if name not in IGNORED_SCAN_PARTS]
        for name in names:
            path = Path(current) / name
            if should_scan_file(root, path):
                files.append(path)
    return files


def data_safety_files(root: Path, project_files: list[Path]) -> list[Path]:
    allowed_prefixes = (
        "android/",
        "ios/",
        "app/",
        "src/",
        "lib/",
        "server/",
        "backend/surfaces/",
        "database/",
        "uniCloud/database/",
        "mobile/services/",
        "mobile/pages/",
        "mobile/uniCloud-aliyun/cloudfunctions/",
    )
    allowed_exact = {"app.json", "package.json", "mobile/pages.json", "mobile/manifest.json"}
    excluded_parts = {"fixtures", "test", "tests", "generated", "pages-generated"}
    output = []
    for path in project_files:
        relative = rel(root, path).replace("\\", "/")
        parts = set(PurePosixPath(relative).parts)
        if relative in allowed_exact or relative.startswith(allowed_prefixes):
            if parts.intersection(excluded_parts):
                continue
            output.append(path)
    return output


def parse_android_manifest(root: Path, path: Path) -> dict[str, Any] | None:
    try:
        manifest = ET.fromstring(read_text(path))
    except ET.ParseError:
        return None
    namespace = "{http://schemas.android.com/apk/res/android}"
    permissions = [item.attrib.get(namespace + "name") for item in manifest.findall("uses-permission")]
    return {"source": rel(root, path), "permissions": [item for item in permissions if item]}


def collect_permissions(root: Path, project_files: list[Path], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for path in project_files:
        if path.name != "AndroidManifest.xml":
            continue
        parsed = parse_android_manifest(root, path)
        if parsed and parsed["permissions"]:
            ev_id = evidence_add(evidence, root, "app_permissions", path, parsed["permissions"], note="Android manifest permissions。")
            rows.append({"source": parsed["source"], "permissions": parsed["permissions"], "evidence_id": ev_id})
    return rows


def package_dependencies(root: Path) -> dict[str, str]:
    data = load_json(root / "package.json")
    deps: dict[str, str] = {}
    if isinstance(data, dict):
        for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
            if isinstance(data.get(key), dict):
                deps.update({str(name): str(version) for name, version in data[key].items()})
    return deps


def collect_sdk_inventory(root: Path, project_files: list[Path], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    deps = package_dependencies(root)
    uni_modules = []
    uni_dir = root / "mobile" / "uni_modules"
    if uni_dir.exists():
        uni_modules = [path.name for path in uni_dir.iterdir() if path.is_dir()]
    rows = []
    for sdk_type, hints in SDK_HINTS.items():
        dep_matches = [name for name in deps if any(hint.casefold() in name.casefold() for hint in hints)]
        path_matches = []
        if sdk_type in {"auth", "push", "payment", "social_login", "cloud_backend"} and uni_modules:
            path_matches.extend(f"mobile/uni_modules/{name}" for name in uni_modules if any(hint.casefold() in name.casefold() for hint in hints))
        path_matches = unique(path_matches)[:12]
        if not dep_matches and not path_matches:
            continue
        ev_id = evidence_add(
            evidence,
            root,
            "sdk_list",
            "package.json" if dep_matches else path_matches[0],
            {"sdk_type": sdk_type, "dependencies": dep_matches, "paths": path_matches[:8]},
            status="inferred",
            note="SDK/服务候选。",
        )
        rows.append({"sdk_type": sdk_type, "dependencies": dep_matches, "paths": path_matches[:8], "evidence_id": ev_id})
    return rows


def scan_patterns(root: Path, project_files: list[Path], patterns: tuple[str, ...], *, max_hits: int = 24) -> list[dict[str, str]]:
    compiled = [re.compile(pattern, flags=re.I) for pattern in patterns]
    hits = []
    for path in project_files:
        relative = rel(root, path)
        path_hit = next((pattern.pattern for pattern in compiled if pattern.search(relative.replace("\\", "/"))), None)
        if path_hit:
            hits.append({"source": relative, "where": "path", "matched": path_hit})
            if len(hits) >= max_hits:
                break
            continue
        text = read_text(path)
        matcher = next((pattern for pattern in compiled if pattern.search(text)), None)
        if matcher:
            match = matcher.search(text)
            excerpt = compact(text[max(0, match.start() - 80) : match.end() + 80]) if match else ""
            hits.append({"source": relative, "where": "content", "matched": matcher.pattern, "excerpt": excerpt})
            if len(hits) >= max_hits:
                break
    return hits


def collect_signal_group(root: Path, project_files: list[Path], evidence: list[dict[str, Any]], field: str, patterns: tuple[str, ...], note: str) -> dict[str, Any]:
    hits = scan_patterns(root, project_files, patterns)
    if not hits:
        return {"status": "missing", "hits": [], "evidence_ids": [], "reason": "未发现相关证据。"}
    ev_id = evidence_add(evidence, root, field, hits[0]["source"], hits[:10], status="inferred", note=note)
    return {"status": "inferred", "hits": hits[:16], "evidence_ids": [ev_id], "reason": "发现相关实现或数据结构信号。"}


def collect_data_types(root: Path, project_files: list[Path], sdk_inventory: list[dict[str, Any]], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    sdk_types = {item["sdk_type"] for item in sdk_inventory}
    has_external_sdk = bool(sdk_inventory)
    has_ads_or_analytics = bool({"ads", "analytics"}.intersection(sdk_types))
    for spec in DATA_SIGNALS:
        hits = scan_patterns(root, project_files, spec["patterns"], max_hits=16)
        if not hits:
            continue
        ev_id = evidence_add(evidence, root, "data_type", hits[0]["source"], {"category": spec["category"], "data_type": spec["data_type"], "hits": hits[:8]}, status="inferred", note="Data safety 数据类型候选。")
        tracking = spec.get("tracking", "NO_NOT_OBSERVED")
        if spec["category"] in {"Device or other IDs", "App activity"} and has_ads_or_analytics:
            tracking = "YES_CANDIDATE"
        shared = "NEED_HUMAN" if has_external_sdk else "NO_NOT_OBSERVED"
        rows.append(
            {
                "category": spec["category"],
                "data_type": spec["data_type"],
                "collected": "YES_CANDIDATE",
                "shared": shared,
                "processed_ephemerally": "NEED_HUMAN",
                "required_or_optional": "NEED_HUMAN",
                "purposes": spec["purposes"],
                "linked_to_identity": spec.get("linked_to_identity", "NEED_HUMAN"),
                "used_for_tracking": tracking,
                "human_review": "NEED_HUMAN",
                "confidence": 0.65,
                "evidence_ids": [ev_id],
                "signals": hits[:10],
            }
        )
    return rows


def collect_privacy_policy(root: Path, project_files: list[Path], evidence: list[dict[str, Any]], owner_inputs: dict[str, Any]) -> dict[str, Any]:
    candidates = []
    explicit_url = owner_privacy_url(owner_inputs)
    if explicit_url:
        ev_id = evidence_add(evidence, root, "privacy_policy_url", "owner_input", explicit_url, note="Owner-provided privacy policy URL candidate.")
        candidates.append({"source": "owner_input", "urls": [explicit_url], "evidence_id": ev_id})
    for path in project_files:
        if path.suffix.lower() not in {".json", ".xml", ".yaml", ".yml"} and path.name.lower() not in {"readme.md", "readme.txt"}:
            continue
        text = read_text(path)
        urls = unique(PRIVACY_URL.findall(text))
        if urls:
            ev_id = evidence_add(evidence, root, "privacy_policy_url", path, urls[:5], note="隐私政策 URL 候选。")
            candidates.append({"source": rel(root, path), "urls": urls[:5], "evidence_id": ev_id})
    if candidates:
        return {"answer": "YES_CANDIDATE", "status": "NEED_HUMAN", "reason": "发现隐私政策 URL 候选，需要人工确认是否适用于当前 app。", "candidates": candidates, "evidence_ids": [item["evidence_id"] for item in candidates]}
    return {"answer": "NEED_HUMAN", "status": "NEED_HUMAN", "reason": "未发现可用于 Data safety 的隐私政策 URL。", "candidates": [], "evidence_ids": []}


def apply_owner_global_answers(global_questions: dict[str, Any], owner_inputs: dict[str, Any]) -> dict[str, Any]:
    evidence_ids = owner_inputs.get("evidence_ids", [])

    encrypted = owner_input_value(owner_inputs, ("encryptedInTransit", "encrypted_in_transit", "is_all_user_data_collected_encrypted_in_transit"))
    if not is_placeholder(encrypted):
        global_questions["is_all_user_data_collected_encrypted_in_transit"].update(
            {
                "draft_answer": normalize_owner_answer(encrypted),
                "human_review": "OWNER_CONFIRMED",
                "reason": "Owner input 明确确认网络传输/第三方 SDK 传输加密状态。",
                "evidence_ids": evidence_ids,
            }
        )

    deletion = owner_input_value(owner_inputs, ("canUsersRequestDataDeletion", "can_users_request_data_deletion", "dataDeletionRequest"))
    if not is_placeholder(deletion):
        global_questions["can_users_request_data_deletion"].update(
            {
                "draft_answer": normalize_owner_answer(deletion),
                "human_review": "OWNER_CONFIRMED",
                "reason": "Owner input 明确确认用户是否可请求删除账号或关联数据。",
                "evidence_ids": evidence_ids,
            }
        )

    privacy_url = owner_privacy_url(owner_inputs)
    if privacy_url:
        global_questions["privacy_policy_url"].update(
            {
                "draft_answer": privacy_url,
                "human_review": "OWNER_CONFIRMED",
                "reason": "Owner input 提供了公开隐私政策 URL；仍需 owner/legal 确认内容覆盖当前 app 数据行为。",
                "evidence_ids": evidence_ids,
            }
        )

    risk = owner_input_value(owner_inputs, ("childrenOrSensitiveDataRisk", "children_or_sensitive_data_risk"))
    if isinstance(risk, dict):
        directed = first_value(risk, ("directedToChildren", "directed_to_children", "childDirected", "child_directed"))
        sensitive = first_value(risk, ("handlesSensitiveData", "handles_sensitive_data", "sensitiveData", "sensitive_data"))
        target_age = first_value(risk, ("targetAgeRange", "target_age_range", "targetAge", "target_age"))
        if not is_placeholder(directed) and not is_placeholder(sensitive) and not is_placeholder(target_age):
            any_risk = bool(directed) or bool(sensitive)
            global_questions["children_or_sensitive_data_risk"].update(
                {
                    "draft_answer": "YES_OWNER_CONFIRMED" if any_risk else "NO_OWNER_CONFIRMED",
                    "human_review": "OWNER_CONFIRMED",
                    "reason": "Owner input 明确确认目标年龄、儿童/家庭政策和敏感数据处理边界。",
                    "evidence_ids": evidence_ids,
                }
            )

    return global_questions


def apply_owner_data_type_answers(data_types: list[dict[str, Any]], owner_inputs: dict[str, Any]) -> list[dict[str, Any]]:
    indexed = owner_data_type_index(owner_inputs)
    if not indexed:
        return data_types

    for row in data_types:
        key = (str(row.get("category", "")).casefold(), str(row.get("data_type", "")).casefold())
        owner = indexed.get(key)
        if not owner:
            continue
        owner_row = owner["row"]
        missing_fields: list[str] = []
        for target_field, aliases in DATA_TYPE_OWNER_FIELDS.items():
            value = first_value(owner_row, aliases)
            if is_placeholder(value):
                missing_fields.append(target_field)
                continue
            if target_field == "purposes":
                if isinstance(value, list):
                    purposes = [str(item).strip() for item in value if not is_placeholder(item)]
                    if purposes:
                        row[target_field] = purposes
                    else:
                        missing_fields.append(target_field)
                elif is_real_text(value):
                    row[target_field] = [item.strip() for item in str(value).split(";") if item.strip()]
                else:
                    missing_fields.append(target_field)
            else:
                row[target_field] = normalize_owner_answer(value)

        row["owner_input_source"] = owner.get("source")
        row["owner_input_evidence_id"] = owner.get("evidence_id")
        row["owner_missing_fields"] = missing_fields
        if missing_fields:
            row["human_review"] = "NEED_HUMAN"
        else:
            row["human_review"] = "OWNER_CONFIRMED"
    return data_types


def collect_external_reports(root: Path, explicit_json: list[str], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    paths = [root / item for item in explicit_json]
    paths.extend(
        [
            root / "play-store-launch" / "reports" / "privacy-disclosure-prep-output.json",
            root / "play-store-launch" / "reports" / "launch-info-collector-output.json",
        ]
    )
    reports = []
    for path in paths:
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        summary = {
            "schema_version": data.get("schema_version"),
            "overall_status": data.get("overall_status"),
            "top_keys": list(data.keys())[:12],
        }
        ev_id = evidence_add(evidence, root, "source_report", path, summary, note="可选上游报告证据。")
        reports.append({"source": rel(root, path), "summary": summary, "evidence_id": ev_id})
    return reports


def build_global_questions(
    data_types: list[dict[str, Any]],
    sdk_inventory: list[dict[str, Any]],
    account: dict[str, Any],
    deletion: dict[str, Any],
    payment: dict[str, Any],
    crash: dict[str, Any],
    ads: dict[str, Any],
    analytics: dict[str, Any],
    children: dict[str, Any],
    privacy_policy: dict[str, Any],
) -> dict[str, Any]:
    has_data = bool(data_types)
    has_external_sdk = bool(sdk_inventory)
    has_tracking = ads["status"] != "missing" or analytics["status"] != "missing" or any(row["used_for_tracking"] == "YES_CANDIDATE" for row in data_types)
    deletion_answer = "YES_CANDIDATE" if deletion["status"] != "missing" else "NEED_HUMAN"
    return {
        "does_app_collect_or_share_user_data": {
            "draft_answer": "YES_CANDIDATE" if has_data or has_external_sdk else "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": "发现用户数据或 SDK 信号。" if has_data or has_external_sdk else "未发现足够证据证明是否收集或共享用户数据。",
        },
        "is_all_user_data_collected_encrypted_in_transit": {
            "draft_answer": "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": "静态项目证据不能证明所有传输路径和第三方 SDK 均加密传输。",
        },
        "can_users_request_data_deletion": {
            "draft_answer": deletion_answer,
            "human_review": "NEED_HUMAN",
            "reason": "发现账号删除/注销候选。" if deletion_answer == "YES_CANDIDATE" else "账号相关项目必须确认账号和关联数据删除请求机制。",
            "evidence_ids": deletion.get("evidence_ids", []),
        },
        "privacy_policy_url": {
            "draft_answer": privacy_policy["answer"],
            "human_review": "NEED_HUMAN",
            "reason": privacy_policy["reason"],
            "evidence_ids": privacy_policy.get("evidence_ids", []),
        },
        "third_party_sdk_or_external_sharing": {
            "draft_answer": "YES_CANDIDATE" if has_external_sdk else "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": "发现第三方 SDK/服务候选。" if has_external_sdk else "未发现足够 SDK 证据；仍需人工确认是否存在外部共享。",
            "evidence_ids": [item["evidence_id"] for item in sdk_inventory],
        },
        "tracking": {
            "draft_answer": "YES_CANDIDATE" if has_tracking else "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": "发现 ads、analytics 或 device id 相关 tracking 候选。" if has_tracking else "未发现 tracking 证据；仍需人工确认广告、分析和跨 app/站点追踪。",
        },
        "children_or_sensitive_data_risk": {
            "draft_answer": "YES_CANDIDATE" if children["status"] != "missing" else "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": "发现儿童/家庭/敏感数据相关信号。" if children["status"] != "missing" else "未发现足够证据确认是否面向儿童或处理敏感数据。",
            "evidence_ids": children.get("evidence_ids", []),
        },
        "account_system": {
            "draft_answer": "YES_CANDIDATE" if account["status"] != "missing" else "NEED_HUMAN",
            "human_review": "NEED_HUMAN",
            "reason": account["reason"],
            "evidence_ids": account.get("evidence_ids", []),
        },
        "payment_provider": {
            "draft_answer": "YES_CANDIDATE" if payment["status"] != "missing" else "NO_NOT_OBSERVED",
            "human_review": "NEED_HUMAN",
            "reason": payment["reason"],
            "evidence_ids": payment.get("evidence_ids", []),
        },
        "crash_reporting": {
            "draft_answer": "YES_CANDIDATE" if crash["status"] != "missing" else "NO_NOT_OBSERVED",
            "human_review": "NEED_HUMAN",
            "reason": crash["reason"],
            "evidence_ids": crash.get("evidence_ids", []),
        },
        "ad_sdk": {
            "draft_answer": "YES_CANDIDATE" if ads["status"] != "missing" else "NO_NOT_OBSERVED",
            "human_review": "NEED_HUMAN",
            "reason": ads["reason"],
            "evidence_ids": ads.get("evidence_ids", []),
        },
    }


def build_blockers(global_questions: dict[str, Any], data_types: list[dict[str, Any]]) -> list[dict[str, Any]]:
    labels = {
        "is_all_user_data_collected_encrypted_in_transit": "加密传输",
        "can_users_request_data_deletion": "数据删除请求",
        "privacy_policy_url": "隐私政策 URL",
        "third_party_sdk_or_external_sharing": "第三方 SDK/共享",
        "tracking": "Tracking",
        "children_or_sensitive_data_risk": "儿童/敏感数据风险",
        "account_system": "账号系统",
    }
    blockers = []
    for key, item in global_questions.items():
        if item.get("human_review") == "NEED_HUMAN" and item.get("draft_answer") == "NEED_HUMAN":
            blockers.append(
                {
                    "field": key,
                    "label": labels.get(key, key),
                    "reason": item.get("reason", "需要人工确认。"),
                    "unblock_action": human_action_for_global(key),
                }
            )
    unresolved_data_types = [
        row for row in data_types
        if row.get("human_review") != "OWNER_CONFIRMED"
    ]
    if unresolved_data_types:
        blockers.append(
            {
                "field": "data_type_matrix",
                "label": "逐数据类型答案",
                "reason": f"发现 {len(data_types)} 个数据类型候选，其中 {len(unresolved_data_types)} 个仍未完成 owner 逐项确认；collected/shared/purpose/identity/tracking/required 需要人工逐项确认。",
                "unblock_action": "填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中每个 dataTypes 条目的 collected、shared、purposes、linkedToIdentity、usedForTracking、requiredOrOptional、processedEphemerally。",
            }
        )
    return blockers


def human_action_for_global(key: str) -> str:
    actions = {
        "does_app_collect_or_share_user_data": "确认 app 和 SDK 是否收集或共享任何用户数据。",
        "is_all_user_data_collected_encrypted_in_transit": "提供网络传输与第三方 SDK 传输是否加密的证明或人工确认。",
        "can_users_request_data_deletion": "提供账号和关联数据删除请求机制、入口或外部 URL。",
        "privacy_policy_url": "提供公开可访问且覆盖当前 app 数据行为的隐私政策 URL。",
        "third_party_sdk_or_external_sharing": "确认每个第三方 SDK 是否接收、处理或共享用户数据。",
        "tracking": "确认广告、analytics、device id 是否用于跨 app/站点 tracking。",
        "children_or_sensitive_data_risk": "确认目标年龄、儿童/家庭政策和敏感数据处理范围。",
        "account_system": "确认是否有账号、登录是否必需、账号删除是否覆盖关联数据。",
    }
    return actions.get(key, "补充该字段的人工确认。")


def markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    header = "| " + " | ".join(rows[0]) + " |"
    sep = "| " + " | ".join("---" for _ in rows[0]) + " |"
    body = ["| " + " | ".join(str(cell).replace("\n", " ") for cell in row) + " |" for row in rows[1:]]
    return "\n".join([header, sep, *body])


def render_evidence_lines(evidence: list[dict[str, Any]]) -> str:
    if not evidence:
        return "- 无。"
    lines = []
    for row in evidence[:20]:
        lines.append(f"- `{row['id']}` `{row['field']}` from `{row['source']}`：{row['excerpt']}")
    if len(evidence) > 20:
        lines.append(f"- 另有 {len(evidence) - 20} 条证据见 JSONL。")
    return "\n".join(lines)


def render_report(data: dict[str, Any]) -> str:
    global_rows = [["字段", "草稿答案", "人工确认", "原因/动作"]]
    for key, item in data["global_questions"].items():
        global_rows.append([f"`{key}`", f"`{item['draft_answer']}`", f"`{item['human_review']}`", item["reason"]])

    data_rows = [["数据类别", "数据类型", "Collected", "Shared", "用途候选", "身份关联", "Tracking", "证据"]]
    for row in data["data_types"]:
        data_rows.append(
            [
                row["category"],
                row["data_type"],
                f"`{row['collected']}`",
                f"`{row['shared']}`",
                ", ".join(row["purposes"]),
                f"`{row['linked_to_identity']}`",
                f"`{row['used_for_tracking']}`",
                ", ".join(row["evidence_ids"]),
            ]
        )

    evidence_sections = data["evidence_sections"]
    section_rows = [["证据主题", "状态", "数量/说明", "证据"]]
    for key, item in evidence_sections.items():
        if isinstance(item, list):
            section_rows.append([key, "`observed`" if item else "`missing`", str(len(item)), ", ".join(entry.get("evidence_id", "") for entry in item if entry.get("evidence_id")) or "-"])
        else:
            section_rows.append([key, f"`{item.get('status')}`", item.get("reason", ""), ", ".join(item.get("evidence_ids", [])) or "-"])

    blocker_lines = [
        f"- `{item['label']}`：{item['reason']} 解除方式：{item['unblock_action']}"
        for item in data["blockers"]
    ] or ["- 无。"]

    return f"""# google-data-safety-agent Data safety 准备报告

生成时间：`{data['generated_at']}`

## 总状态
- overall_status: `{data['overall_status']}`
- proof_mode: `{data['proof_mode']}`
- 输出目录：`{data['output_dir']}`

## 全局问题草稿
{markdown_table(global_rows)}

## 逐数据类型草稿
{markdown_table(data_rows)}

## 证据来源摘要
{markdown_table(section_rows)}

## 证据样本
{render_evidence_lines(data['evidence'])}

## 阻塞项
{chr(10).join(blocker_lines)}

## 总结
{final_summary(data)}
"""


def final_summary(data: dict[str, Any]) -> str:
    lines = [f"- 当前 Data safety 准备状态：`{data['overall_status']}`。"]
    if data["blockers"]:
        lines.append(f"- 不能作为最终 Data safety 答案：还有 {len(data['blockers'])} 类字段需要人工确认。")
        lines.append("- 优先处理：" + "；".join(f"{item['label']}：{item['unblock_action'].rstrip('。')}" for item in data["blockers"][:6]) + "。")
    else:
        lines.append("- 未发现阻塞项，但仍建议由产品、隐私和法律 owner 复核。")
    if data["data_types"]:
        names = ", ".join(f"{row['category']} / {row['data_type']}" for row in data["data_types"][:8])
        lines.append(f"- 已形成数据类型候选：{names}。")
    lines.append("- 本报告只准备 Data safety 证据草稿，不执行任何发布动作。")
    return "\n".join(lines)


def render_csv(data: dict[str, Any]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "category",
            "data_type",
            "collected",
            "shared",
            "processed_ephemerally",
            "required_or_optional",
            "purposes",
            "linked_to_identity",
            "used_for_tracking",
            "human_review",
            "evidence_ids",
        ],
    )
    writer.writeheader()
    for row in data["data_types"]:
        writer.writerow(
            {
                "category": row["category"],
                "data_type": row["data_type"],
                "collected": row["collected"],
                "shared": row["shared"],
                "processed_ephemerally": row["processed_ephemerally"],
                "required_or_optional": row["required_or_optional"],
                "purposes": "; ".join(row["purposes"]),
                "linked_to_identity": row["linked_to_identity"],
                "used_for_tracking": row["used_for_tracking"],
                "human_review": row["human_review"],
                "evidence_ids": "; ".join(row["evidence_ids"]),
            }
        )
    return output.getvalue()


def build_output(root: Path, output_dir: Path, evidence_json: list[str]) -> dict[str, Any]:
    evidence: list[dict[str, Any]] = []
    project_files = iter_project_files(root)
    owner_inputs = load_owner_inputs(root, evidence)
    external_reports = collect_external_reports(root, evidence_json, evidence)
    permissions = collect_permissions(root, project_files, evidence)
    sdk_inventory = collect_sdk_inventory(root, project_files, evidence)
    semantic_files = data_safety_files(root, project_files)
    analytics = collect_signal_group(root, semantic_files, evidence, "analytics_events", ANALYTICS_PATTERNS, "analytics/events/metrics 候选。")
    backend_api = collect_signal_group(root, semantic_files, evidence, "backend_api_logs", (r"backend[\\/]", r"surfaces?", r"schema\.json", r"event_logs?", r"audit_logs?", r"api", r"logs?"), "backend/API/schema/log 候选。")
    account = collect_signal_group(root, semantic_files, evidence, "account_system", ACCOUNT_PATTERNS, "账号/登录系统候选。")
    deletion = collect_signal_group(root, semantic_files, evidence, "account_deletion", DELETE_PATTERNS, "账号删除/注销候选。")
    payment = collect_signal_group(root, semantic_files, evidence, "payment_provider", PAYMENT_PATTERNS, "支付/订阅/权益候选。")
    crash = collect_signal_group(root, semantic_files, evidence, "crash_reporting", CRASH_PATTERNS, "崩溃/诊断候选。")
    ads = collect_signal_group(root, semantic_files, evidence, "ad_sdk", AD_PATTERNS, "广告 SDK/广告标识候选。")
    children = collect_signal_group(root, semantic_files, evidence, "children_sensitive", CHILDREN_PATTERNS, "儿童/家庭/敏感数据候选。")
    privacy_policy = collect_privacy_policy(root, project_files, evidence, owner_inputs)
    data_types = collect_data_types(root, semantic_files, sdk_inventory, evidence)
    data_types = apply_owner_data_type_answers(data_types, owner_inputs)
    global_questions = build_global_questions(data_types, sdk_inventory, account, deletion, payment, crash, ads, analytics, children, privacy_policy)
    global_questions = apply_owner_global_answers(global_questions, owner_inputs)
    blockers = build_blockers(global_questions, data_types)
    overall_status = "blocked" if blockers else "pass"
    evidence_sections = {
        "app_permissions": permissions,
        "sdk_list": sdk_inventory,
        "analytics_events": analytics,
        "backend_api_logs": backend_api,
        "account_system": account,
        "account_deletion": deletion,
        "payment_provider": payment,
        "crash_reporting": crash,
        "ad_sdk": ads,
        "children_sensitive": children,
        "privacy_policy_url": privacy_policy,
        "owner_input": owner_inputs,
        "source_reports": external_reports,
    }
    generated_files = {
        "human_report": rel(root, output_dir / REPORT_FILENAMES["human"]),
        "machine_report": rel(root, output_dir / REPORT_FILENAMES["machine"]),
        "source_of_truth": rel(root, output_dir / REPORT_FILENAMES["source"]),
        "evidence_jsonl": rel(root, output_dir / REPORT_FILENAMES["evidence"]),
        "csv_draft": rel(root, output_dir / REPORT_FILENAMES["csv"]),
    }
    source_of_truth = {
        "schema_version": SOURCE_SCHEMA_VERSION,
        "status": "draft_blocked" if blockers else "draft_ready",
        "can_use_as_final_data_safety_answer": False,
        "global_questions": global_questions,
        "data_types": data_types,
        "evidence_sections": evidence_sections,
        "blockers": blockers,
        "limitations": [
            "静态证据不能证明最终 Data safety 答案。",
            "shared、tracking、linked_to_identity、required_or_optional、encrypted_in_transit、deletion_request 必须人工确认。",
            "第三方 SDK 的实际数据处理行为必须由 SDK 文档、配置和 owner 确认。",
        ],
    }
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "proof_mode": "parsed_repo_evidence",
        "overall_status": overall_status,
        "output_dir": rel(root, output_dir),
        "scanned_file_count": len(project_files),
        "semantic_file_count": len(semantic_files),
        "global_questions": global_questions,
        "data_types": data_types,
        "evidence_sections": evidence_sections,
        "blockers": blockers,
        "evidence": evidence,
        "source_of_truth": source_of_truth,
        "generated_files": generated_files,
    }


def write_outputs(output_dir: Path, data: dict[str, Any]) -> None:
    write_json(output_dir / REPORT_FILENAMES["machine"], data)
    write_json(output_dir / REPORT_FILENAMES["source"], data["source_of_truth"])
    write_text(output_dir / REPORT_FILENAMES["human"], render_report(data))
    write_text(output_dir / REPORT_FILENAMES["csv"], render_csv(data))
    evidence_path = output_dir / REPORT_FILENAMES["evidence"]
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in data["evidence"]), encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare Google Play Data safety evidence draft.")
    parser.add_argument("root_arg", nargs="?", help="Project root.")
    parser.add_argument("--root", help="Project root.")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Report output directory.")
    parser.add_argument("--evidence-json", action="append", default=[], help="Additional evidence JSON path.")
    parser.add_argument("--no-write", action="store_true", help="Build output without writing files.")
    args = parser.parse_args()

    root = Path(args.root or args.root_arg or ".").resolve()
    output_dir = (root / args.output_dir).resolve()
    data = build_output(root, output_dir, args.evidence_json)
    if not args.no_write:
        write_outputs(output_dir, data)
    print(f"overall_status={data['overall_status']}")
    print(f"proof_mode={data['proof_mode']}")
    print(f"human_report={(output_dir / REPORT_FILENAMES['human']).as_posix()}")
    print(f"machine_report={(output_dir / REPORT_FILENAMES['machine']).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
