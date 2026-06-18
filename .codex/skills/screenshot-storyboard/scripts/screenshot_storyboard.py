#!/usr/bin/env python3
"""Generate evidence-bound Google Play screenshot storyboard and capture handoff."""

from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import json
import re
import subprocess
from pathlib import Path
from typing import Any


NEED_HUMAN = "NEED_HUMAN"
SCHEMA_VERSION = "screenshot_storyboard.v1"

OFFICIAL_REQUIREMENTS = {
    "source_url": "https://support.google.com/googleplay/android-developer/answer/9866151?hl=en",
    "minimum_screenshots": 2,
    "maximum_screenshots_per_form_factor": 8,
    "formats": ["JPEG", "24-bit PNG without alpha"],
    "min_dimension_px": 320,
    "max_dimension_px": 3840,
    "max_ratio_rule": "最大边不能超过最小边 2 倍。",
    "content_rule": "截图必须展示真实 app 体验；公开使用前需要人工审核。"
}

GLOBAL_MUST_NOT_SHOW = [
    "不存在或未证明的功能",
    "排名、评分、下载量、价格促销、限时优惠或 Play Store 表现暗示",
    "真实个人隐私、手机号、邮箱、支付凭据、密钥或后台 token",
    "系统 Launcher、HBuilderX 空壳、错误页、崩溃页或非目标 app 页面"
]

PAGE_RISK_PATTERNS = [
    ("开发态", "开发态或诊断信息"),
    ("Feed 诊断", "Feed 诊断信息"),
    ("debug", "debug/diagnostic 信息"),
    ("DEBUG", "debug/diagnostic 信息"),
    ("构建信息", "构建信息"),
    ("远端桥接", "远端桥接配置"),
    ("Bridge Base URL", "Bridge Base URL"),
    ("内部", "内部能力或兼容页面"),
    ("Internal", "内部能力或兼容页面"),
    ("管理员", "管理员入口"),
    ("实名认证", "实名认证流程"),
    ("注销账号", "账号注销流程"),
    ("兑换码", "兑换码/奖励结算"),
    ("订阅", "订阅/支付权益"),
    ("支付", "支付信息")
]


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def relpath(path: Path, root: Path) -> str:
    try:
        return path.resolve().relative_to(root.resolve()).as_posix()
    except ValueError:
        return path.as_posix()


def read_text(path: Path) -> str:
    if not path.is_file():
        return ""
    try:
        return path.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def read_json(path: Path) -> Any:
    text = read_text(path)
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


def stable_hash(value: Any) -> str:
    payload = json.dumps(value, ensure_ascii=False, sort_keys=True, default=str)
    return "sha256:" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def add_evidence(
    evidence: list[dict[str, Any]],
    *,
    source_type: str,
    source_ref: str,
    observed_key: str,
    observed_value: Any,
    parser: str,
    confidence: float,
) -> str:
    evidence_id = f"evidence.{len(evidence) + 1:04d}"
    evidence.append({
        "evidence_id": evidence_id,
        "source_type": source_type,
        "source_ref": source_ref,
        "observed_key": observed_key,
        "observed_value": observed_value,
        "parser": parser,
        "snippet_hash": stable_hash(observed_value),
        "confidence": confidence
    })
    return evidence_id


def run_git(root: Path, args: list[str]) -> str:
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=root,
            check=False,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10,
        )
    except Exception:
        return ""
    if result.returncode != 0:
        return ""
    return result.stdout.strip()


def load_routes(root: Path, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    pages_path = root / "mobile" / "pages.json"
    data = read_json(pages_path)
    pages: list[dict[str, Any]] = []
    route_evidence: dict[str, str] = {}
    tab_bar: list[dict[str, Any]] = []
    if isinstance(data, dict):
        for page in data.get("pages", []):
            if not isinstance(page, dict):
                continue
            route = str(page.get("path") or "").strip()
            if not route:
                continue
            title = str((page.get("style") or {}).get("navigationBarTitleText") or "").strip()
            entry = {"path": route, "title": title, "source": "mobile/pages.json"}
            evidence_id = add_evidence(
                evidence,
                source_type="repo_config",
                source_ref="mobile/pages.json",
                observed_key=f"route.{route}",
                observed_value=entry,
                parser="json",
                confidence=0.95,
            )
            entry["evidence_refs"] = [evidence_id]
            route_evidence[route] = evidence_id
            pages.append(entry)
        raw_tabs = ((data.get("tabBar") or {}).get("list") or [])
        tab_bar = [
            {"path": str(item.get("pagePath") or ""), "text": str(item.get("text") or "")}
            for item in raw_tabs
            if isinstance(item, dict)
        ]
    add_evidence(
        evidence,
        source_type="repo_config",
        source_ref="mobile/pages.json",
        observed_key="routes.summary",
        observed_value={"count": len(pages), "tab_bar": tab_bar, "paths": [page["path"] for page in pages]},
        parser="json",
        confidence=0.95 if pages else 0.2,
    )
    return {
        "source": "mobile/pages.json",
        "pages": pages,
        "route_map": {page["path"]: page for page in pages},
        "route_evidence": route_evidence,
        "tab_bar": tab_bar,
        "status": "observed_in_repo" if pages else "blocked"
    }


def extract_attr_values(text: str) -> list[str]:
    values: list[str] = []
    patterns = [
        r'(?:title|description|label|eyebrow|placeholder)="([^"]{2,80})"',
        r"<text[^>]*>([^<{]{2,80})</text>",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            value = re.sub(r"\s+", " ", match.group(1)).strip()
            if value and "{{" not in value and value not in values:
                values.append(value)
            if len(values) >= 12:
                return values
    return values


def load_page_signals(root: Path, routes: dict[str, Any], evidence: list[dict[str, Any]]) -> dict[str, Any]:
    signals: dict[str, Any] = {}
    for page in routes["pages"]:
        route = page["path"]
        source_path = root / "mobile" / (route + ".vue")
        text = read_text(source_path)
        risks = sorted({label for pattern, label in PAGE_RISK_PATTERNS if pattern in text})
        visible_text = extract_attr_values(text)
        evidence_refs: list[str] = []
        if text:
            evidence_refs.append(add_evidence(
                evidence,
                source_type="source",
                source_ref=relpath(source_path, root),
                observed_key=f"page_source.{route}",
                observed_value={
                    "visible_text_sample": visible_text[:8],
                    "risk_labels": risks,
                    "line_count": len(text.splitlines()),
                },
                parser="regex_text",
                confidence=0.75,
            ))
        signals[route] = {
            "source_ref": relpath(source_path, root) if source_path.is_file() else "",
            "visible_text_sample": visible_text,
            "risk_labels": risks,
            "evidence_refs": evidence_refs,
        }
    return signals


def load_app_identity(root: Path, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    manifest_path = root / "mobile" / "manifest.json"
    app_json_path = root / "app.json"
    manifest = read_json(manifest_path) or {}
    app_json = read_json(app_json_path) or {}
    expo = app_json.get("expo") if isinstance(app_json, dict) else {}
    identity = {
        "app_name": manifest.get("name") or (expo or {}).get("name") or NEED_HUMAN,
        "manifest_appid": manifest.get("appid") or "",
        "manifest_description": manifest.get("description") or "",
        "expo_slug": (expo or {}).get("slug") or "",
        "android_package": ((expo or {}).get("android") or {}).get("package") or "",
        "sources": [path for path in ["mobile/manifest.json", "app.json"] if (root / path).is_file()],
    }
    add_evidence(
        evidence,
        source_type="repo_config",
        source_ref="mobile/manifest.json + app.json",
        observed_key="app_identity",
        observed_value=identity,
        parser="json",
        confidence=0.9,
    )
    return identity


def load_report(root: Path, filename: str, evidence: list[dict[str, Any]], key: str) -> tuple[dict[str, Any], list[str]]:
    path = root / "play-store-launch" / "reports" / filename
    data = read_json(path)
    if isinstance(data, dict):
        evidence_id = add_evidence(
            evidence,
            source_type="agent_report",
            source_ref=relpath(path, root),
            observed_key=key,
            observed_value={
                "schema_version": data.get("schema_version"),
                "overall_status": data.get("overall_status"),
                "capture_status": data.get("capture_status"),
                "blocker_count": len(data.get("blockers") or []),
            },
            parser="json",
            confidence=0.85,
        )
        return data, [evidence_id]
    return {}, []


def load_runtime_facts(root: Path, evidence: list[dict[str, Any]]) -> dict[str, Any]:
    runtime_path = root / "mobile" / "fixtures" / "runtime" / "current" / "runtime.bundle.json"
    data = read_json(runtime_path)
    facts: dict[str, Any] = {
        "source": "mobile/fixtures/runtime/current/runtime.bundle.json",
        "status": "missing",
        "implemented_surfaces": [],
        "article_count": 0,
        "publication_names": [],
        "selected_article": {},
        "inbox_count": 0,
        "profile_benefits": {},
        "evidence_refs": [],
    }
    if not isinstance(data, dict):
        return facts

    implemented_surfaces = [
        str(item.get("surface"))
        for item in data.get("surfaceStatus", [])
        if isinstance(item, dict) and item.get("status") == "implemented_now"
    ]
    discovery_items = (data.get("discoveryCatalog") or {}).get("items") or []
    publications = (data.get("followCatalog") or {}).get("publications") or []
    publication_names = []
    for item in publications:
        if isinstance(item, dict):
            name = item.get("display_name") or item.get("publication_name") or item.get("publication_key")
            if name and name not in publication_names:
                publication_names.append(str(name))

    selected_article: dict[str, Any] = {}
    responses = (data.get("contentDetail") or {}).get("responses") or {}
    iterator = responses.items() if isinstance(responses, dict) else enumerate(responses)
    for key, response in iterator:
        if not isinstance(response, dict):
            continue
        article = response.get("article") or {}
        variant = response.get("resolved_variant") or {}
        if article.get("article_id") and ("deep_3m" in str(key) or variant.get("reading_mode") == "deep_3m"):
            selected_article = {
                "article_id": article.get("article_id"),
                "title": article.get("title"),
                "publication_name": article.get("publication_name") or article.get("publication_key"),
                "issue_display_label": article.get("issue_display_label"),
                "reading_mode": variant.get("reading_mode") or "deep_3m",
                "source_key": str(key),
            }
            break
    if not selected_article and discovery_items:
        first = discovery_items[0]
        if isinstance(first, dict):
            selected_article = {
                "article_id": first.get("article_id"),
                "title": first.get("title"),
                "publication_name": first.get("publication_name") or first.get("publication_key"),
                "issue_display_label": first.get("issue_display_label"),
                "reading_mode": "deep_3m",
                "source_key": "discoveryCatalog.items[0]",
            }

    inbox_items = ((data.get("notificationInbox") or {}).get("response") or {}).get("items") or []
    profile_benefits = (((data.get("stageG") or {}).get("profileBenefits") or {}).get("response") or {})
    facts.update({
        "status": "observed_in_repo",
        "implemented_surfaces": implemented_surfaces,
        "article_count": len(discovery_items),
        "publication_names": publication_names,
        "selected_article": selected_article,
        "inbox_count": len(inbox_items),
        "profile_benefits": {
            "subscription_status": profile_benefits.get("subscription_status"),
            "entitlement_status": profile_benefits.get("entitlement_status"),
            "saved_count": profile_benefits.get("saved_count"),
            "inbox_unread_count": profile_benefits.get("inbox_unread_count"),
            "benefit_summary": profile_benefits.get("benefit_summary") or [],
        },
    })
    facts["evidence_refs"].append(add_evidence(
        evidence,
        source_type="runtime_fixture",
        source_ref=relpath(runtime_path, root),
        observed_key="runtime_facts.summary",
        observed_value={
            "implemented_surfaces": implemented_surfaces,
            "article_count": len(discovery_items),
            "publication_names": publication_names[:8],
            "selected_article": selected_article,
            "inbox_count": len(inbox_items),
            "profile_benefits": facts["profile_benefits"],
        },
        parser="json",
        confidence=0.9,
    ))
    return facts


def normalize_listing_claims(report: dict[str, Any], evidence_refs: list[str], routes: dict[str, Any], runtime: dict[str, Any]) -> list[dict[str, Any]]:
    raw_claims = report.get("claims") or ((report.get("source_of_truth") or {}).get("listing_claims") or [])
    claims: list[dict[str, Any]] = []
    for raw in raw_claims:
        if not isinstance(raw, dict) or not raw.get("claim_id"):
            continue
        claims.append({
            "claim_id": raw.get("claim_id"),
            "value_zh": raw.get("value_zh") or raw.get("value") or "",
            "value_en": raw.get("value_en") or "",
            "status": raw.get("status") or "observed_in_repo",
            "confidence": raw.get("confidence") or "medium",
            "claim_class": raw.get("claim_class") or "implemented_app_surface",
            "human_review_required": bool(raw.get("human_review_required", False)),
            "review_status": raw.get("review_status") or ("NEED_HUMAN" if raw.get("human_review_required") else "AUTO_PARSED"),
            "source_evidence_refs": raw.get("evidence_refs") or [],
            "evidence_refs": evidence_refs,
            "limitations": raw.get("limitations") or [],
        })
    if claims:
        return claims

    route_map = routes["route_map"]
    surfaces = set(runtime.get("implemented_surfaces") or [])
    fallback: list[dict[str, Any]] = []
    if "pages/feed/index" in route_map and "pages/detail/index" in route_map and {"home-discovery", "content-detail"} & surfaces:
        fallback.append({
            "claim_id": "listing_claim_digest_detail",
            "value_zh": "浏览中文文章摘要和详情页。",
            "value_en": "Browse Chinese article digests and detail pages.",
            "status": "inferred",
            "confidence": "medium",
            "claim_class": "implemented_app_surface",
            "human_review_required": True,
            "review_status": NEED_HUMAN,
            "source_evidence_refs": ["mobile/pages.json", "mobile/fixtures/runtime/current/runtime.bundle.json"],
            "evidence_refs": evidence_refs + runtime.get("evidence_refs", []),
            "limitations": ["未发现 google-play-listing 报告，claim 由页面和 fixture 组合推断。"],
        })
    if "pages/search/index" in route_map and "follow-catalog" in surfaces:
        fallback.append({
            "claim_id": "listing_claim_source_updates",
            "value_zh": "查看来源更新并关注感兴趣的来源。",
            "value_en": "View source updates and follow sources.",
            "status": "inferred",
            "confidence": "medium",
            "claim_class": "implemented_app_surface",
            "human_review_required": True,
            "review_status": NEED_HUMAN,
            "source_evidence_refs": ["mobile/pages.json", "mobile/fixtures/runtime/current/runtime.bundle.json"],
            "evidence_refs": evidence_refs + runtime.get("evidence_refs", []),
            "limitations": ["未发现 google-play-listing 报告，claim 由页面和 fixture 组合推断。"],
        })
    if "pages/profile/index" in route_map:
        fallback.append({
            "claim_id": "listing_claim_inbox_profile_settings",
            "value_zh": "使用消息摘要、个人页和设置入口管理阅读状态。",
            "value_en": "Use inbox, profile, and settings screens for reading state.",
            "status": "inferred",
            "confidence": "medium",
            "claim_class": "implemented_app_surface",
            "human_review_required": True,
            "review_status": NEED_HUMAN,
            "source_evidence_refs": ["mobile/pages.json"],
            "evidence_refs": evidence_refs + runtime.get("evidence_refs", []),
            "limitations": ["未发现 google-play-listing 报告，claim 由页面和 fixture 组合推断。"],
        })
    return fallback


def claim_map(claims: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(claim["claim_id"]): claim for claim in claims if claim.get("claim_id")}


def uniq(items: list[str]) -> list[str]:
    result: list[str] = []
    for item in items:
        if item and item not in result:
            result.append(item)
    return result


def page_must_not_show(route: str, page_signals: dict[str, Any], runtime: dict[str, Any]) -> list[str]:
    items = list(GLOBAL_MUST_NOT_SHOW)
    risks = page_signals.get(route, {}).get("risk_labels") or []
    for risk in risks:
        items.append(risk)
    if runtime.get("publication_names"):
        items.append("未经授权确认的第三方出版物名称、文章标题或品牌露出")
    return uniq(items)


def shot_evidence_refs(route: str, claim_ids: list[str], routes: dict[str, Any], page_signals: dict[str, Any], runtime: dict[str, Any], claims: dict[str, dict[str, Any]]) -> list[str]:
    refs: list[str] = []
    route_evidence = routes.get("route_evidence", {}).get(route)
    if route_evidence:
        refs.append(route_evidence)
    refs.extend(page_signals.get(route, {}).get("evidence_refs") or [])
    refs.extend(runtime.get("evidence_refs") or [])
    for claim_id in claim_ids:
        refs.extend(claims.get(claim_id, {}).get("evidence_refs") or [])
    return uniq(refs)


def build_primary_shots(routes: dict[str, Any], page_signals: dict[str, Any], runtime: dict[str, Any], claims: list[dict[str, Any]], locale: str, max_shots: int) -> list[dict[str, Any]]:
    route_map = routes["route_map"]
    claims_by_id = claim_map(claims)
    selected_article = runtime.get("selected_article") or {}
    detail_params: dict[str, str] = {}
    if selected_article.get("article_id"):
        detail_params = {
            "articleId": str(selected_article["article_id"]),
            "readingMode": "deep_3m",
            "source": "storyboard",
        }

    candidates = [
        {
            "shot_id": "shot_01_home_feed",
            "priority": 1,
            "route": "pages/feed/index",
            "route_params": {},
            "screen_title": "首页",
            "scenario": "打开 app 首页，展示内容流、30 秒先读摘要和消息摘要入口。",
            "story_goal": "证明用户可以先浏览中文文章摘要，再选择进入精读。",
            "claim_ids": ["listing_claim_digest_detail"],
            "source_surfaces": ["home-discovery"],
            "visible_evidence": [
                "首页/效率阅读入口",
                "文章标题或摘要卡片",
                "30 秒先读",
                "消息摘要入口"
            ],
            "fixture_source": [
                "mobile/pages.json:pages/feed/index",
                "mobile/fixtures/runtime/current/runtime.bundle.json:discoveryCatalog.items"
            ],
            "overlay_copy": {
                "title_zh": "先看摘要，再决定是否精读",
                "subtitle_zh": "首页聚合文章更新与 30 秒先读。",
                "copy_status": "draft_needs_human_review"
            },
        },
        {
            "shot_id": "shot_02_detail_deep_read",
            "priority": 2,
            "route": "pages/detail/index",
            "route_params": detail_params,
            "screen_title": "3分钟精读",
            "scenario": "进入文章详情页，展示 3 分钟精读、阅读操作和权益提示。",
            "story_goal": "证明 app 存在文章详情与 3 分钟精读体验。",
            "claim_ids": ["listing_claim_digest_detail"],
            "source_surfaces": ["content-detail"],
            "visible_evidence": [
                "3 分钟精读标题",
                "文章标题",
                "摘要/精读正文",
                "阅读操作"
            ],
            "fixture_source": [
                "mobile/pages.json:pages/detail/index",
                "mobile/fixtures/runtime/current/runtime.bundle.json:contentDetail.responses"
            ],
            "overlay_copy": {
                "title_zh": "把长文压缩成可读精华",
                "subtitle_zh": "详情页展示 3 分钟精读内容。",
                "copy_status": "draft_needs_human_review"
            },
        },
        {
            "shot_id": "shot_03_sources_follow",
            "priority": 3,
            "route": "pages/search/index",
            "route_params": {"focus": "follows"},
            "screen_title": "来源",
            "scenario": "打开来源页，展示搜索、来源结果和关注杂志入口。",
            "story_goal": "证明用户可以查看来源更新并关注感兴趣的来源。",
            "claim_ids": ["listing_claim_source_updates"],
            "source_surfaces": ["search-content", "follow-catalog", "follow-toggle"],
            "visible_evidence": [
                "搜索文章、来源、期次、主题",
                "关注杂志",
                "来源结果",
                "阅读深度筛选"
            ],
            "fixture_source": [
                "mobile/pages.json:pages/search/index",
                "mobile/fixtures/runtime/current/runtime.bundle.json:followCatalog"
            ],
            "overlay_copy": {
                "title_zh": "按来源发现更新",
                "subtitle_zh": "搜索文章、期次和关注的杂志来源。",
                "copy_status": "draft_needs_human_review"
            },
        },
        {
            "shot_id": "shot_04_profile_summary",
            "priority": 4,
            "route": "pages/profile/index",
            "route_params": {},
            "screen_title": "我的",
            "scenario": "打开我的页面，展示未读消息、稍后再读、权益和设置入口。",
            "story_goal": "证明 app 有阅读状态汇总入口，但公开使用需避开账号隐私。",
            "claim_ids": ["listing_claim_inbox_profile_settings"],
            "source_surfaces": ["profile-benefits", "notification-inbox", "content-resume"],
            "visible_evidence": [
                "阅读权益",
                "未读消息",
                "消息摘要",
                "稍后再读",
                "打开设置"
            ],
            "fixture_source": [
                "mobile/pages.json:pages/profile/index",
                "mobile/fixtures/runtime/current/runtime.bundle.json:stageG.profileBenefits"
            ],
            "overlay_copy": {
                "title_zh": "集中管理阅读状态",
                "subtitle_zh": "消息、保存和权益入口汇总在个人页。",
                "copy_status": "draft_needs_human_review"
            },
        },
    ]

    shots: list[dict[str, Any]] = []
    for candidate in candidates:
        route = candidate["route"]
        if route not in route_map:
            continue
        claim_ids = [claim_id for claim_id in candidate["claim_ids"] if claim_id in claims_by_id]
        if not claim_ids:
            continue
        if route == "pages/detail/index" and not detail_params:
            continue
        claim_text_zh = [claims_by_id[claim_id].get("value_zh", "") for claim_id in claim_ids]
        risks = page_signals.get(route, {}).get("risk_labels") or []
        shot = {
            **candidate,
            "device_type": "phone",
            "locale": locale,
            "status": "planned",
            "route_path": route,
            "route_url": "/" + route,
            "claim_text_zh": claim_text_zh,
            "must_not_show": page_must_not_show(route, page_signals, runtime),
            "risk_flags": uniq([
                "public_use_needs_human_review",
                "third_party_content_authorization_needs_human" if runtime.get("publication_names") else "",
                "page_contains_development_or_internal_signals" if risks else "",
                "account_or_entitlement_context_needs_human" if route in {"pages/profile/index", "pages/detail/index"} else "",
            ]),
            "capture_preconditions": [
                "使用真实 Android 设备或模拟器打开目标 app。",
                "目标 route 必须在真实 app 中可达，并由人工或自动导航确认。",
                "公开截图前确认生产/预览构建未显示开发态诊断或内部配置。",
                "capture skill 必须通过 adb 从目标 app 前台捕获 raw PNG。",
            ],
            "human_review_required": True,
            "review_status": NEED_HUMAN,
            "evidence_refs": shot_evidence_refs(route, claim_ids, routes, page_signals, runtime, claims_by_id),
            "limitations": [
                "storyboard 只证明规划和证据绑定，不证明已经捕获真实截图。",
                "公开使用前需要人工确认画面内容、裁切、安全区、商标和授权。"
            ],
        }
        if route == "pages/detail/index" and selected_article:
            shot["scenario"] += f" 示例 articleId={selected_article.get('article_id')}。"
            shot["visible_evidence"].append("示例文章来自 runtime fixture")
        shots.append(shot)
        if len(shots) >= max_shots:
            break
    return shots


def build_held_shots(routes: dict[str, Any], page_signals: dict[str, Any], runtime: dict[str, Any]) -> list[dict[str, Any]]:
    route_map = routes["route_map"]
    held_catalog = [
        ("pages/settings/index", "设置", "设置页含远端桥接、设备、本地调试和构建信息；公开截图前必须确认生产构建隐藏开发态内容。"),
        ("pages/paywall/index", "订阅", "订阅/套餐/额度属于商业和支付相关表达；需产品、法务和 Play policy 人工确认。"),
        ("pages/invite/index", "邀请与兑换", "兑换码、奖励和邀请属于增长/奖励表达；不能展示未证明的奖励结算。"),
        ("pages/inbox/index", "消息摘要", "源码标记为 internal 能力页，正式入口在首页消息摘要；不作为默认公开截图。"),
        ("pages/follows/index", "来源与关注", "源码标记为 alias route，会跳转到搜索页；使用 search route 作为正式截图。"),
        ("pages/campaign/index", "活动说明", "源码标记为 alias/internal campaign route，会跳转到订阅页商业区块。"),
    ]
    held: list[dict[str, Any]] = []
    for route, title, reason in held_catalog:
        if route not in route_map:
            continue
        held.append({
            "shot_id": "held_" + re.sub(r"[^a-z0-9]+", "_", route.lower()).strip("_"),
            "route": route,
            "screen_title": title,
            "status": "held",
            "review_status": NEED_HUMAN,
            "human_review_required": True,
            "reason": reason,
            "must_not_show": page_must_not_show(route, page_signals, runtime),
            "evidence_refs": uniq((routes.get("route_evidence", {}).get(route) and [routes["route_evidence"][route]] or []) + (page_signals.get(route, {}).get("evidence_refs") or [])),
        })
    return held


def build_human_gates(shots: list[dict[str, Any]], held_shots: list[dict[str, Any]], runtime: dict[str, Any], reports: dict[str, Any]) -> list[dict[str, Any]]:
    gates = [
        {
            "gate_id": "human.screenshot.public_use",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "所有公开用于 Google Play 的截图、标题、背景、裁切和安全区都必须人工审核。",
            "evidence_refs": uniq([ref for shot in shots for ref in shot.get("evidence_refs", [])]),
        },
        {
            "gate_id": "human.screenshot.google_play_specs",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "Storyboard 无法证明最终图片尺寸、格式、alpha、设备类型和 Play Console 分类，需要在 raw screenshot/design 阶段人工确认。",
            "evidence_refs": [],
        },
        {
            "gate_id": "human.screenshot.trademark_content_authorization",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "runtime fixture 中存在第三方出版物或文章内容，公开截图使用前需要授权/商标/内容合规确认。",
            "evidence_refs": runtime.get("evidence_refs") or [],
        },
        {
            "gate_id": "human.screenshot.capture_execution",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "storyboard 只生成 shot-list；必须由 screenshot-capture-agent 从真实 app 前台捕获 raw screenshot。",
            "evidence_refs": [],
        },
    ]
    release = reports.get("release") or {}
    if release.get("overall_status") and release.get("overall_status") != "pass":
        gates.append({
            "gate_id": "human.release_context",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": f"release-build-agent 当前为 {release.get('overall_status')}，截图只能作为规划草稿。",
            "evidence_refs": reports.get("release_evidence_refs") or [],
        })
    if held_shots:
        gates.append({
            "gate_id": "human.held_shots",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "部分页面涉及内部、开发、订阅、兑换或 alias 风险，默认不进入 capture shot-list。",
            "evidence_refs": uniq([ref for shot in held_shots for ref in shot.get("evidence_refs", [])]),
        })
    return gates


def build_blockers(reports: dict[str, Any], shots: list[dict[str, Any]], routes: dict[str, Any]) -> list[dict[str, Any]]:
    blockers: list[dict[str, Any]] = []
    if routes.get("status") == "blocked":
        blockers.append({
            "blocker_id": "routes_missing",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "未能解析 mobile/pages.json，不能证明真实 app routes。",
            "unblock_action": "修复或提供真实移动端页面配置后重跑。",
            "evidence_refs": [],
        })
    if not shots:
        blockers.append({
            "blocker_id": "shot_contract_missing",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "没有可绑定真实 route 与 claim 的 primary shot。",
            "unblock_action": "提供可证明的页面、runtime fixture 或 listing claim 后重跑。",
            "evidence_refs": [],
        })
    release = reports.get("release") or {}
    if release.get("overall_status") and release.get("overall_status") != "pass":
        blockers.append({
            "blocker_id": "release_gate_not_passed",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": f"release-build-agent 当前状态为 {release.get('overall_status')}；截图规划不能代表可提交素材。",
            "unblock_action": "先修复 build/typecheck/smoke 等 release blockers，再重新捕获截图。",
            "evidence_refs": reports.get("release_evidence_refs") or [],
        })
    capture = reports.get("capture") or {}
    if capture.get("capture_status") != "captured":
        blockers.append({
            "blocker_id": "raw_screenshots_not_captured",
            "status": "blocked",
            "review_status": NEED_HUMAN,
            "reason": "尚未通过 screenshot-capture-agent 证明真实 raw screenshots。",
            "unblock_action": "使用生成的 screenshot-shot-list.json 重跑 screenshot-capture-agent，并确保目标 app 在前台。",
            "evidence_refs": reports.get("capture_evidence_refs") or [],
        })
    privacy = reports.get("privacy") or {}
    if privacy.get("overall_status") and privacy.get("overall_status") != "pass":
        blockers.append({
            "blocker_id": "privacy_or_target_audience_needs_human",
            "status": "needs_human",
            "review_status": NEED_HUMAN,
            "reason": "隐私、Data safety、目标年龄或敏感内容仍有人工确认项，公开截图文案需同步确认。",
            "unblock_action": "完成 privacy/data safety/target audience 人工审核后再批准公开截图。",
            "evidence_refs": reports.get("privacy_evidence_refs") or [],
        })
    return blockers


def build_capture_shot_list(shots: list[dict[str, Any]], generated_at: str) -> dict[str, Any]:
    return {
        "schema_version": "screenshot_shot_list.v1",
        "generated_at": generated_at,
        "produced_by": "screenshot-storyboard",
        "draft_only": True,
        "can_use_for_submission": False,
        "shots": [
            {
                "shot_id": shot["shot_id"],
                "route": shot["route"],
                "route_path": shot["route_path"],
                "route_params": shot.get("route_params") or {},
                "scenario": shot["scenario"],
                "title": shot["screen_title"],
                "claim_ids": shot["claim_ids"],
                "fixture_source": shot["fixture_source"],
                "visible_evidence": shot["visible_evidence"],
                "must_not_show": shot["must_not_show"],
                "human_review_required": True,
                "review_status": NEED_HUMAN,
                "evidence_refs": shot["evidence_refs"],
            }
            for shot in shots
        ],
    }


def build_design_brief(shots: list[dict[str, Any]], held_shots: list[dict[str, Any]], generated_at: str) -> dict[str, Any]:
    return {
        "schema_version": "screenshot_design_brief.v1",
        "generated_at": generated_at,
        "produced_by": "screenshot-storyboard",
        "draft_only": True,
        "base_image_rule": "只能使用 screenshot-capture-agent 真实捕获的 raw screenshot 作为 app 画面。",
        "allowed": [
            "在 raw screenshot 外部添加背景、标题和极简说明。",
            "对 raw screenshot 做安全裁切和设备框包装，但不得改变 app 内部 UI 功能含义。",
            "为不同 locale 准备人工审核后的标题文案。"
        ],
        "not_allowed": [
            "新增 app 中不存在的按钮、页面、功能或内容。",
            "把 mockup、旧设计稿、系统桌面、HBuilderX 空壳当作真实 app 截图。",
            "展示价格促销、排名、评分、下载量或 Play Store 表现暗示。",
            "展示未经授权的第三方内容、商标或真实个人数据。"
        ],
        "shot_overlays": [
            {
                "shot_id": shot["shot_id"],
                "route": shot["route"],
                "overlay_copy": shot["overlay_copy"],
                "review_status": NEED_HUMAN,
            }
            for shot in shots
        ],
        "held_shots": held_shots,
    }


def render_markdown(data: dict[str, Any]) -> str:
    lines: list[str] = []
    lines.append("# screenshot-storyboard 截图规划报告")
    lines.append("")
    lines.append(f"- 生成时间：`{data['generated_at']}`")
    lines.append(f"- 总状态：`{data['overall_status']}`")
    lines.append(f"- Storyboard 状态：`{data['storyboard_status']}`")
    lines.append("- 结论：这是截图规划和 capture handoff，不是最终 Google Play 上架素材。")
    lines.append("")
    identity = data["source_of_truth"]["app_identity"]
    lines.append("## App 与证据来源")
    lines.append("")
    lines.append(f"- App 名称：`{identity.get('app_name')}`")
    lines.append(f"- Android package：`{identity.get('android_package') or 'NEED_HUMAN'}`")
    lines.append(f"- 路由来源：`{data['source_of_truth']['routes']['source']}`，共 `{len(data['source_of_truth']['routes']['pages'])}` 个页面。")
    runtime = data["source_of_truth"]["runtime_facts"]
    lines.append(f"- Runtime fixture：`{runtime.get('status')}`；文章候选 `{runtime.get('article_count')}`；implemented surfaces `{len(runtime.get('implemented_surfaces') or [])}` 个。")
    lines.append("")
    lines.append("## Primary Shots")
    lines.append("")
    lines.append("| shot | route | story | claim | review |")
    lines.append("| --- | --- | --- | --- | --- |")
    claims = claim_map(data["claims"])
    for shot in data["shots"]:
        claim_text = "；".join([claims.get(claim_id, {}).get("value_zh", claim_id) for claim_id in shot.get("claim_ids", [])])
        story = shot["story_goal"].replace("|", "/")
        lines.append(f"| `{shot['shot_id']}` | `{shot['route']}` | {story} | {claim_text} | `{shot['review_status']}` |")
    lines.append("")
    lines.append("## 每张图的文案与禁止项")
    lines.append("")
    for shot in data["shots"]:
        lines.append(f"### `{shot['shot_id']}` {shot['screen_title']}")
        lines.append(f"- Route：`{shot['route']}`")
        if shot.get("route_params"):
            lines.append(f"- Route params：`{json.dumps(shot['route_params'], ensure_ascii=False)}`")
        lines.append(f"- Scenario：{shot['scenario']}")
        lines.append(f"- 标题草稿：{shot['overlay_copy']['title_zh']}")
        lines.append(f"- 副标题草稿：{shot['overlay_copy']['subtitle_zh']}")
        lines.append(f"- 可见证据：{'；'.join(shot['visible_evidence'])}")
        lines.append(f"- 禁止展示：{'；'.join(shot['must_not_show'])}")
        lines.append(f"- 人工确认：`{shot['review_status']}`")
        lines.append("")
    if data.get("held_shots"):
        lines.append("## 暂缓进入 Capture 的页面")
        lines.append("")
        for shot in data["held_shots"]:
            lines.append(f"- `{shot['route']}`：{shot['reason']} (`{shot['review_status']}`)")
        lines.append("")
    lines.append("## Capture Handoff")
    lines.append("")
    handoff = data["capture_handoff"]
    lines.append(f"- Shot-list：`{handoff['shot_list_path']}`")
    lines.append(f"- 推荐命令：`{handoff['recommended_capture_command']}`")
    lines.append("- 说明：capture 必须从真实 Android app 前台通过 adb 获取 raw PNG；storyboard 不能替代截图证据。")
    lines.append("")
    lines.append("## NEED_HUMAN")
    lines.append("")
    for gate in data["human_review_gates"]:
        lines.append(f"- `{gate['gate_id']}`：{gate['reason']}")
    lines.append("")
    if data["blockers"]:
        lines.append("## Blockers")
        lines.append("")
        for blocker in data["blockers"]:
            lines.append(f"- `{blocker['blocker_id']}`：{blocker['reason']} 解除方式：{blocker['unblock_action']}")
        lines.append("")
    lines.append("## 官方规格摘要")
    lines.append("")
    req = data["official_requirements"]
    lines.append(f"- 至少 `{req['minimum_screenshots']}` 张截图；每设备类型最多 `{req['maximum_screenshots_per_form_factor']}` 张。")
    lines.append(f"- 格式：{', '.join(req['formats'])}；尺寸 `{req['min_dimension_px']}` 到 `{req['max_dimension_px']}` px。")
    lines.append(f"- 官方来源：{req['source_url']}")
    lines.append("")
    return "\n".join(lines)


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_outputs(root: Path, output_dir: Path, data: dict[str, Any]) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    write_json(output_dir / "screenshot-storyboard-output.json", data)
    write_json(output_dir / "screenshot-shot-list.json", data["capture_shot_list"])
    write_json(output_dir / "screenshot-capture-handoff.json", data["capture_handoff"])
    write_json(output_dir / "screenshot-design-brief.json", data["design_brief"])
    (output_dir / "screenshot-storyboard.zh.md").write_text(render_markdown(data), encoding="utf-8")
    with (output_dir / "screenshot-storyboard-evidence.jsonl").open("w", encoding="utf-8") as handle:
        for item in data["evidence"]:
            handle.write(json.dumps(item, ensure_ascii=False) + "\n")


def build_report(root: Path, output_dir: Path, locale: str, max_shots: int) -> dict[str, Any]:
    generated_at = utc_now()
    evidence: list[dict[str, Any]] = []
    git_commit = run_git(root, ["rev-parse", "HEAD"]) or NEED_HUMAN
    git_status = run_git(root, ["status", "--short"])

    app_identity = load_app_identity(root, evidence)
    routes = load_routes(root, evidence)
    page_signals = load_page_signals(root, routes, evidence)
    runtime = load_runtime_facts(root, evidence)

    listing_report, listing_refs = load_report(root, "google-play-listing-output.json", evidence, "google_play_listing")
    release_report, release_refs = load_report(root, "release-build-agent-output.json", evidence, "release_build")
    privacy_report, privacy_refs = load_report(root, "privacy-disclosure-prep-output.json", evidence, "privacy_disclosure")
    capture_report, capture_refs = load_report(root, "screenshot-capture-agent-output.json", evidence, "screenshot_capture")
    reports = {
        "listing": listing_report,
        "listing_evidence_refs": listing_refs,
        "release": release_report,
        "release_evidence_refs": release_refs,
        "privacy": privacy_report,
        "privacy_evidence_refs": privacy_refs,
        "capture": capture_report,
        "capture_evidence_refs": capture_refs,
    }

    claims = normalize_listing_claims(listing_report, listing_refs, routes, runtime)
    shots = build_primary_shots(routes, page_signals, runtime, claims, locale, max_shots)
    held_shots = build_held_shots(routes, page_signals, runtime)
    human_gates = build_human_gates(shots, held_shots, runtime, reports)
    blockers = build_blockers(reports, shots, routes)

    capture_shot_list = build_capture_shot_list(shots, generated_at)
    shot_list_path = (output_dir / "screenshot-shot-list.json")
    recommended_capture_command = (
        "python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py "
        "--root . --shot-list play-store-launch/reports/screenshot-shot-list.json"
    )
    capture_handoff = {
        "schema_version": "screenshot_capture_handoff.v1",
        "generated_at": generated_at,
        "produced_by": "screenshot-storyboard",
        "expected_downstream_skill": "screenshot-capture-agent",
        "shot_list_path": relpath(shot_list_path, root),
        "recommended_capture_command": recommended_capture_command,
        "capture_preconditions": [
            "安装或启动目标 Android app。",
            "使目标 app 位于前台，不要停留在系统 Launcher。",
            "按 shot-list route 手动或自动导航到目标页面。",
            "使用 screenshot-capture-agent 通过 adb 捕获 raw PNG。",
            "捕获后由人工确认 route、locale、设备、安全区、裁切和公开使用。"
        ],
        "shots": capture_shot_list["shots"],
        "blockers": blockers,
        "human_review_gates": human_gates,
    }
    design_brief = build_design_brief(shots, held_shots, generated_at)

    storyboard_status = "planned" if shots else "blocked"
    overall_status = "blocked" if blockers else "needs_human"
    data = {
        "schema_version": SCHEMA_VERSION,
        "generated_at": generated_at,
        "overall_status": overall_status,
        "storyboard_status": storyboard_status,
        "can_use_for_submission": False,
        "root": str(root.resolve()),
        "project_fingerprint": {
            "git_commit": git_commit,
            "git_status_short": git_status.splitlines()[:50],
            "skill_path": relpath(root / ".codex" / "skills" / "screenshot-storyboard" / "SKILL.md", root),
            "skill_generator": relpath(root / ".codex" / "skills" / "screenshot-storyboard" / "scripts" / "screenshot_storyboard.py", root),
        },
        "official_requirements": OFFICIAL_REQUIREMENTS,
        "source_of_truth": {
            "app_identity": app_identity,
            "routes": {
                "source": routes["source"],
                "status": routes["status"],
                "pages": routes["pages"],
                "tab_bar": routes["tab_bar"],
            },
            "page_signals": page_signals,
            "runtime_facts": runtime,
            "upstream_reports": {
                "listing_status": listing_report.get("overall_status") or NEED_HUMAN,
                "release_status": release_report.get("overall_status") or NEED_HUMAN,
                "privacy_status": privacy_report.get("overall_status") or NEED_HUMAN,
                "capture_status": capture_report.get("capture_status") or NEED_HUMAN,
            },
        },
        "shots": shots,
        "held_shots": held_shots,
        "capture_shot_list": capture_shot_list,
        "capture_handoff": capture_handoff,
        "design_brief": design_brief,
        "claims": claims,
        "evidence": evidence,
        "human_review_gates": human_gates,
        "blockers": blockers,
        "limitations": [
            "Storyboard 只证明截图规划与证据绑定，不证明真实截图已经捕获。",
            "真实 raw screenshot 必须由 screenshot-capture-agent 从目标 app 前台捕获。",
            "设计阶段只能基于 raw screenshot 加背景/标题，不能虚构 app UI 或功能。",
            "公开上架使用、商标、内容授权、目标受众、隐私、裁切和安全区均需人工确认。",
        ],
        "output_paths": {
            "human_report": relpath(output_dir / "screenshot-storyboard.zh.md", root),
            "machine_report": relpath(output_dir / "screenshot-storyboard-output.json", root),
            "evidence_jsonl": relpath(output_dir / "screenshot-storyboard-evidence.jsonl", root),
            "shot_list": relpath(output_dir / "screenshot-shot-list.json", root),
            "capture_handoff": relpath(output_dir / "screenshot-capture-handoff.json", root),
            "design_brief": relpath(output_dir / "screenshot-design-brief.json", root),
        },
    }
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="生成 Google Play 截图 storyboard 与 capture handoff。")
    parser.add_argument("--root", default=".", help="Repository root")
    parser.add_argument("--output-dir", default="play-store-launch/reports", help="Output directory")
    parser.add_argument("--locale", default="zh-CN", help="Storyboard/capture target locale")
    parser.add_argument("--max-shots", type=int, default=4, help="Primary shots to include in capture shot-list")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    output_dir = Path(args.output_dir)
    if not output_dir.is_absolute():
        output_dir = root / output_dir
    data = build_report(root, output_dir, args.locale, max(2, min(args.max_shots, 8)))
    write_outputs(root, output_dir, data)
    print(json.dumps({
        "schema_version": data["schema_version"],
        "overall_status": data["overall_status"],
        "storyboard_status": data["storyboard_status"],
        "shot_count": len(data["shots"]),
        "held_shot_count": len(data["held_shots"]),
        "blocker_count": len(data["blockers"]),
        "machine_report": data["output_paths"]["machine_report"],
        "shot_list": data["output_paths"]["shot_list"],
    }, ensure_ascii=False, indent=2))
    return 0 if data["shots"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
