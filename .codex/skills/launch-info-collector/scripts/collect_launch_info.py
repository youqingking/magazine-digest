#!/usr/bin/env python3
"""Collect evidence-backed launch information for app store preparation."""

from __future__ import annotations

import argparse
import json
import os
import plistlib
import re
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any


SCHEMA_VERSION = "launch_info_collector_output.v1"
SOURCE_SCHEMA_VERSION = "launch_info_source_of_truth.v1"
REPORT_FILENAMES = {
    "human": "launch-info-collector.zh.md",
    "machine": "launch-info-collector-output.json",
    "source": "launch-info-source-of-truth.json",
    "evidence": "launch-info-evidence.jsonl",
}

IGNORED_SCAN_PARTS = {
    ".codex",
    ".git",
    ".hg",
    ".svn",
    ".idea",
    "agno",
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
MAX_TEXT_BYTES = 240_000
LAUNCH_JSON_CANDIDATES = (
    "launch-info.json",
    "app-launch-info.json",
    "app-info.json",
    "metadata/launch-info.json",
    "store/launch-info.json",
    "play-store/launch-info.json",
    "play-store-launch/inputs/launch-info.json",
)
DOC_HINTS = (
    "readme",
)
DOC_EXCLUDED_PARTS = {"agno", "uni_modules", "node_modules", "infra", "domains"}
DOC_EXACT_NAMES = {
    "app.md",
    "app_info.md",
    "app-info.md",
    "app_overview.md",
    "app-overview.md",
    "audience.md",
    "demo_data.md",
    "demo-data.md",
    "launch_info.md",
    "launch-info.md",
    "marketing.md",
    "overview.md",
    "privacy.md",
    "product.md",
    "product_overview.md",
    "product-overview.md",
    "screenshot_demo.md",
    "screenshot-demo.md",
    "store.md",
    "support.md",
}
SUPPORT_URL_HINT = re.compile(r"https?://[^\s)>\]]*(?:support|help|faq|contact|privacy)[^\s)>\]]*", re.I)
ANY_URL = re.compile(r"https?://[^\s)>\]]+", re.I)
EMAIL = re.compile(r"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}")

SECTION_LABELS = {
    "positioning": ("positioning", "tagline", "value proposition", "one sentence", "一句话", "定位", "价值主张"),
    "features": ("features", "core features", "main features", "selling points", "功能", "核心功能", "主卖点", "卖点"),
    "target_users": ("target users", "target audience", "audience", "users", "用户", "目标用户", "受众", "人群"),
    "support": ("support", "help", "faq", "contact", "支持", "客服", "帮助", "联系", "常见问题"),
    "privacy": ("privacy", "data collection", "data safety", "personal data", "隐私", "数据收集", "个人信息", "数据安全"),
    "account": ("account", "login", "sign in", "authentication", "账号", "账户", "登录", "认证"),
    "monetization": ("subscription", "iap", "in-app purchase", "payment", "pricing", "trial", "订阅", "内购", "支付", "价格", "试用", "权益"),
    "demo_data": ("demo data", "fixtures", "sample data", "screenshot data", "scenario", "demo 数据", "示例数据", "截图", "场景"),
}

SDK_HINTS = {
    "expo": ("expo", "expo-dev-client", "expo-updates", "expo-notifications"),
    "react_native": ("react-native",),
    "uni_app": ("@dcloudio/", "uni-id", "uni-push", "uniCloud", "uni-pay", "uni-captcha"),
    "firebase": ("firebase", "@react-native-firebase", "com.google.firebase"),
    "sentry": ("sentry", "@sentry/"),
    "revenuecat": ("revenuecat", "purchases"),
    "stripe": ("stripe",),
    "wechat": ("weixin", "wechat"),
    "alipay": ("alipay",),
}
DATA_SIGNAL_PATTERNS = {
    "账号/个人资料": (r"user[_-]?profiles?", r"profile", r"account", r"auth", r"login", r"userinfo", r"用户", r"账号"),
    "设备/推送标识": (r"device[_-]?installations?", r"push", r"notification", r"\bcid\b", r"device", r"通知", r"推送"),
    "内容行为/阅读状态": (r"user[_-]?content[_-]?state", r"reading", r"content[-_]?resume", r"follows?", r"save[-_]?for[-_]?later", r"阅读", r"关注"),
    "订阅/支付/权益": (r"subscription", r"payment", r"pricing", r"entitlement", r"\biap\b", r"unipay", r"billing", r"订阅", r"支付", r"权益"),
    "活动/分析事件": (r"event[_-]?logs?", r"analytics", r"metrics", r"experiment", r"tracking", r"埋点", r"指标"),
}
ACCOUNT_PATTERNS = (
    r"\bauth\b",
    r"login",
    r"sign[-_ ]?in",
    r"register",
    r"account",
    r"profile",
    r"uni-id",
    r"logout",
    r"delete[-_ ]?account",
    r"deactivate",
    r"登录",
    r"注册",
    r"账号",
    r"账户",
    r"注销",
)
MANDATORY_LOGIN_PATTERNS = (
    r"login\s+(is\s+)?required",
    r"requires?\s+login",
    r"must\s+(be\s+)?sign(ed)?\s*in",
    r"必须登录",
    r"需要登录",
    r"强制登录",
)
MONETIZATION_PATTERNS = (
    r"subscription",
    r"subscribe",
    r"in[-_ ]?app[-_ ]?purchase",
    r"\biap\b",
    r"payment",
    r"billing",
    r"pricing",
    r"trial",
    r"entitlement",
    r"revenuecat",
    r"stripe",
    r"unipay",
    r"订阅",
    r"内购",
    r"支付",
    r"试用",
    r"权益",
)
DEMO_PATTERNS = (r"fixtures?", r"mock", r"seed", r"sample", r"scenario", r"demo", r"test-inputs", r"real-content", r"截图", r"示例")


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


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8", newline="\n")


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def compact(value: str, limit: int = 220) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    return value if len(value) <= limit else value[: limit - 3].rstrip() + "..."


def first_text(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def as_list(value: Any) -> list[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return [item for item in value if item not in (None, "")]
    if isinstance(value, tuple):
        return [item for item in value if item not in (None, "")]
    if isinstance(value, dict):
        return [value]
    if isinstance(value, str):
        if not value.strip():
            return []
        if "\n" in value:
            return [line.strip(" -*\t") for line in value.splitlines() if line.strip(" -*\t")]
        return [value.strip()]
    return [value]


def unique_strings(values: list[Any]) -> list[str]:
    seen: set[str] = set()
    output: list[str] = []
    for value in values:
        if not isinstance(value, str):
            continue
        normalized = re.sub(r"\s+", " ", value).strip()
        if not normalized:
            continue
        key = normalized.casefold()
        if key not in seen:
            seen.add(key)
            output.append(normalized)
    return output


def evidence_add(evidence: list[dict[str, Any]], field_id: str, source: str | Path, value: Any, root: Path, *, status: str = "observed", note: str = "") -> str:
    source_text = rel(root, source) if isinstance(source, Path) else source
    if isinstance(value, (dict, list)):
        excerpt = json.dumps(value, ensure_ascii=False)
    else:
        excerpt = "" if value is None else str(value)
    row_id = f"ev_{len(evidence) + 1:04d}"
    evidence.append(
        {
            "id": row_id,
            "field_id": field_id,
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
    parts = PurePosixPath(relative).parts
    if any(part in IGNORED_SCAN_PARTS for part in parts):
        return False
    try:
        if path.stat().st_size > MAX_TEXT_BYTES and path.suffix.lower() in {".md", ".txt", ".js", ".ts", ".vue", ".json", ".xml", ".yaml", ".yml"}:
            return False
    except OSError:
        return False
    return True


def iter_project_files(root: Path) -> list[Path]:
    tracked = run_git_ls_files(root)
    if tracked:
        return [path for path in tracked if should_scan_file(root, path)]
    files: list[Path] = []
    for current, dirs, names in os.walk(root):
        dirs[:] = [name for name in dirs if name not in IGNORED_SCAN_PARTS]
        for name in names:
            path = Path(current) / name
            if should_scan_file(root, path):
                files.append(path)
    return files


def parse_strings_xml(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    try:
        root = ET.fromstring(read_text(path))
    except ET.ParseError:
        return values
    for element in root.findall("string"):
        name = element.attrib.get("name")
        text = "".join(element.itertext()).strip()
        if name and text:
            values[name] = text
    return values


def resolve_android_string(root: Path, manifest_path: Path, value: str) -> str | None:
    if not value.startswith("@string/"):
        return value
    key = value.split("/", 1)[1]
    candidates = [
        manifest_path.parent / "res" / "values",
        manifest_path.parent.parent / "res" / "values",
        root / "android" / "app" / "src" / "main" / "res" / "values",
        root / "app" / "src" / "main" / "res" / "values",
    ]
    for directory in candidates:
        if not directory.exists():
            continue
        for xml_path in directory.glob("*.xml"):
            values = parse_strings_xml(xml_path)
            if key in values:
                return values[key]
    return None


def parse_android_manifest(root: Path, path: Path) -> dict[str, Any] | None:
    try:
        manifest = ET.fromstring(read_text(path))
    except ET.ParseError:
        return None
    namespace = "{http://schemas.android.com/apk/res/android}"
    app = manifest.find("application")
    label = None
    if app is not None:
        raw_label = app.attrib.get(namespace + "label")
        if raw_label:
            label = resolve_android_string(root, path, raw_label)
    permissions = [item.attrib.get(namespace + "name") for item in manifest.findall("uses-permission")]
    return {
        "source": rel(root, path),
        "type": "android_manifest",
        "app_name": label,
        "package": manifest.attrib.get("package"),
        "permissions": [item for item in permissions if item],
    }


def parse_pubspec(path: Path) -> dict[str, Any] | None:
    text = read_text(path)
    name = re.search(r"(?m)^name:\s*['\"]?([^'\"\n#]+)", text)
    description = re.search(r"(?m)^description:\s*['\"]?([^'\"\n#]+)", text)
    if not name and not description:
        return None
    return {
        "source": path,
        "type": "flutter_pubspec",
        "app_name": name.group(1).strip() if name else None,
        "description": description.group(1).strip() if description else None,
    }


def parse_info_plist(path: Path) -> dict[str, Any] | None:
    try:
        with path.open("rb") as handle:
            data = plistlib.load(handle)
    except Exception:
        return None
    return {
        "source": path,
        "type": "ios_info_plist",
        "app_name": first_text(data.get("CFBundleDisplayName"), data.get("CFBundleName")),
        "package": first_text(data.get("CFBundleIdentifier")),
    }


def collect_launch_json(root: Path, explicit_paths: list[str], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    paths = [root / item for item in explicit_paths]
    paths.extend(root / item for item in LAUNCH_JSON_CANDIDATES)
    aliases = {
        "app_name": ("appName", "app_name", "name", "title", "productName"),
        "alternate_names": ("alternateNames", "alternate_names", "aliases"),
        "positioning": ("positioning", "one_sentence_positioning", "tagline", "valueProposition", "value_proposition"),
        "core_features": ("coreFeatures", "core_features", "features", "sellingPoints", "selling_points"),
        "target_users": ("targetUsers", "target_users", "audience", "targetAudience", "target_audience"),
        "supported_platforms": ("supportedPlatforms", "supported_platforms", "platforms"),
        "privacy": ("privacy", "privacySignals", "privacy_signals", "dataCollection", "data_collection"),
        "account_system": ("accountSystem", "account_system", "login", "auth"),
        "subscription_iap": ("subscriptionIap", "subscription_iap", "monetization", "iap", "subscription"),
        "support": ("support", "contact", "developerContact", "developer_contact"),
        "screenshot_demo_data": ("screenshotDemoData", "screenshot_demo_data", "demoData", "demo_data"),
    }
    output: dict[str, Any] = {"sources": []}
    for path in paths:
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        output["sources"].append(rel(root, path))
        evidence_add(evidence, "launch_json", path, sorted(data.keys()), root, note="显式 launch info JSON。")
        for field_id, keys in aliases.items():
            for key in keys:
                if key in data and data[key] not in (None, "", [], {}):
                    output.setdefault(field_id, data[key])
                    evidence_add(evidence, field_id, path, data[key], root, note=f"来自 launch info 字段 `{key}`。")
                    break
    return output


def collect_identity(root: Path, project_files: list[Path], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    sources: list[dict[str, Any]] = []
    evidence_ids: list[str] = []
    explicit_app_name = first_text(launch_json.get("app_name"))

    def add_source(source: str | Path, source_type: str, app_name: str | None, package: str | None, description: str | None = None) -> None:
        row = {
            "source": rel(root, source) if isinstance(source, Path) else source,
            "type": source_type,
            "app_name": app_name,
            "package": package,
            "description": description,
        }
        if app_name or package or description:
            sources.append(row)
        if app_name:
            evidence_ids.append(evidence_add(evidence, "app_name", source, app_name, root, note=f"{source_type} app name 候选。"))
        if package:
            evidence_ids.append(evidence_add(evidence, "app_identifier", source, package, root, note=f"{source_type} package/bundle/app id 候选。"))

    if explicit_app_name:
        add_source("launch-info-json", "explicit_launch_json", explicit_app_name, None)

    app_json_path = root / "app.json"
    app_json = load_json(app_json_path)
    if isinstance(app_json, dict):
        expo = app_json.get("expo") if isinstance(app_json.get("expo"), dict) else app_json
        android = expo.get("android") if isinstance(expo.get("android"), dict) else {}
        ios = expo.get("ios") if isinstance(expo.get("ios"), dict) else {}
        add_source(app_json_path, "expo_or_app_json", first_text(expo.get("name"), expo.get("displayName")), first_text(android.get("package"), ios.get("bundleIdentifier")), first_text(expo.get("description")))

    for name in ("app.config.json", "capacitor.config.json", "package.json", "manifest.json", "mobile/manifest.json"):
        path = root / name
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        if name == "capacitor.config.json":
            add_source(path, "capacitor", first_text(data.get("appName")), first_text(data.get("appId")))
        elif name == "package.json":
            add_source(path, "package_json", first_text(data.get("displayName"), data.get("productName")), first_text(data.get("name")), first_text(data.get("description")))
            if data.get("name") and not data.get("displayName") and not data.get("productName"):
                evidence_ids.append(evidence_add(evidence, "alternate_names", path, data.get("name"), root, status="inferred", note="package.name 更像技术名称，列为备用/技术名。"))
        elif name == "app.config.json":
            add_source(path, "app_config_json", first_text(data.get("name"), data.get("displayName")), None, first_text(data.get("description")))
        else:
            add_source(path, "manifest_json", first_text(data.get("name")), first_text(data.get("appid"), data.get("appId")), first_text(data.get("description")))

    for path in project_files:
        normalized = rel(root, path).replace("\\", "/")
        if normalized.endswith("AndroidManifest.xml") and "/src/main/" in normalized:
            parsed = parse_android_manifest(root, path)
            if parsed:
                sources.append(parsed)
                if parsed.get("app_name"):
                    evidence_ids.append(evidence_add(evidence, "app_name", path, parsed["app_name"], root, note="AndroidManifest application label。"))
                if parsed.get("package"):
                    evidence_ids.append(evidence_add(evidence, "app_identifier", path, parsed["package"], root, note="AndroidManifest package。"))
        elif path.name == "Info.plist":
            parsed = parse_info_plist(path)
            if parsed:
                parsed["source"] = rel(root, path)
                sources.append(parsed)
                if parsed.get("app_name"):
                    evidence_ids.append(evidence_add(evidence, "app_name", path, parsed["app_name"], root, note="iOS Info.plist display name。"))
        elif path.name == "pubspec.yaml":
            parsed = parse_pubspec(path)
            if parsed:
                parsed["source"] = rel(root, path)
                sources.append(parsed)
                if parsed.get("app_name"):
                    evidence_ids.append(evidence_add(evidence, "app_name", path, parsed["app_name"], root, note="Flutter pubspec name。"))

    app_names = unique_strings([item.get("app_name") for item in sources if item.get("app_name")])
    technical_names = unique_strings([item.get("package") for item in sources if item.get("package")])
    explicit_alts = unique_strings([str(item) for item in as_list(launch_json.get("alternate_names"))])
    if explicit_app_name:
        return {
            "status": "observed",
            "value": explicit_app_name,
            "candidates": [explicit_app_name],
            "alternate_names": unique_strings([
                *explicit_alts,
                *technical_names,
                *[name for name in app_names if name != explicit_app_name],
            ]),
            "sources": sources,
            "evidence_ids": evidence_ids,
            "reason": "显式 launch info 提供了当前上架名称；manifest/package 中的其他名称列为备用名或技术名候选。",
            "human_action": "",
        }
    if not app_names:
        status = "missing"
        reason = "未在通用 app manifest 或显式 launch info 中发现产品名。"
        action = "提供真实产品名和备用名。"
    elif len(app_names) == 1:
        status = "observed"
        reason = "发现一个明确产品名候选。"
        action = ""
    else:
        status = "conflict"
        reason = "发现多个产品名候选，需要人工确定最终上架名称和备用名。"
        action = "确认唯一最终产品名；把其他候选名标为备用名或技术名。"
    return {
        "status": status,
        "value": app_names[0] if len(app_names) == 1 else None,
        "candidates": app_names,
        "alternate_names": unique_strings([*explicit_alts, *technical_names, *app_names[1:]]),
        "sources": sources,
        "evidence_ids": evidence_ids,
        "reason": reason,
        "human_action": action,
    }


def is_doc_candidate(root: Path, path: Path, explicit_sources: set[str]) -> bool:
    relative = rel(root, path)
    lower = relative.lower().replace("\\", "/")
    parts = set(PurePosixPath(lower).parts)
    if relative in explicit_sources or lower in {item.lower().replace("\\", "/") for item in explicit_sources}:
        return True
    if path.suffix.lower() not in {".md", ".txt"}:
        return False
    if parts.intersection(DOC_EXCLUDED_PARTS):
        return False
    if path.name.lower().startswith("readme"):
        return len(PurePosixPath(lower).parts) == 1
    return lower.startswith("docs/") and path.name.lower() in DOC_EXACT_NAMES


def collect_document_sources(root: Path, project_files: list[Path], explicit_sources: list[str]) -> list[dict[str, str]]:
    explicit = {rel(root, (root / item).resolve()) for item in explicit_sources}
    docs = []
    for path in project_files:
        if not is_doc_candidate(root, path, explicit):
            continue
        text = read_text(path)
        if text.strip():
            docs.append({"source": rel(root, path), "text": text})
    for item in explicit_sources:
        path = (root / item).resolve()
        if path.exists() and path.is_file():
            relative = rel(root, path)
            if not any(doc["source"] == relative for doc in docs):
                docs.append({"source": relative, "text": read_text(path)})
    return docs


def heading_matches(heading: str, labels: tuple[str, ...]) -> bool:
    text = heading.casefold()
    return any(label.casefold() in text for label in labels)


def extract_markdown_sections(text: str, labels: tuple[str, ...]) -> list[str]:
    sections: list[str] = []
    current: list[str] = []
    collecting = False
    for line in text.splitlines():
        heading = re.match(r"^\s{0,3}#{1,6}\s+(.+?)\s*$", line)
        if heading:
            if collecting and current:
                sections.append("\n".join(current).strip())
            collecting = heading_matches(heading.group(1), labels)
            current = []
            continue
        if collecting:
            current.append(line)
    if collecting and current:
        sections.append("\n".join(current).strip())
    return [item for item in sections if item]


def extract_inline_values(text: str, labels: tuple[str, ...]) -> list[str]:
    values = []
    for label in labels:
        pattern = re.compile(rf"(?im)^\s*(?:[-*]\s*)?{re.escape(label)}\s*[:：]\s*(.+)$")
        values.extend(match.group(1).strip() for match in pattern.finditer(text))
    return values


def section_items(section: str, limit: int = 8) -> list[str]:
    output = []
    in_code = False
    for line in section.splitlines():
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            continue
        if in_code or not stripped or stripped.startswith("|"):
            continue
        bullet = re.match(r"^(?:[-*+]|\d+[.)])\s+(.+)$", stripped)
        if bullet:
            output.append(compact(bullet.group(1), 180))
        elif len(output) < 2:
            output.append(compact(stripped.strip("# "), 180))
        if len(output) >= limit:
            break
    return unique_strings(output)


def collect_doc_field(docs: list[dict[str, str]], field_id: str, labels: tuple[str, ...], evidence: list[dict[str, Any]], root: Path, *, max_items: int = 8) -> list[dict[str, Any]]:
    rows = []
    for doc in docs:
        values = []
        values.extend(extract_inline_values(doc["text"], labels))
        for section in extract_markdown_sections(doc["text"], labels):
            values.extend(section_items(section, max_items))
        values = unique_strings(values)[:max_items]
        if values:
            ev_id = evidence_add(evidence, field_id, doc["source"], values, root, note="来自明确标注的文档段落。")
            rows.append({"source": doc["source"], "values": values, "evidence_id": ev_id})
    return rows


def scan_patterns(root: Path, project_files: list[Path], patterns: tuple[str, ...], *, path_only: bool = False, max_hits: int = 20) -> list[dict[str, str]]:
    hits = []
    compiled = [re.compile(pattern, flags=re.I) for pattern in patterns]
    for path in project_files:
        relative = rel(root, path)
        haystack = relative.replace("\\", "/")
        matched = next((pattern.pattern for pattern in compiled if pattern.search(haystack)), None)
        if matched:
            hits.append({"source": relative, "matched": matched, "where": "path"})
            if len(hits) >= max_hits:
                break
            continue
        if path_only or path.suffix.lower() not in {".js", ".ts", ".vue", ".json", ".xml", ".yaml", ".yml"}:
            continue
        text = read_text(path)
        matcher = next((pattern for pattern in compiled if pattern.search(text)), None)
        if matcher:
            match = matcher.search(text)
            excerpt = compact(text[max(0, match.start() - 80) : match.end() + 80]) if match else ""
            hits.append({"source": relative, "matched": matcher.pattern, "where": "content", "excerpt": excerpt})
            if len(hits) >= max_hits:
                break
    return hits


def infer_feature_candidates(root: Path, project_files: list[Path], evidence: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets = {
        "阅读与内容管理": r"reading|content[-_]?detail|content[-_]?resume|save[-_]?for[-_]?later|article|publication|阅读|文章|内容",
        "内容发现与关注": r"home[-_]?discovery|follow|catalog|search|discovery|发现|关注|搜索",
        "订阅、权益与付费": r"pricing|payment|subscription|entitlement|commercial|offer|trial|订阅|支付|权益",
        "通知与触达": r"notification|push|inbox|campaign|通知|推送",
        "账号与个人资料": r"auth|login|profile|account|user[_-]?profiles?|uni-id|账号|登录",
        "发布与同步流程": r"publish|sync|release|batch|发布|同步",
        "激励与增长": r"reward|referral|promo|coupon|growth|奖励|裂变|优惠",
    }
    hits: dict[str, list[str]] = {key: [] for key in buckets}
    for path in project_files:
        relative = rel(root, path)
        lower = relative.lower().replace("\\", "/")
        if not any(part in lower for part in ("pages", "screens", "routes", "surfaces", "database", "schema", "shared/contracts", "backend/surfaces")):
            continue
        for label, pattern in buckets.items():
            if re.search(pattern, lower, flags=re.I):
                hits[label].append(relative)
    features = []
    for label, sources in hits.items():
        if not sources:
            continue
        ev_id = evidence_add(evidence, "core_features", ", ".join(sources[:5]), label, root, status="inferred", note="由真实 route/screen/schema/API 文件名推断。")
        features.append({"name": label, "status": "inferred", "sources": sources[:8], "evidence_id": ev_id})
    return features[:5]


def package_dependencies(root: Path) -> dict[str, str]:
    data = load_json(root / "package.json")
    deps: dict[str, str] = {}
    if isinstance(data, dict):
        for key in ("dependencies", "devDependencies", "peerDependencies", "optionalDependencies"):
            if isinstance(data.get(key), dict):
                deps.update({str(name): str(version) for name, version in data[key].items()})
    return deps


def build_positioning(docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]], root: Path) -> dict[str, Any]:
    explicit = first_text(launch_json.get("positioning"))
    if explicit:
        return {"status": "observed", "value": explicit, "evidence_ids": [evidence_add(evidence, "positioning", "launch-info-json", explicit, root, note="显式 positioning。")], "reason": "发现一句话定位。", "human_action": ""}
    rows = collect_doc_field(docs, "positioning", SECTION_LABELS["positioning"], evidence, root, max_items=4)
    values = unique_strings([value for row in rows for value in row["values"]])
    if values:
        return {"status": "observed", "value": values[0], "candidates": values[:4], "document_evidence": rows, "evidence_ids": [row["evidence_id"] for row in rows], "reason": "从明确定位段落提取候选。", "human_action": "人工确认最终一句话定位：给谁、解决什么问题。"}
    return {"status": "missing", "value": "NEED_HUMAN", "evidence_ids": [], "reason": "未发现一句话定位。", "human_action": "提供一句话定位，格式建议：为 [目标用户] 解决 [核心问题] 的 [产品类别]。"}


def build_core_features(root: Path, project_files: list[Path], docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = unique_strings([str(item) for item in as_list(launch_json.get("core_features"))])
    if explicit:
        ev_id = evidence_add(evidence, "core_features", "launch-info-json", explicit[:5], root, note="显式 core features。")
        status = "observed" if 3 <= len(explicit) <= 5 else "needs_human"
        return {"status": status, "value": explicit[:5], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了核心功能。" if status == "observed" else "核心功能数量不是 3-5 个。", "human_action": "" if status == "observed" else "提供 3-5 个可用于商店表达的主卖点。"}
    rows = collect_doc_field(docs, "core_features", SECTION_LABELS["features"], evidence, root, max_items=8)
    doc_values = unique_strings([value for row in rows for value in row["values"]])
    if len(doc_values) >= 3:
        return {"status": "observed", "value": doc_values[:5], "document_evidence": rows, "evidence_ids": [row["evidence_id"] for row in rows], "reason": "从明确功能段落提取了至少 3 个功能。", "human_action": "人工确认这些功能是上架版本真实可用能力。"}
    inferred = infer_feature_candidates(root, project_files, evidence)
    if inferred:
        return {
            "status": "inferred",
            "value": [item["name"] for item in inferred],
            "inferred_features": inferred,
            "document_evidence": rows,
            "evidence_ids": [item["evidence_id"] for item in inferred],
            "reason": "未发现足够明确卖点文案，已从真实 route/screen/schema/API 信号推断功能候选。",
            "human_action": "把候选功能改写并确认成 3-5 个主卖点，避免承诺不存在或未发布的功能。",
        }
    return {"status": "missing", "value": "NEED_HUMAN", "evidence_ids": [], "reason": "未发现核心功能。", "human_action": "提供 3-5 个上架版本真实可用的主卖点。"}


def build_target_users(docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]], root: Path) -> dict[str, Any]:
    explicit = unique_strings([str(item) for item in as_list(launch_json.get("target_users"))])
    if explicit:
        ev_id = evidence_add(evidence, "target_users", "launch-info-json", explicit, root, note="显式 target users。")
        return {"status": "observed", "value": explicit, "evidence_ids": [ev_id], "reason": "显式 launch info 提供了目标用户。", "human_action": ""}
    rows = collect_doc_field(docs, "target_users", SECTION_LABELS["target_users"], evidence, root, max_items=8)
    values = unique_strings([value for row in rows for value in row["values"]])
    if values:
        return {"status": "observed", "value": values[:8], "document_evidence": rows, "evidence_ids": [row["evidence_id"] for row in rows], "reason": "从明确用户/受众段落提取目标用户候选。", "human_action": "人工确认目标用户是否适用于商店 listing、内容分级和广告素材。"}
    return {"status": "missing", "value": "NEED_HUMAN", "evidence_ids": [], "reason": "未发现目标用户。", "human_action": "提供目标用户段，例如学生、创作者、独立开发者、家庭用户等。"}


def collect_supported_platforms(root: Path, project_files: list[Path], identity: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    platforms = []
    all_rel = [rel(root, path).replace("\\", "/") for path in project_files]
    joined = "\n".join(all_rel).lower()

    def add(name: str, status: str, reason: str, sources: list[str]) -> None:
        ev_id = evidence_add(evidence, "supported_platforms", sources[0] if sources else "repo-scan", name, root, status=status, note=reason)
        platforms.append({"platform": name, "status": status, "reason": reason, "sources": sources[:8], "evidence_id": ev_id})

    android_sources = []
    for source in identity.get("sources", []):
        package = str(source.get("package") or "")
        if package.startswith("com.") or "android" in str(source.get("type", "")):
            android_sources.append(source["source"])
    android_sources.extend(path for path in all_rel if path.endswith("AndroidManifest.xml") or path.startswith("android/"))
    if android_sources:
        add("Android", "observed", "发现 Android package、AndroidManifest 或 Android 工程信号。", unique_strings(android_sources))

    ios_sources = [path for path in all_rel if path.endswith("Info.plist") or path.startswith("ios/")]
    if ios_sources:
        add("iOS", "observed", "发现 iOS Info.plist 或 iOS 工程信号。", unique_strings(ios_sources))
    elif (root / "app.json").exists() and "expo" in joined:
        add("iOS", "inferred", "Expo 项目通常可支持 iOS，但 repo 中未发现明确 iOS bundle 配置。", ["app.json"])

    web_sources = [path for path in all_rel if path in {"index.html", "vite.config.js", "next.config.js"} or path.startswith("web/") or "/h5" in path.lower()]
    if web_sources:
        add("Web/H5", "observed", "发现 Web/H5 入口或相关源码。", unique_strings(web_sources))

    package_json = load_json(root / "package.json")
    deps = {}
    if isinstance(package_json, dict):
        for key in ("dependencies", "devDependencies"):
            if isinstance(package_json.get(key), dict):
                deps.update(package_json[key])
    if "react-native" in deps or "expo" in deps:
        add("React Native/Expo", "observed", "package.json 包含 React Native/Expo 依赖。", ["package.json"])

    if (root / "mobile" / "manifest.json").exists() or any(path.startswith("mobile/") or "uni_modules" in path for path in all_rel):
        add("uni-app", "observed", "发现 uni-app manifest 或 mobile 工程目录。", ["mobile/manifest.json"] if (root / "mobile" / "manifest.json").exists() else all_rel[:1])

    if not platforms:
        status = "missing"
        action = "提供 app 支持平台清单和每个平台的发布范围。"
    elif any(item["status"] == "inferred" for item in platforms):
        status = "inferred"
        action = "确认哪些平台属于本次上架/发布范围，尤其是仅由框架能力推断的平台。"
    else:
        status = "observed"
        action = ""
    return {
        "status": status,
        "value": platforms,
        "reason": "发现平台证据。" if platforms else "未发现可识别平台证据。",
        "evidence_ids": [item["evidence_id"] for item in platforms],
        "human_action": action,
    }


def collect_privacy(root: Path, project_files: list[Path], docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = launch_json.get("privacy")
    if explicit:
        ev_id = evidence_add(evidence, "privacy", "launch-info-json", explicit, root, note="显式 privacy launch info。")
        return {"status": "observed", "value": explicit, "sdk_candidates": [], "data_signal_candidates": [], "document_evidence": [], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了隐私信息。", "human_action": "人工确认数据收集、用途、共享、追踪和第三方 SDK 与最终隐私披露一致。"}

    deps = package_dependencies(root)
    uni_module_names = []
    uni_modules_dir = root / "mobile" / "uni_modules"
    if uni_modules_dir.exists():
        uni_module_names = sorted(path.name for path in uni_modules_dir.iterdir() if path.is_dir())[:20]
    sdk_candidates = []
    for sdk_name, hints in SDK_HINTS.items():
        matched = [name for name in deps if any(hint.casefold() in name.casefold() for hint in hints)]
        path_matches = [rel(root, path) for path in project_files if any(hint.casefold() in rel(root, path).casefold() for hint in hints)][:8]
        if sdk_name == "uni_app" and uni_module_names:
            path_matches.extend(f"mobile/uni_modules/{name}" for name in uni_module_names[:8])
        if matched or path_matches:
            ev_id = evidence_add(evidence, "privacy", "package.json" if matched else path_matches[0], {"sdk": sdk_name, "dependencies": matched, "paths": path_matches[:5]}, root, status="inferred", note="第三方 SDK/服务候选。")
            sdk_candidates.append({"name": sdk_name, "dependencies": matched, "paths": path_matches[:5], "evidence_id": ev_id})

    data_candidates = []
    for category, patterns in DATA_SIGNAL_PATTERNS.items():
        hits = scan_patterns(root, project_files, patterns, path_only=True, max_hits=8)
        if hits:
            ev_id = evidence_add(evidence, "privacy", hits[0]["source"], category, root, status="inferred", note="由 schema/API/文件名推断的数据类别。")
            data_candidates.append({"category": category, "signals": hits[:6], "evidence_id": ev_id})

    doc_rows = collect_doc_field(docs, "privacy", SECTION_LABELS["privacy"], evidence, root, max_items=6)
    permissions = []
    for path in project_files:
        if path.name == "AndroidManifest.xml":
            parsed = parse_android_manifest(root, path)
            if parsed and parsed.get("permissions"):
                ev_id = evidence_add(evidence, "privacy", path, parsed["permissions"], root, status="observed", note="Android permissions。")
                permissions.append({"source": rel(root, path), "permissions": parsed["permissions"], "evidence_id": ev_id})

    if data_candidates or sdk_candidates or doc_rows or permissions:
        status = "inferred"
        reason = "发现隐私/数据/SDK 相关证据，但是否收集、用途、共享、追踪仍需人工确认。"
    else:
        status = "needs_human"
        reason = "未发现足够隐私信息；不能证明收集哪些数据或是否使用第三方 SDK。"

    return {
        "status": status,
        "value": {
            "data_categories": [item["category"] for item in data_candidates],
            "third_party_sdk_candidates": [item["name"] for item in sdk_candidates],
            "android_permissions": permissions,
        },
        "sdk_candidates": sdk_candidates,
        "data_signal_candidates": data_candidates,
        "document_evidence": doc_rows,
        "evidence_ids": [item["evidence_id"] for item in [*sdk_candidates, *data_candidates]],
        "reason": reason,
        "human_action": "补充并确认：实际收集的数据、是否关联身份、是否追踪、是否共享、第三方 SDK 用途、隐私政策 URL。",
    }


def collect_account_system(root: Path, project_files: list[Path], docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = launch_json.get("account_system")
    if explicit:
        ev_id = evidence_add(evidence, "account_system", "launch-info-json", explicit, root, note="显式 account_system launch info。")
        return {"status": "observed", "value": explicit, "signals": [], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了账号系统信息。", "human_action": ""}

    signals = scan_patterns(root, project_files, ACCOUNT_PATTERNS, max_hits=20)
    mandatory = scan_patterns(root, project_files, MANDATORY_LOGIN_PATTERNS, max_hits=8)
    doc_rows = collect_doc_field(docs, "account_system", SECTION_LABELS["account"], evidence, root, max_items=6)
    evidence_ids = []
    if signals:
        evidence_ids.append(evidence_add(evidence, "account_system", signals[0]["source"], signals[:6], root, status="inferred", note="发现账号/登录相关实现信号。"))
    if mandatory:
        evidence_ids.append(evidence_add(evidence, "account_system", mandatory[0]["source"], mandatory[:3], root, status="observed", note="发现必须登录相关表述。"))

    if mandatory:
        status = "observed"
        must_login: bool | str = True
        reason = "发现必须登录相关表述。"
        action = "人工确认该登录要求是否适用于上架版本和截图路径。"
    elif signals or doc_rows:
        status = "needs_human"
        must_login = "NEED_HUMAN"
        reason = "发现账号/登录能力信号，但没有证明 app 是否必须登录。"
        action = "说明是否必须登录、哪些功能可游客使用、是否提供账号删除/注销入口。"
    else:
        status = "needs_human"
        must_login = "NEED_HUMAN"
        reason = "未发现账号系统结论；不能证明是否必须登录。"
        action = "确认是否有账号系统、是否必须登录、登录方式和账号删除流程。"
    return {"status": status, "value": {"account_signals_found": bool(signals or doc_rows), "must_login": must_login}, "signals": signals[:12], "mandatory_login_signals": mandatory[:5], "document_evidence": doc_rows, "evidence_ids": evidence_ids, "reason": reason, "human_action": action}


def collect_subscription_iap(root: Path, project_files: list[Path], docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = launch_json.get("subscription_iap")
    if explicit:
        ev_id = evidence_add(evidence, "subscription_iap", "launch-info-json", explicit, root, note="显式 subscription/IAP launch info。")
        return {"status": "observed", "value": explicit, "signals": [], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了订阅/内购信息。", "human_action": ""}

    signals = scan_patterns(root, project_files, MONETIZATION_PATTERNS, max_hits=20)
    doc_rows = collect_doc_field(docs, "subscription_iap", SECTION_LABELS["monetization"], evidence, root, max_items=6)
    if signals or doc_rows:
        ev_id = evidence_add(evidence, "subscription_iap", signals[0]["source"] if signals else doc_rows[0]["source"], (signals or doc_rows)[:6], root, status="inferred", note="发现订阅/支付/权益相关信号。")
        return {
            "status": "inferred",
            "value": {"monetization_signals_found": True, "has_iap_or_subscription": "LIKELY_YES"},
            "signals": signals[:12],
            "document_evidence": doc_rows,
            "evidence_ids": [ev_id],
            "reason": "发现订阅/支付/权益信号，但上架版本是否启用 IAP/订阅/试用仍需人工确认。",
            "human_action": "确认是否有 IAP、订阅、试用、价格、支付渠道，以及 Google Play Billing 合规路径。",
        }
    return {"status": "needs_human", "value": {"monetization_signals_found": False, "has_iap_or_subscription": "NEED_HUMAN"}, "signals": [], "document_evidence": [], "evidence_ids": [], "reason": "未发现订阅/内购/支付信号；这不能证明上架版本没有 IAP 或订阅。", "human_action": "确认是否有 IAP、订阅、试用、一次性购买或外部支付。"}


def collect_support(root: Path, docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = launch_json.get("support")
    if explicit:
        ev_id = evidence_add(evidence, "support", "launch-info-json", explicit, root, note="显式 support launch info。")
        return {"status": "observed", "value": explicit, "candidates": [], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了支持方式。", "human_action": ""}

    candidates = []
    for doc in docs:
        emails = unique_strings(EMAIL.findall(doc["text"]))
        support_urls = unique_strings(SUPPORT_URL_HINT.findall(doc["text"]))
        if not support_urls:
            support_urls = [url for url in unique_strings(ANY_URL.findall(doc["text"])) if any(hint in url.lower() for hint in ("support", "help", "faq", "contact"))]
        if emails or support_urls:
            ev_id = evidence_add(evidence, "support", doc["source"], {"emails": emails[:5], "urls": support_urls[:5]}, root, note="从文档中提取 support 联系方式候选。")
            candidates.append({"source": doc["source"], "emails": emails[:5], "urls": support_urls[:5], "evidence_id": ev_id})
    section_rows = collect_doc_field(docs, "support", SECTION_LABELS["support"], evidence, root, max_items=6)
    if candidates:
        return {"status": "observed", "value": {"contacts": candidates, "sections": section_rows}, "candidates": candidates, "document_evidence": section_rows, "evidence_ids": [item["evidence_id"] for item in candidates], "reason": "发现 support/email/FAQ 候选。", "human_action": "人工确认该联系方式可公开用于商店 listing。"}
    if section_rows:
        return {"status": "needs_human", "value": {"contacts": [], "sections": section_rows}, "candidates": [], "document_evidence": section_rows, "evidence_ids": [row["evidence_id"] for row in section_rows], "reason": "只发现 support/help 文字段落，未发现可公开 support URL、email 或 FAQ。", "human_action": "提供可公开的 support URL、support email 或 FAQ/help center。"}
    return {"status": "missing", "value": "NEED_HUMAN", "candidates": [], "document_evidence": [], "evidence_ids": [], "reason": "未发现 support URL、email 或 FAQ。", "human_action": "提供可公开的 support URL、support email 或 FAQ/help center。"}


def collect_demo_data(root: Path, project_files: list[Path], docs: list[dict[str, str]], launch_json: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    explicit = launch_json.get("screenshot_demo_data")
    if explicit:
        ev_id = evidence_add(evidence, "screenshot_demo_data", "launch-info-json", explicit, root, note="显式 screenshot demo data。")
        return {"status": "observed", "value": explicit, "signals": [], "evidence_ids": [ev_id], "reason": "显式 launch info 提供了截图 demo 数据。", "human_action": ""}

    signals = scan_patterns(root, project_files, DEMO_PATTERNS, path_only=True, max_hits=24)
    doc_rows = collect_doc_field(docs, "screenshot_demo_data", SECTION_LABELS["demo_data"], evidence, root, max_items=8)
    if signals or doc_rows:
        ev_id = evidence_add(evidence, "screenshot_demo_data", signals[0]["source"] if signals else doc_rows[0]["source"], (signals or doc_rows)[:8], root, status="inferred", note="发现 fixture/seed/demo/scenario 候选。")
        return {
            "status": "inferred",
            "value": {"demo_data_signals_found": True, "example_sources": signals[:12]},
            "signals": signals[:16],
            "document_evidence": doc_rows,
            "evidence_ids": [ev_id],
            "reason": "发现 demo/fixture/scenario 数据候选，但未证明这些数据覆盖所有商店截图。",
            "human_action": "确认截图所需示例用户、示例项目、示例结果，并保证不展示不存在的功能。",
        }
    return {"status": "missing", "value": "NEED_HUMAN", "signals": [], "document_evidence": [], "evidence_ids": [], "reason": "未发现截图 demo 数据来源。", "human_action": "提供截图使用的示例用户、示例项目、示例结果或 seed/fixture 数据。"}


def build_blockers(fields: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    labels = {
        "app_name": "App 名称",
        "positioning": "一句话定位",
        "core_features": "核心功能",
        "target_users": "目标用户",
        "supported_platforms": "支持平台",
        "privacy": "隐私相关",
        "account_system": "账号系统",
        "subscription_iap": "订阅/内购",
        "support": "支持方式",
        "screenshot_demo_data": "截图 demo 数据",
    }
    blockers = []
    for field_id, data in fields.items():
        status = data.get("status")
        if status in {"observed", "inferred"}:
            continue
        blockers.append(
            {
                "field_id": field_id,
                "label": labels.get(field_id, field_id),
                "status": status,
                "reason": data.get("reason") or "字段缺少可用证据。",
                "unblock_action": data.get("human_action") or "提供该字段的明确 launch 信息后重跑。",
            }
        )
    return blockers


def field_for_report(label: str, field_value: dict[str, Any]) -> list[str]:
    value = field_value.get("value")
    if isinstance(value, dict):
        value_text = json.dumps(value, ensure_ascii=False)
    elif isinstance(value, list):
        if all(isinstance(item, dict) and "platform" in item for item in value):
            value_text = "；".join(f"{item['platform']}({item['status']})" for item in value)
        else:
            value_text = "；".join(str(item) for item in value)
    else:
        value_text = str(value)
    evidence_ids = ", ".join(field_value.get("evidence_ids") or [])
    return [label, f"`{field_value.get('status')}`", compact(value_text, 150), evidence_ids or "-", field_value.get("human_action") or "-"]


def markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    header = "| " + " | ".join(rows[0]) + " |"
    sep = "| " + " | ".join("---" for _ in rows[0]) + " |"
    body = ["| " + " | ".join(str(cell).replace("\n", " ") for cell in row) + " |" for row in rows[1:]]
    return "\n".join([header, sep, *body])


def render_evidence_summary(evidence: list[dict[str, Any]]) -> str:
    if not evidence:
        return "- 无证据。"
    lines = []
    for row in evidence[:18]:
        lines.append(f"- `{row['id']}` `{row['field_id']}` from `{row['source']}`：{row['excerpt']}")
    if len(evidence) > 18:
        lines.append(f"- 另有 {len(evidence) - 18} 条证据见 JSONL。")
    return "\n".join(lines)


def final_summary(data: dict[str, Any]) -> str:
    fields = data["fields"]
    observed = [key for key, value in fields.items() if value.get("status") == "observed"]
    inferred = [key for key, value in fields.items() if value.get("status") == "inferred"]
    blockers = data["blockers"]
    lines = [f"- 当前 launch-info-collector 总状态：`{data['overall_status']}`。"]
    if blockers:
        lines.append(f"- 不能交给下游作为完整 source-of-truth：还有 {len(blockers)} 个字段缺失、冲突或必须人工确认。")
        priority = "；".join(f"{item['label']}：{item['unblock_action'].rstrip('。')}" for item in blockers[:5])
        lines.append(f"- 优先处理：{priority}。")
    else:
        lines.append("- 关键 launch 信息已有证据，可作为下游 listing、截图规划和 data safety 准备的输入草稿。")
    if inferred:
        lines.append(f"- 推断字段需要人工复核：{', '.join(inferred)}。")
    if observed:
        lines.append(f"- 已有明确证据字段：{', '.join(observed)}。")
    lines.append("- 本报告只收集和归类 launch 信息，不执行任何发布动作。")
    return "\n".join(lines)


def render_report(data: dict[str, Any]) -> str:
    fields = data["fields"]
    table_rows = [["字段", "状态", "当前值/候选", "证据", "人类需要做什么"]]
    labels = [
        ("App 名称", "app_name"),
        ("一句话定位", "positioning"),
        ("核心功能", "core_features"),
        ("目标用户", "target_users"),
        ("支持平台", "supported_platforms"),
        ("隐私相关", "privacy"),
        ("账号系统", "account_system"),
        ("订阅/内购", "subscription_iap"),
        ("支持方式", "support"),
        ("截图 demo 数据", "screenshot_demo_data"),
    ]
    for label, field_id in labels:
        table_rows.append(field_for_report(label, fields[field_id]))

    blocker_lines = [
        f"- `{item['label']}` status=`{item['status']}`：{item['reason']} 解除方式：{item['unblock_action']}"
        for item in data["blockers"]
    ] or ["- 无。"]
    identity = fields["app_name"]
    identity_lines = [
        f"- 产品名候选：{', '.join(identity.get('candidates') or []) or '无'}",
        f"- 备用/技术名候选：{', '.join(identity.get('alternate_names') or []) or '无'}",
    ]

    return f"""# launch-info-collector 上架信息收集报告

生成时间：`{data['generated_at']}`

## 总状态
- overall_status: `{data['overall_status']}`
- proof_mode: `{data['proof_mode']}`
- 输出目录：`{data['output_dir']}`

## Launch 信息矩阵
{markdown_table(table_rows)}

## App 名称候选
{chr(10).join(identity_lines)}

## 证据摘要
{render_evidence_summary(data['evidence'])}

## 阻塞项
{chr(10).join(blocker_lines)}

## 总结
{final_summary(data)}
"""


def build_output(root: Path, output_dir: Path, source_json: list[str], source_docs: list[str]) -> dict[str, Any]:
    evidence: list[dict[str, Any]] = []
    project_files = iter_project_files(root)
    launch_json = collect_launch_json(root, source_json, evidence)
    docs = collect_document_sources(root, project_files, source_docs)
    identity = collect_identity(root, project_files, launch_json, evidence)
    fields = {
        "app_name": identity,
        "positioning": build_positioning(docs, launch_json, evidence, root),
        "core_features": build_core_features(root, project_files, docs, launch_json, evidence),
        "target_users": build_target_users(docs, launch_json, evidence, root),
        "supported_platforms": collect_supported_platforms(root, project_files, identity, evidence),
        "privacy": collect_privacy(root, project_files, docs, launch_json, evidence),
        "account_system": collect_account_system(root, project_files, docs, launch_json, evidence),
        "subscription_iap": collect_subscription_iap(root, project_files, docs, launch_json, evidence),
        "support": collect_support(root, docs, launch_json, evidence),
        "screenshot_demo_data": collect_demo_data(root, project_files, docs, launch_json, evidence),
    }
    blockers = build_blockers(fields)
    overall_status = "blocked" if blockers else "pass"
    generated_files = {
        "human_report": rel(root, output_dir / REPORT_FILENAMES["human"]),
        "machine_report": rel(root, output_dir / REPORT_FILENAMES["machine"]),
        "source_of_truth": rel(root, output_dir / REPORT_FILENAMES["source"]),
        "evidence_jsonl": rel(root, output_dir / REPORT_FILENAMES["evidence"]),
    }
    source_of_truth = {
        "schema_version": SOURCE_SCHEMA_VERSION,
        "status": "complete" if overall_status == "pass" else "draft_blocked",
        "can_use_as_final_launch_truth": overall_status == "pass",
        "fields": fields,
        "blockers": blockers,
        "limitations": [
            "inferred 字段需要人类复核后才能作为最终商店信息。",
            "本输出只作为上架信息收集结果，不执行任何发布动作。",
            "隐私、账号、订阅和支持方式必须由产品/法务/运营 owner 最终确认。",
        ],
    }
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "proof_mode": "parsed_repo_evidence",
        "overall_status": overall_status,
        "output_dir": rel(root, output_dir),
        "scanned_file_count": len(project_files),
        "document_source_count": len(docs),
        "document_sources": [doc["source"] for doc in docs],
        "fields": fields,
        "blockers": blockers,
        "evidence": evidence,
        "source_of_truth": source_of_truth,
        "generated_files": generated_files,
    }


def write_outputs(output_dir: Path, data: dict[str, Any]) -> None:
    write_json(output_dir / REPORT_FILENAMES["machine"], data)
    write_json(output_dir / REPORT_FILENAMES["source"], data["source_of_truth"])
    write_text(output_dir / REPORT_FILENAMES["human"], render_report(data))
    evidence_path = output_dir / REPORT_FILENAMES["evidence"]
    evidence_path.parent.mkdir(parents=True, exist_ok=True)
    evidence_path.write_text("".join(json.dumps(row, ensure_ascii=False) + "\n" for row in data["evidence"]), encoding="utf-8", newline="\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect app launch information evidence.")
    parser.add_argument("root_arg", nargs="?", help="Project root. Kept for validate.py compatibility.")
    parser.add_argument("--root", help="Project root.")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Report output directory.")
    parser.add_argument("--source-json", action="append", default=[], help="Explicit launch-info JSON path. Can be passed multiple times.")
    parser.add_argument("--source", action="append", default=[], help="Explicit product/launch text source. Can be passed multiple times.")
    parser.add_argument("--no-write", action="store_true", help="Build output in memory without writing files.")
    args = parser.parse_args()

    root = Path(args.root or args.root_arg or ".").resolve()
    output_dir = (root / args.output_dir).resolve()
    data = build_output(root, output_dir, args.source_json, args.source)
    if not args.no_write:
        write_outputs(output_dir, data)
    print(f"overall_status={data['overall_status']}")
    print(f"proof_mode={data['proof_mode']}")
    print(f"human_report={(output_dir / REPORT_FILENAMES['human']).as_posix()}")
    print(f"machine_report={(output_dir / REPORT_FILENAMES['machine']).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
