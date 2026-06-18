#!/usr/bin/env python3
"""Prepare and validate generic Google Play main store listing drafts."""

from __future__ import annotations

import argparse
import json
import os
import re
import struct
import subprocess
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCHEMA_VERSION = "google_play_listing_output.v2"
FIELD_LIMITS = {
    "appName": 30,
    "shortDescription": 80,
    "fullDescription": 4000,
}
REPORT_FILENAMES = {
    "human": "google-play-listing.zh.md",
    "machine": "google-play-listing-output.json",
    "source": "google-play-listing-source-of-truth.json",
    "drafts": "google-play-listing-drafts.json",
}
IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".webm"}
IGNORED_SCAN_DIRS = {
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
    "build",
    "dist",
    "node_modules",
    "Pods",
    "DerivedData",
}
LISTING_JSON_CANDIDATES = (
    "google-play-listing.json",
    "play-store-listing.json",
    "store-listing.json",
    "listing.json",
    "metadata/google-play-listing.json",
    "metadata/play-store-listing.json",
    "store/google-play-listing.json",
    "play-store/google-play-listing.json",
    "play-store-launch/inputs/google-play-listing.json",
)
FASTLANE_METADATA_DIRS = (
    "fastlane/metadata/android",
    "metadata/android",
)
COMMON_ASSET_HINTS = (
    "fastlane/metadata/android",
    "metadata/android",
    "play-store",
    "store-assets",
    "store_assets",
    "google-play",
    "screenshots",
    "assets",
)
HARD_FORBIDDEN_PATTERNS = {
    "rank_or_award": [
        r"#\s*1",
        r"\btop\s*\d+\b",
        r"\bbest\b",
        r"\baward[-\s]?winning\b",
        r"\bnumber\s*one\b",
        r"第一",
        r"最佳",
        r"获奖",
    ],
    "price_or_promo": [
        r"\bfree\b",
        r"\bsale\b",
        r"\bdiscount\b",
        r"\blimited\s*time\b",
        r"免费",
        r"限时",
        r"折扣",
        r"优惠",
        r"促销",
    ],
    "store_or_review_claim": [
        r"Google Play",
        r"Play Store",
        r"approved",
        r"submitted",
        r"审核通过",
        r"已上架",
        r"已提交",
    ],
    "excessive_formatting": [
        r"!{2,}",
        r"\?{2,}",
        r"[A-Z]{8,}",
    ],
}
REVIEW_PATTERNS = {
    "third_party_brand_or_platform": [
        r"Barron'?s",
        r"Reader'?s Digest",
        r"The Atlantic",
        r"The Economist",
        r"\bScience\b",
        r"Netflix",
        r"Spotify",
        r"YouTube",
        r"OpenAI",
        r"Google",
        r"Apple",
    ],
}
PLACEHOLDER_PATTERNS = (
    r"\bTODO\b",
    r"\bTBD\b",
    r"placeholder",
    r"lorem ipsum",
    r"sample app",
    r"demo app",
    r"test app",
    r"coming soon",
    r"compile-targeted",
    r"stage [a-z0-9._-]+",
)
OFFICIAL_REQUIREMENTS = {
    "appName": "Google Play app title <= 30 characters.",
    "shortDescription": "Google Play short description <= 80 characters.",
    "fullDescription": "Google Play full description <= 4000 characters.",
    "appIcon": "512x512 PNG, 32-bit, <= 1024KB.",
    "featureGraphic": "1024x500 JPEG or 24-bit PNG.",
    "screenshots": "At least 2 screenshots for the target form factor; screenshots should show real app experience.",
    "video": "Promo video is optional preview media.",
    "metadataPolicy": "Do not use misleading, irrelevant, excessively formatted, inappropriate, ranking, price, or promotional metadata.",
}


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
    if not path.exists():
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


def run_git_ls_files(root: Path) -> list[Path]:
    try:
        completed = subprocess.run(
            ["git", "ls-files", "--cached", "--others", "--exclude-standard"],
            cwd=root,
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=20,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
    if completed.returncode != 0:
        return []
    return [(root / line).resolve() for line in completed.stdout.splitlines() if (root / line).is_file()]


def iter_project_files(root: Path) -> list[Path]:
    tracked = run_git_ls_files(root)
    if tracked:
        return tracked
    files: list[Path] = []
    for current, dirs, names in os.walk(root):
        dirs[:] = [name for name in dirs if name not in IGNORED_SCAN_DIRS]
        for name in names:
            files.append(Path(current) / name)
    return files


def is_placeholder(value: str) -> bool:
    return any(re.search(pattern, value, flags=re.I) for pattern in PLACEHOLDER_PATTERNS)


def first_text(*values: Any) -> str | None:
    for value in values:
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def parse_png(path: Path) -> dict[str, Any] | None:
    try:
        header = path.read_bytes()[:33]
    except OSError:
        return None
    if len(header) < 33 or not header.startswith(b"\x89PNG\r\n\x1a\n"):
        return None
    width, height = struct.unpack(">II", header[16:24])
    bit_depth = header[24]
    color_type = header[25]
    return {
        "format": "png",
        "width": width,
        "height": height,
        "bit_depth": bit_depth,
        "color_type": color_type,
        "is_32_bit_png": bit_depth == 8 and color_type == 6,
        "is_24_bit_png": bit_depth == 8 and color_type == 2,
    }


def parse_jpeg(path: Path) -> dict[str, Any] | None:
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if not data.startswith(b"\xff\xd8"):
        return None
    idx = 2
    while idx + 9 < len(data):
        if data[idx] != 0xFF:
            idx += 1
            continue
        marker = data[idx + 1]
        idx += 2
        if marker in {0xD8, 0xD9}:
            continue
        if idx + 2 > len(data):
            break
        size = struct.unpack(">H", data[idx : idx + 2])[0]
        if size < 2 or idx + size > len(data):
            break
        if marker in range(0xC0, 0xC4) or marker in range(0xC5, 0xC8) or marker in range(0xC9, 0xCC) or marker in range(0xCD, 0xD0):
            height = struct.unpack(">H", data[idx + 3 : idx + 5])[0]
            width = struct.unpack(">H", data[idx + 5 : idx + 7])[0]
            return {"format": "jpeg", "width": width, "height": height}
        idx += size
    return {"format": "jpeg", "width": None, "height": None}


def image_info(path: Path) -> dict[str, Any] | None:
    ext = path.suffix.lower()
    parsed = parse_png(path) if ext == ".png" else parse_jpeg(path)
    if not parsed:
        return None
    parsed["path"] = path
    parsed["bytes"] = path.stat().st_size
    return parsed


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
    base = manifest_path.parent
    candidate_dirs = [
        base / "res" / "values",
        base.parent / "res" / "values",
        root / "android" / "app" / "src" / "main" / "res" / "values",
        root / "app" / "src" / "main" / "res" / "values",
    ]
    for directory in candidate_dirs:
        if not directory.exists():
            continue
        for path in directory.glob("*.xml"):
            values = parse_strings_xml(path)
            if key in values:
                return values[key]
    return None


def parse_android_manifest(root: Path, path: Path) -> dict[str, Any] | None:
    try:
        manifest = ET.fromstring(read_text(path))
    except ET.ParseError:
        return None
    namespace = "{http://schemas.android.com/apk/res/android}"
    application = manifest.find("application")
    label = None
    if application is not None:
        raw_label = application.attrib.get(namespace + "label")
        if raw_label:
            label = resolve_android_string(root, path, raw_label)
    return {
        "source": rel(root, path),
        "appName": label,
        "package": manifest.attrib.get("package"),
        "description": None,
    }


def parse_pubspec(path: Path) -> dict[str, Any] | None:
    text = read_text(path)
    name = re.search(r"(?m)^name:\s*['\"]?([^'\"\n#]+)", text)
    description = re.search(r"(?m)^description:\s*['\"]?([^'\"\n#]+)", text)
    if not name and not description:
        return None
    return {
        "source": path.as_posix(),
        "appName": name.group(1).strip() if name else None,
        "description": description.group(1).strip() if description else None,
    }


def collect_identity(root: Path, project_files: list[Path]) -> dict[str, Any]:
    sources: list[dict[str, Any]] = []
    app_json = load_json(root / "app.json")
    if isinstance(app_json, dict):
        expo = app_json.get("expo") if isinstance(app_json.get("expo"), dict) else app_json
        sources.append(
            {
                "source": "app.json",
                "type": "expo_or_app_json",
                "appName": first_text(expo.get("name"), expo.get("displayName")),
                "description": first_text(expo.get("description")),
                "package": first_text((expo.get("android") or {}).get("package") if isinstance(expo.get("android"), dict) else None),
            }
        )
    capacitor = load_json(root / "capacitor.config.json")
    if isinstance(capacitor, dict):
        sources.append(
            {
                "source": "capacitor.config.json",
                "type": "capacitor",
                "appName": first_text(capacitor.get("appName")),
                "description": None,
                "package": first_text(capacitor.get("appId")),
            }
        )
    package_json = load_json(root / "package.json")
    if isinstance(package_json, dict):
        sources.append(
            {
                "source": "package.json",
                "type": "package_json",
                "appName": first_text(package_json.get("displayName"), package_json.get("productName"), package_json.get("name")),
                "description": first_text(package_json.get("description")),
                "package": first_text(package_json.get("name")),
            }
        )
    uni_manifest = load_json(root / "manifest.json")
    mobile_uni_manifest = load_json(root / "mobile" / "manifest.json")
    for source_name, data in (("manifest.json", uni_manifest), ("mobile/manifest.json", mobile_uni_manifest)):
        if isinstance(data, dict):
            sources.append(
                {
                    "source": source_name,
                    "type": "uni_app_manifest",
                    "appName": first_text(data.get("name")),
                    "description": first_text(data.get("description")),
                    "package": first_text(data.get("appid")),
                }
            )
    for path in project_files:
        relative = rel(root, path)
        if relative.endswith("AndroidManifest.xml") and "/src/main/" in relative.replace("\\", "/"):
            parsed = parse_android_manifest(root, path)
            if parsed:
                parsed["type"] = "android_manifest"
                sources.append(parsed)
        elif path.name == "pubspec.yaml":
            parsed = parse_pubspec(path)
            if parsed:
                parsed["source"] = relative
                parsed["type"] = "flutter_pubspec"
                sources.append(parsed)
    app_name = first_text(*(source.get("appName") for source in sources))
    description = first_text(*(source.get("description") for source in sources))
    package_name = first_text(*(source.get("package") for source in sources))
    warnings = []
    if app_name and is_placeholder(app_name):
        warnings.append("appName 看起来像占位或测试名称。")
    if description and is_placeholder(description):
        warnings.append("description 看起来像工程占位描述，不能直接作为商店描述。")
    return {
        "app_name": app_name,
        "description": description,
        "package": package_name,
        "sources": sources,
        "warnings": warnings,
    }


def normalize_listing_fields(raw: dict[str, Any], source: str) -> dict[str, Any]:
    return {
        "source": source,
        "appName": first_text(raw.get("appName"), raw.get("title"), raw.get("name")),
        "shortDescription": first_text(raw.get("shortDescription"), raw.get("short_description"), raw.get("short")),
        "fullDescription": first_text(raw.get("fullDescription"), raw.get("full_description"), raw.get("description")),
        "privacyPolicyUrl": first_text(raw.get("privacyPolicyUrl"), raw.get("privacy_policy_url"), raw.get("privacyUrl")),
        "contactEmail": first_text(raw.get("contactEmail"), raw.get("developerEmail"), raw.get("email")),
        "category": first_text(raw.get("category")),
        "contentRating": first_text(raw.get("contentRating"), raw.get("content_rating")),
        "targetAudience": first_text(raw.get("targetAudience"), raw.get("target_audience")),
        "video": first_text(raw.get("video"), raw.get("promoVideo"), raw.get("promo_video")),
    }


def collect_listing_json(root: Path, explicit_paths: list[str]) -> dict[str, dict[str, Any]]:
    paths = [root / item for item in explicit_paths]
    paths.extend(root / item for item in LISTING_JSON_CANDIDATES)
    listings: dict[str, dict[str, Any]] = {}
    for path in paths:
        if not path.exists() or not path.is_file():
            continue
        data = load_json(path)
        if not isinstance(data, dict):
            continue
        source = rel(root, path)
        locale_maps = data.get("locales") or data.get("listings") or data.get("localized")
        if isinstance(locale_maps, dict):
            for locale, raw in locale_maps.items():
                if isinstance(raw, dict):
                    listings[str(locale)] = normalize_listing_fields(raw, source)
            continue
        locale = str(data.get("locale") or "default")
        listings[locale] = normalize_listing_fields(data, source)
    return listings


def read_fastlane_text(locale_dir: Path, filename: str) -> str | None:
    path = locale_dir / filename
    if path.exists():
        value = read_text(path).strip()
        return value or None
    return None


def collect_fastlane_metadata(root: Path) -> dict[str, dict[str, Any]]:
    listings: dict[str, dict[str, Any]] = {}
    for relative_root in FASTLANE_METADATA_DIRS:
        metadata_root = root / relative_root
        if not metadata_root.exists():
            continue
        for locale_dir in metadata_root.iterdir():
            if not locale_dir.is_dir() or locale_dir.name == "images":
                continue
            fields = {
                "source": rel(root, locale_dir),
                "appName": read_fastlane_text(locale_dir, "title.txt"),
                "shortDescription": read_fastlane_text(locale_dir, "short_description.txt"),
                "fullDescription": read_fastlane_text(locale_dir, "full_description.txt"),
                "video": read_fastlane_text(locale_dir, "video.txt"),
                "privacyPolicyUrl": None,
                "contactEmail": None,
                "category": None,
                "contentRating": None,
                "targetAudience": None,
            }
            if any(fields.get(key) for key in ("appName", "shortDescription", "fullDescription")):
                listings[locale_dir.name] = fields
    return listings


def collect_human_fields(listings: dict[str, dict[str, Any]]) -> dict[str, Any]:
    def first_field(name: str) -> str | None:
        return first_text(*(listing.get(name) for listing in listings.values()))

    fields = {
        "privacy_policy_url": first_field("privacyPolicyUrl"),
        "developer_contact_email": first_field("contactEmail"),
        "category": first_field("category"),
        "content_rating": first_field("contentRating"),
        "target_audience": first_field("targetAudience"),
    }
    output = {}
    for key, value in fields.items():
        output[key] = {
            "value": value or "NEED_HUMAN",
            "status": "candidate_found" if value else "missing",
            "human_review_required": True,
            "reason": "需要人工确认该字段适用于当前 app 和 Google Play Console。" if value else "未在 listing metadata 中发现该字段。",
        }
    return output


def build_drafts(identity: dict[str, Any], listings: dict[str, dict[str, Any]]) -> dict[str, dict[str, Any]]:
    identity_description = identity.get("description")
    if isinstance(identity_description, str) and is_placeholder(identity_description):
        identity_description = None
    if not listings:
        listings = {
            "default": {
                "source": "app_identity_candidates",
                "appName": identity.get("app_name"),
                "shortDescription": None,
                "fullDescription": identity_description,
                "privacyPolicyUrl": None,
                "contactEmail": None,
                "category": None,
                "contentRating": None,
                "targetAudience": None,
                "video": None,
            }
        }
    drafts: dict[str, dict[str, Any]] = {}
    for locale, listing in listings.items():
        drafts[locale] = {
            "locale": locale,
            "status": "draft",
            "source": listing.get("source"),
            "appName": first_text(listing.get("appName"), identity.get("app_name")) or "NEED_HUMAN",
            "shortDescription": first_text(listing.get("shortDescription")) or "NEED_HUMAN",
            "fullDescription": first_text(listing.get("fullDescription")) or "NEED_HUMAN",
            "privacyPolicyUrl": first_text(listing.get("privacyPolicyUrl")) or "NEED_HUMAN",
            "contactEmail": first_text(listing.get("contactEmail")) or "NEED_HUMAN",
            "category": first_text(listing.get("category")) or "NEED_HUMAN",
            "contentRating": first_text(listing.get("contentRating")) or "NEED_HUMAN",
            "targetAudience": first_text(listing.get("targetAudience")) or "NEED_HUMAN",
            "video": first_text(listing.get("video")),
            "draft_only": True,
            "can_use_for_submission": False,
        }
    return drafts


def validate_field_lengths(drafts: dict[str, dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for locale, draft in drafts.items():
        for field, limit in FIELD_LIMITS.items():
            value = str(draft.get(field) or "")
            if not value or value == "NEED_HUMAN":
                status = "blocked"
                reason = "字段缺失，需要提供真实 listing 文案。"
            elif is_placeholder(value):
                status = "blocked"
                reason = "字段像占位/测试文案，需要替换。"
            elif len(value) > limit:
                status = "fail"
                reason = f"长度 {len(value)} 超过限制 {limit}。"
            else:
                status = "pass"
                reason = "字段存在且长度合规。"
            rows.append(
                {
                    "locale": locale,
                    "field": field,
                    "length": 0 if value == "NEED_HUMAN" else len(value),
                    "limit": limit,
                    "status": status,
                    "reason": reason,
                    "value": value,
                }
            )
    return rows


def scan_policy(drafts: dict[str, dict[str, Any]]) -> dict[str, Any]:
    findings = []
    for locale, draft in drafts.items():
        for field in ("appName", "shortDescription", "fullDescription"):
            value = str(draft.get(field) or "")
            if not value or value == "NEED_HUMAN":
                continue
            for category, patterns in HARD_FORBIDDEN_PATTERNS.items():
                for pattern in patterns:
                    flags = 0 if category == "excessive_formatting" else re.I
                    if re.search(pattern, value, flags=flags):
                        findings.append(
                            {
                                "severity": "fail",
                                "locale": locale,
                                "field": field,
                                "category": category,
                                "pattern": pattern,
                                "value_excerpt": value[:160],
                            }
                        )
            for category, patterns in REVIEW_PATTERNS.items():
                for pattern in patterns:
                    if re.search(pattern, value, flags=re.I):
                        findings.append(
                            {
                                "severity": "blocked",
                                "locale": locale,
                                "field": field,
                                "category": category,
                                "pattern": pattern,
                                "value_excerpt": value[:160],
                            }
                        )
    if any(item["severity"] == "fail" for item in findings):
        status = "fail"
    elif findings:
        status = "blocked"
    else:
        status = "pass"
    return {
        "status": status,
        "findings": findings,
        "checked_categories": sorted([*HARD_FORBIDDEN_PATTERNS, *REVIEW_PATTERNS]),
    }


def asset_paths_in_scope(relative: str) -> bool:
    name = relative.lower()
    return any(hint in name for hint in COMMON_ASSET_HINTS)


def summarize_assets(root: Path, assets: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "path": item.get("relative_path") or rel(root, item["path"]),
            "format": item.get("format"),
            "width": item.get("width"),
            "height": item.get("height"),
            "bytes": item.get("bytes"),
            "valid_reason": item.get("valid_reason"),
        }
        for item in assets
    ]


def collect_asset_evidence(root: Path, project_files: list[Path], explicit_asset_dirs: list[str]) -> dict[str, Any]:
    explicit_roots = [(root / item).resolve() for item in explicit_asset_dirs]
    images: list[dict[str, Any]] = []
    videos: list[Path] = []
    for path in project_files:
        relative = rel(root, path)
        explicit_match = any(str(path.resolve()).lower().startswith(str(item).lower()) for item in explicit_roots)
        if not explicit_match and not asset_paths_in_scope(relative):
            continue
        if path.suffix.lower() in IMAGE_EXTENSIONS:
            info = image_info(path)
            if info:
                info["relative_path"] = relative
                images.append(info)
        elif path.suffix.lower() in VIDEO_EXTENSIONS:
            videos.append(path)

    icon_candidates = []
    feature_candidates = []
    screenshot_candidates = []
    for info in images:
        name = info["relative_path"].lower()
        width = info.get("width") or 0
        height = info.get("height") or 0
        if "icon" in name or "appicon" in name or "launcher" in name or (width == 512 and height == 512):
            icon_candidates.append(info)
        if "feature" in name or "featuregraphic" in name or (width == 1024 and height == 500):
            feature_candidates.append(info)
        if "screenshot" in name or "screenshots" in name or "phonescreenshots" in name or "tabletscreenshots" in name:
            screenshot_candidates.append(info)

    valid_icons = []
    for item in icon_candidates:
        if (
            item.get("format") == "png"
            and item.get("width") == 512
            and item.get("height") == 512
            and item.get("is_32_bit_png")
            and item.get("bytes", 0) <= 1024 * 1024
        ):
            item["valid_reason"] = "512x512 32-bit PNG <= 1024KB"
            valid_icons.append(item)

    valid_features = []
    for item in feature_candidates:
        if item.get("width") == 1024 and item.get("height") == 500 and (
            item.get("format") == "jpeg" or (item.get("format") == "png" and item.get("is_24_bit_png"))
        ):
            item["valid_reason"] = "1024x500 JPEG or 24-bit PNG"
            valid_features.append(item)

    valid_screenshots = []
    for item in screenshot_candidates:
        width = item.get("width") or 0
        height = item.get("height") or 0
        if min(width, height) >= 320 and max(width, height) <= 3840:
            item["valid_reason"] = "screenshot dimensions within common Google Play bounds"
            valid_screenshots.append(item)

    return {
        "app_icon": {
            "status": "pass" if valid_icons else "blocked",
            "reason": "发现合规 app icon。" if valid_icons else "未发现 512x512、32-bit PNG、<=1024KB 的 app icon。",
            "candidates": summarize_assets(root, icon_candidates[:10]),
            "valid_candidates": summarize_assets(root, valid_icons[:10]),
        },
        "feature_graphic": {
            "status": "pass" if valid_features else "blocked",
            "reason": "发现合规 feature graphic。" if valid_features else "未发现 1024x500 JPEG 或 24-bit PNG feature graphic。",
            "candidates": summarize_assets(root, feature_candidates[:10]),
            "valid_candidates": summarize_assets(root, valid_features[:10]),
        },
        "screenshots": {
            "status": "pass" if len(valid_screenshots) >= 2 else "blocked",
            "reason": "发现至少 2 张 screenshot 候选。" if len(valid_screenshots) >= 2 else "未发现至少 2 张 screenshot 候选。",
            "candidate_count": len(screenshot_candidates),
            "valid_candidate_count": len(valid_screenshots),
            "candidates": summarize_assets(root, screenshot_candidates[:10]),
            "valid_candidates": summarize_assets(root, valid_screenshots[:10]),
        },
        "video": {
            "status": "optional_candidate_found" if videos else "optional_missing",
            "reason": "发现可选 promo video 候选，仍需人工确认内容和版权。" if videos else "Promo video 是可选素材；当前未发现视频候选。",
            "candidates": [rel(root, path) for path in videos[:10]],
        },
    }


def gate_status(gates: list[dict[str, Any]]) -> str:
    statuses = [gate["status"] for gate in gates]
    if "fail" in statuses:
        return "fail"
    if "blocked" in statuses:
        return "blocked"
    return "pass"


def build_gates(
    identity: dict[str, Any],
    listings: dict[str, dict[str, Any]],
    field_rows: list[dict[str, Any]],
    policy: dict[str, Any],
    assets: dict[str, Any],
    human_fields: dict[str, Any],
) -> list[dict[str, Any]]:
    identity_status = "pass" if identity.get("app_name") and not is_placeholder(str(identity.get("app_name"))) else "blocked"
    if identity.get("app_name") and len(str(identity["app_name"])) > FIELD_LIMITS["appName"]:
        identity_status = "fail"
    listing_status = "pass" if listings else "blocked"
    text_status = gate_status([{"status": row["status"]} for row in field_rows])
    asset_status = "pass" if all(assets[key]["status"] == "pass" for key in ("app_icon", "feature_graphic", "screenshots")) else "blocked"
    human_status = "pass" if all(item["value"] != "NEED_HUMAN" for item in human_fields.values()) else "blocked"
    return [
        {
            "gate_id": "app_identity",
            "status": identity_status,
            "reason": "发现通用 app identity。" if identity_status == "pass" else "未发现可用 app name，或 app name 超长/占位。",
            "details": identity,
        },
        {
            "gate_id": "listing_metadata_source",
            "status": listing_status,
            "reason": "发现 Google Play listing metadata 输入。" if listings else "未发现 listing JSON 或 fastlane metadata；只能生成 NEED_HUMAN 草稿。",
            "sources": sorted({listing.get("source", "") for listing in listings.values() if listing.get("source")}),
        },
        {
            "gate_id": "listing_text_fields",
            "status": text_status,
            "reason": "app title、short description、full description 均存在且长度合规。" if text_status == "pass" else "存在缺失、占位或超长 listing 文案字段。",
            "field_lengths": field_rows,
        },
        {
            "gate_id": "metadata_policy",
            "status": policy["status"],
            "reason": "未发现 metadata policy 风险词。" if policy["status"] == "pass" else "listing metadata 命中 policy 风险或需人工确认的品牌/平台词。",
            "policy": policy,
        },
        {
            "gate_id": "preview_assets",
            "status": asset_status,
            "reason": "必需 preview assets 均发现合规候选。" if asset_status == "pass" else "app icon、feature graphic 或 screenshots 缺失/不合规。",
            "assets": assets,
        },
        {
            "gate_id": "human_required_fields",
            "status": human_status,
            "reason": "listing 相关人工字段均已有候选值。" if human_status == "pass" else "privacy policy URL、developer contact、category、content rating 或 target audience 仍需人工提供/确认。",
            "fields": human_fields,
        },
    ]


def blocker_action(gate: dict[str, Any]) -> str:
    actions = {
        "app_identity": "在通用 app manifest 或 listing metadata 中提供真实 app name，并保持 <= 30 字符。",
        "listing_metadata_source": "提供 Google Play listing JSON，或 fastlane metadata/android/<locale>/title.txt、short_description.txt、full_description.txt。",
        "listing_text_fields": "补齐或修正 app title、short description、full description；确保长度分别 <= 30、<= 80、<= 4000。",
        "metadata_policy": "移除误导、无关、过度格式化、不合适、排名、价格、促销、审核结果或未经确认的品牌/平台表达。",
        "preview_assets": "提供 512x512 32-bit PNG app icon、1024x500 feature graphic、至少 2 张截图；video 可选。",
        "human_required_fields": "人工提供并确认 privacy policy URL、developer contact、category、content rating 和 target audience。",
    }
    return actions.get(gate["gate_id"], "修复该 gate 报告的阻塞原因后重跑。")


def build_blockers(gates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "id": f"gate:{gate['gate_id']}",
            "status": gate["status"],
            "reason": gate["reason"],
            "unblock_action": blocker_action(gate),
        }
        for gate in gates
        if gate["status"] != "pass"
    ]


def build_source_of_truth(
    identity: dict[str, Any],
    listings: dict[str, dict[str, Any]],
    drafts: dict[str, dict[str, Any]],
    assets: dict[str, Any],
    human_fields: dict[str, Any],
) -> dict[str, Any]:
    return {
        "schema_version": "google_play_listing_source_of_truth.v2",
        "status": "draft",
        "can_submit_google_play": False,
        "submission_attempted": False,
        "official_requirements": OFFICIAL_REQUIREMENTS,
        "app_identity": identity,
        "listing_metadata_sources": listings,
        "listing_drafts": drafts,
        "preview_assets": assets,
        "human_required_fields": human_fields,
        "limitations": [
            "listing draft 不代表 Google Play 最终批准。",
            "listing draft 不代表可以提交 Play Console。",
            "隐私政策、开发者联系、类目、内容分级、目标用户、品牌授权和截图文案仍需人工审核。",
        ],
    }


def markdown_table(rows: list[list[str]]) -> str:
    if not rows:
        return ""
    header = "| " + " | ".join(rows[0]) + " |"
    sep = "| " + " | ".join("---" for _ in rows[0]) + " |"
    body = ["| " + " | ".join(row) + " |" for row in rows[1:]]
    return "\n".join([header, sep, *body])


def render_asset_lines(assets: dict[str, Any]) -> str:
    lines = []
    for key, value in assets.items():
        lines.append(f"- `{key}`：`{value['status']}`；{value['reason']}")
        valid = value.get("valid_candidates") or []
        candidates = valid or value.get("candidates") or []
        if candidates:
            preview = ", ".join(f"`{item['path']}`" if isinstance(item, dict) else f"`{item}`" for item in candidates[:3])
            lines.append(f"  - 候选：{preview}")
    return "\n".join(lines)


def render_human_fields(fields: dict[str, Any]) -> str:
    return "\n".join(
        f"- `{key}`：`{value['value']}`；status=`{value['status']}`；{value['reason']}"
        for key, value in fields.items()
    )


def render_report(data: dict[str, Any]) -> str:
    draft_rows = [["Locale", "Source", "appName", "shortDescription", "fullDescription"]]
    for locale, draft in data["listing_drafts"].items():
        draft_rows.append(
            [
                locale,
                f"`{draft.get('source') or 'generated_placeholder'}`",
                draft["appName"],
                draft["shortDescription"],
                draft["fullDescription"][:80] + ("..." if len(draft["fullDescription"]) > 80 else ""),
            ]
        )

    field_rows = [["Locale", "Field", "Length", "Limit", "Status", "Reason"]]
    for row in data["field_lengths"]:
        field_rows.append([row["locale"], f"`{row['field']}`", str(row["length"]), str(row["limit"]), f"`{row['status']}`", row["reason"]])

    gate_rows = [["Gate", "Status", "结论"]]
    for gate in data["listing_gates"]:
        gate_rows.append([f"`{gate['gate_id']}`", f"`{gate['status']}`", gate["reason"]])

    policy = data["metadata_policy"]
    policy_lines = [f"- status: `{policy['status']}`"]
    if policy["findings"]:
        for item in policy["findings"]:
            policy_lines.append(f"- `{item['severity']}`：`{item['locale']}.{item['field']}` 命中 `{item['category']}` / `{item['pattern']}`")
    else:
        policy_lines.append("- 未发现误导、无关、过度格式化、排名、价格、促销或不合适 metadata 风险。")

    blockers = data["blockers"]
    blocker_lines = [
        f"- `{item['id']}`：status=`{item['status']}`；原因：{item['reason']}；解除：{item['unblock_action']}"
        for item in blockers
    ] or ["- 无。"]

    return f"""# google-play-listing 主商店 Listing 草稿报告

生成时间：`{data['generated_at']}`

## 总状态
- overall_status: `{data['overall_status']}`
- 证明模式：`{data['proof_mode']}`
- can_submit_google_play: `false`

## Listing 草稿输出
{markdown_table(draft_rows)}

## 字段长度矩阵
{markdown_table(field_rows)}

## Listing Gate 矩阵
{markdown_table(gate_rows)}

## Preview Assets 状态
{render_asset_lines(data['preview_assets'])}

## Metadata Policy 风险
{chr(10).join(policy_lines)}

## 人类需要提供什么
{render_human_fields(data['human_required_fields'])}

## 阻塞项
{chr(10).join(blocker_lines)}

## 总结
{final_summary(data)}
"""


def final_summary(data: dict[str, Any]) -> str:
    failed = [gate["gate_id"] for gate in data["listing_gates"] if gate["status"] == "fail"]
    blocked = [gate["gate_id"] for gate in data["listing_gates"] if gate["status"] == "blocked"]
    passed = [gate["gate_id"] for gate in data["listing_gates"] if gate["status"] == "pass"]
    lines = [f"- 当前 Google Play 主商店 listing gate 状态：`{data['overall_status']}`。"]
    if failed:
        lines.append(f"- 失败 gate：{', '.join(failed)}。")
    if blocked:
        lines.append(f"- 阻塞 gate：{', '.join(blocked)}。")
    if passed:
        lines.append(f"- 已通过 gate：{', '.join(passed)}。")
    priority_order = {
        "listing_metadata_source": "先提供真实 listing metadata",
        "listing_text_fields": "补齐并压缩 title/short/full description",
        "metadata_policy": "清理 metadata policy 风险",
        "preview_assets": "补齐 icon、feature graphic 和 screenshots",
        "human_required_fields": "补齐人工字段",
        "app_identity": "修正 app identity",
    }
    priority = [text for gate_id, text in priority_order.items() if gate_id in failed or gate_id in blocked]
    if priority:
        lines.append(f"- 优先顺序：{'；'.join(priority)}。")
    lines.append("- 本报告只准备 listing draft 和阻塞证据，不提交 Google Play，不声明最终批准。")
    return "\n".join(lines)


def build_output(root: Path, output_dir: Path, listing_json: list[str], asset_dirs: list[str]) -> dict[str, Any]:
    project_files = iter_project_files(root)
    identity = collect_identity(root, project_files)
    listings = collect_listing_json(root, listing_json)
    listings.update(collect_fastlane_metadata(root))
    drafts = build_drafts(identity, listings)
    human_fields = collect_human_fields(listings)
    field_rows = validate_field_lengths(drafts)
    policy = scan_policy(drafts)
    assets = collect_asset_evidence(root, project_files, asset_dirs)
    gates = build_gates(identity, listings, field_rows, policy, assets, human_fields)
    blockers = build_blockers(gates)
    source = build_source_of_truth(identity, listings, drafts, assets, human_fields)
    return {
        "schema_version": SCHEMA_VERSION,
        "generated_at": utc_now(),
        "proof_mode": "executed",
        "overall_status": gate_status(gates),
        "can_submit_google_play": False,
        "output_dir": rel(root, output_dir),
        "official_requirements": OFFICIAL_REQUIREMENTS,
        "source_of_truth": source,
        "listing_drafts": drafts,
        "field_lengths": field_rows,
        "metadata_policy": policy,
        "preview_assets": assets,
        "human_required_fields": human_fields,
        "listing_gates": gates,
        "blockers": blockers,
        "generated_files": {
            "human_report": rel(root, output_dir / REPORT_FILENAMES["human"]),
            "machine_report": rel(root, output_dir / REPORT_FILENAMES["machine"]),
            "source_of_truth": rel(root, output_dir / REPORT_FILENAMES["source"]),
            "drafts": rel(root, output_dir / REPORT_FILENAMES["drafts"]),
        },
    }


def write_outputs(output_dir: Path, data: dict[str, Any]) -> None:
    write_json(output_dir / REPORT_FILENAMES["machine"], data)
    write_json(output_dir / REPORT_FILENAMES["source"], data["source_of_truth"])
    write_json(output_dir / REPORT_FILENAMES["drafts"], data["listing_drafts"])
    write_text(output_dir / REPORT_FILENAMES["human"], render_report(data))


def main() -> int:
    parser = argparse.ArgumentParser(description="Prepare Google Play main store listing draft evidence.")
    parser.add_argument("--root", default=".", help="App project root.")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Output directory.")
    parser.add_argument("--listing-json", action="append", default=[], help="Optional listing JSON path. Can be passed multiple times.")
    parser.add_argument("--asset-dir", action="append", default=[], help="Optional store asset directory. Can be passed multiple times.")
    parser.add_argument("--no-write", action="store_true", help="Build output in memory without writing files.")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = (root / args.output_dir).resolve()
    data = build_output(root, output_dir, args.listing_json, args.asset_dir)
    if not args.no_write:
        write_outputs(output_dir, data)
    print(f"overall_status={data['overall_status']}")
    print(f"proof_mode={data['proof_mode']}")
    print(f"human_report={(output_dir / REPORT_FILENAMES['human']).as_posix()}")
    print(f"machine_report={(output_dir / REPORT_FILENAMES['machine']).as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
