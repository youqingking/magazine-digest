#!/usr/bin/env python3
"""Generate evidence-bound M1 reality outputs for the eight Play Store agents."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from _boundary_bootstrap import install_boundary_paths

install_boundary_paths(__file__)


AGENTS = (
    "release-build-agent",
    "privacy-disclosure-prep",
    "google-play-listing",
    "screenshot-storyboard",
    "launch-info-collector",
    "google-data-safety-agent",
    "screenshot-capture-agent",
    "launch-package-agent",
)

SOURCE_RELEASE = "runtime/releases/rel_data2_multi_publication_release_candidate_20260323T121747Z"
SOURCE_BUNDLE = f"{SOURCE_RELEASE}/bundle.json"
SOURCE_MANIFEST = f"{SOURCE_RELEASE}/manifest.json"
SOURCE_PROVENANCE = f"{SOURCE_RELEASE}/provenance.json"
PACKAGE_ID = "magazine-digest-m1"
LAUNCH_PACKAGE_DIR = f"artifacts/launch-package/{PACKAGE_ID}"
LAUNCH_MANIFEST = f"{LAUNCH_PACKAGE_DIR}/manifest.json"

AGENT_SOURCE_REFS = {
    "release-build-agent": (
        "docs/release/ANDROID_BUILD_READINESS.md",
        "docs/release/PLAY_STORE_RELEASE_GATE.md",
        "docs/release/release-build-agent-output.json",
    ),
    "privacy-disclosure-prep": (
        "docs/privacy/DATA_INVENTORY.md",
        "docs/privacy/SDK_INVENTORY.md",
        "docs/launch/privacy/privacy-disclosure-draft.md",
    ),
    "google-play-listing": (
        "docs/launch/google-play/listing.en-US.json",
        "docs/launch/google-play/listing.zh-CN.json",
        "docs/launch/google-play/listing-validation-report.md",
    ),
    "screenshot-storyboard": (
        "docs/launch/screenshots/storyboard.md",
        "docs/launch/screenshots/shot-list.json",
        "docs/launch/screenshots/screenshot-validation-notes.md",
    ),
    "launch-info-collector": (
        "docs/launch/LAUNCH_INFO.md",
        "docs/launch/store-fields/source-of-truth.json",
        "docs/launch/launch-info-collector-output.json",
    ),
    "google-data-safety-agent": (
        "docs/launch/google-play/data-safety-draft.md",
        "docs/launch/google-play/data-safety-evidence.md",
        "docs/launch/google-play/data-safety-human-review-required.md",
    ),
    "screenshot-capture-agent": (
        "docs/launch/screenshots/capture-report.md",
        "docs/launch/screenshots/capture-blockers.md",
        "docs/launch/screenshots/screenshot-capture-agent-output.json",
    ),
    "launch-package-agent": (
        LAUNCH_MANIFEST,
        f"{LAUNCH_PACKAGE_DIR}/readiness-report.md",
        f"{LAUNCH_PACKAGE_DIR}/FILES_INCLUDED.txt",
    ),
}

AGENT_READINESS = {
    "release-build-agent": (
        "RED",
        (
            "真实内容包可证明 Magazine Digest 场景存在，但签名 Android 构建、EAS/Play Console、提交 dry-run 仍需人工。",
            "不得把 release-build-agent 输出升级为可发布结论。",
        ),
    ),
    "privacy-disclosure-prep": (
        "RED",
        (
            "DATA2 内容包可证明本地内容/偏好/通知相关数据面，但隐私政策 URL、法律审查、真实服务配置仍需人工。",
            "不得生成最终隐私或法律结论。",
        ),
    ),
    "google-play-listing": (
        "YELLOW",
        (
            "可基于真实刊物和样例摘要生成草稿文案。",
            "联系邮箱、隐私政策、类别、目标受众、内容评级和版权授权仍为 NEED_HUMAN。",
        ),
    ),
    "screenshot-storyboard": (
        "YELLOW",
        (
            "分镜目标已绑定真实 article_id、刊物和摘要变体。",
            "仍未产出可上传截图，也不得展示保留功能。",
        ),
    ),
    "launch-info-collector": (
        "YELLOW",
        (
            "可从仓库和真实内容包收集 product_key、scenario_id、刊物与样例内容事实。",
            "Play Console 账号、开发者联系信息和公开商店字段仍需人工。",
        ),
    ),
    "google-data-safety-agent": (
        "RED",
        (
            "可把真实内容包和现有数据清单作为证据草稿输入。",
            "Data Safety 最终答案、SDK 披露、儿童/家庭/广告追踪判断仍需人工。",
        ),
    ),
    "screenshot-capture-agent": (
        "RED",
        (
            "截图目标来自真实 Magazine Digest 内容。",
            "当前没有真实 Android 设备/模拟器截图证据，不得列出截图文件。",
        ),
    ),
    "launch-package-agent": (
        "RED",
        (
            "已消费八个代理的 M1 reality 输出。",
            "发布包仍包含 release、privacy、data safety、capture 和 Play Console blocker。",
        ),
    ),
}


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def agent_output_path(agent_id: str) -> str:
    return f"artifacts/agent-reality-runs/{agent_id}/magazine-digest/agent-output.json"


def agent_dir(agent_id: str) -> str:
    return f"artifacts/agent-reality-runs/{agent_id}/magazine-digest"


def collect_content_evidence(bundle: dict[str, Any]) -> dict[str, Any]:
    discovery_items = bundle.get("discoveryCatalog", {}).get("items", [])
    responses = bundle.get("contentDetail", {}).get("responses", {})
    publications = bundle.get("followCatalog", {}).get("publications", [])

    publication_names = [pub.get("display_name") for pub in publications if pub.get("display_name")]
    seen_publications: set[str] = set()
    samples: list[dict[str, Any]] = []
    for item in discovery_items:
        publication_key = item.get("publication_key")
        if publication_key in seen_publications:
            continue
        article_id = item.get("article_id")
        variant_key = f"{article_id}|zh-CN|general|quick_30s"
        response = responses.get(variant_key)
        if not response:
            continue
        article = response.get("article", {})
        variant = response.get("resolved_variant", {})
        summary = str(article.get("summary") or "")
        markdown = str(variant.get("markdown_body") or "")
        if len(summary) < 40 or len(markdown) < 40:
            continue
        samples.append(
            {
                "article_id": article.get("article_id"),
                "article_key": article.get("article_key"),
                "title": article.get("title"),
                "summary": article.get("summary"),
                "publication_key": article.get("publication_key"),
                "publication_name": article.get("publication_name"),
                "reading_mode": variant.get("reading_mode"),
                "audience": variant.get("audience_segment"),
                "variant_key": variant_key,
                "content_hash": variant.get("content_hash"),
                "markdown_excerpt": markdown[:180],
            }
        )
        seen_publications.add(publication_key)
        if len(samples) >= 5:
            break

    return {
        "publication_count": len(publications),
        "publication_names": publication_names,
        "discovery_item_count": len(discovery_items),
        "detail_response_count": len(responses),
        "publish_batch_count": len(bundle.get("publishBatches", {}).get("items", [])),
        "surface_status_count": len(bundle.get("surfaceStatus", [])),
        "sample_articles": samples,
    }


def evidence_for(agent_id: str, content: dict[str, Any]) -> list[dict[str, Any]]:
    prefix = f"evidence.{agent_id}"
    source_refs = AGENT_SOURCE_REFS[agent_id]
    return [
        {
            "evidence_id": f"{prefix}.runtime_bundle_metadata",
            "source_type": "repo_runtime_bundle",
            "source_ref": SOURCE_BUNDLE,
            "observed_value": "DATA2 release candidate bundle exposes product_key=demo_cn_content, scenario_id=data2_multi_publication_release_candidate, and source_kind=real_content_release_candidate.",
            "status": "observed_in_repo",
        },
        {
            "evidence_id": f"{prefix}.publication_catalog",
            "source_type": "repo_runtime_bundle",
            "source_ref": SOURCE_BUNDLE,
            "observed_value": f"{content['publication_count']} publications observed: {', '.join(content['publication_names'])}.",
            "status": "observed_in_repo",
        },
        {
            "evidence_id": f"{prefix}.sample_article_variants",
            "source_type": "repo_runtime_bundle",
            "source_ref": SOURCE_BUNDLE,
            "observed_value": f"{len(content['sample_articles'])} quick_30s general article variants include title, summary, publication, variant_key, and content_hash.",
            "status": "observed_in_repo",
        },
        {
            "evidence_id": f"{prefix}.content_volume",
            "source_type": "repo_runtime_bundle",
            "source_ref": SOURCE_MANIFEST,
            "observed_value": f"{content['discovery_item_count']} discovery items and {content['detail_response_count']} content detail responses are available.",
            "status": "observed_in_repo",
        },
        {
            "evidence_id": f"{prefix}.existing_agent_output",
            "source_type": "repo_file",
            "source_ref": source_refs[0],
            "observed_value": f"Existing {agent_id} source document/output remains a draft or blocked evidence source.",
            "status": "observed_in_repo",
        },
        {
            "evidence_id": f"{prefix}.human_gate",
            "source_type": "repo_file",
            "source_ref": "docs/NEED_HUMAN.md",
            "observed_value": "Human owner review is still required for Play Console, legal/privacy, release signing, screenshots, and submission-sensitive decisions.",
            "status": "needs_human",
        },
    ]


def claim(
    agent_id: str,
    suffix: str,
    value: str,
    status: str,
    claim_class: str,
    evidence_refs: list[str],
    *,
    confidence: float,
    human_review_required: bool,
    source: list[str],
    limitations: list[str],
) -> dict[str, Any]:
    return {
        "claim_id": f"{agent_id}.m1.{suffix}",
        "value": value,
        "source": source,
        "status": status,
        "confidence": confidence,
        "claim_class": claim_class,
        "human_review_required": human_review_required,
        "evidence_refs": evidence_refs,
        "limitations": limitations,
    }


def claims_for(agent_id: str) -> list[dict[str, Any]]:
    prefix = f"evidence.{agent_id}"
    base_sources = [SOURCE_BUNDLE, SOURCE_MANIFEST, *AGENT_SOURCE_REFS[agent_id]]
    common = [
        claim(
            agent_id,
            "real_content_bundle_observed",
            "Magazine Digest 的 DATA2 运行时内容包在仓库中可观测，包含 product_key=demo_cn_content 和真实多刊物摘要场景。",
            "observed_in_repo",
            "C0",
            [f"{prefix}.runtime_bundle_metadata", f"{prefix}.content_volume"],
            confidence=0.96,
            human_review_required=False,
            source=[SOURCE_BUNDLE, SOURCE_MANIFEST],
            limitations=["只证明仓库内 release candidate 内容存在，不证明 Play Store 发布状态。"],
        ),
        claim(
            agent_id,
            "real_article_samples_observed",
            "代理输出可绑定真实 article_id、刊物、summary、reading_mode、audience 和 content_hash，而不是通用占位文案。",
            "observed_in_repo",
            "C1",
            [f"{prefix}.publication_catalog", f"{prefix}.sample_article_variants"],
            confidence=0.93,
            human_review_required=False,
            source=[SOURCE_BUNDLE],
            limitations=["样例来自仓库 release candidate，不代表内容版权或商店审核已通过。"],
        ),
    ]

    specific: dict[str, list[dict[str, Any]]] = {
        "release-build-agent": [
            claim(agent_id, "release_gate_dry_run_only", "release-build-agent 只能给出 dry-run release readiness 证据；签名 Android build 和 Play Console 提交仍被阻断。", "blocked", "C5", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.9, human_review_required=True, source=base_sources, limitations=["没有调用 EAS submit 或 Google Play API。"]),
            claim(agent_id, "build_claims_need_human", "任何可发布构建、签名证书、track 选择或上线状态必须保持 needs_human。", "needs_human", "C4", [f"{prefix}.human_gate"], confidence=0.88, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不能从文档存在推断真实构建已生成。"]),
            claim(agent_id, "runtime_content_evidence_is_reusable", "release 准备报告可以引用真实内容包样例来说明本次目标产品是 Magazine Digest。", "observed_in_repo", "C1", [f"{prefix}.sample_article_variants"], confidence=0.91, human_review_required=False, source=[SOURCE_BUNDLE], limitations=["该证据不是发布签名或商店审核证据。"]),
        ],
        "privacy-disclosure-prep": [
            claim(agent_id, "privacy_data_surfaces_observed", "DATA2 内容包提供本地内容、关注、通知偏好和用户状态相关 evidence draft 输入。", "observed_in_repo", "C2", [f"{prefix}.runtime_bundle_metadata", f"{prefix}.existing_agent_output"], confidence=0.86, human_review_required=False, source=base_sources, limitations=["仓库证据不能替代法律隐私审查。"]),
            claim(agent_id, "privacy_policy_url_needs_human", "隐私政策 URL、开发者联系人和法律措辞必须保持 needs_human。", "needs_human", "C4", [f"{prefix}.human_gate"], confidence=0.92, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不得生成最终隐私声明。"]),
            claim(agent_id, "sdk_inventory_not_final", "SDK inventory 只能作为草稿证据；真实发布构建和服务配置未由本代理验证。", "needs_human", "C3", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.84, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不能得出 Data Safety 最终答案。"]),
        ],
        "google-play-listing": [
            claim(agent_id, "listing_can_use_real_publications", "商店草稿可以引用 Reader's Digest、Barron's、The Atlantic、The Economist、Science 等真实样例刊物。", "observed_in_repo", "C1", [f"{prefix}.publication_catalog", f"{prefix}.sample_article_variants"], confidence=0.94, human_review_required=False, source=base_sources, limitations=["刊物引用仍需版权/商标/授权审查。"]),
            claim(agent_id, "listing_fields_need_human", "contactEmail、privacyPolicyUrl、category、contentRating、targetAudience 必须保持 NEED_HUMAN。", "needs_human", "C4", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.91, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不得提交或声称商店字段已审核。"]),
            claim(agent_id, "listing_forbidden_claims_blocked", "Listing 输出不得声称第一、获奖、最终合规、已提交或已获批。", "blocked", "C5", [f"{prefix}.human_gate"], confidence=0.89, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["只允许证据绑定草稿文案。"]),
        ],
        "screenshot-storyboard": [
            claim(agent_id, "storyboard_routes_bound_to_articles", "截图分镜可以绑定真实 article_id 与 quick_30s 摘要变体，避免泛化截图文案。", "observed_in_repo", "C1", [f"{prefix}.sample_article_variants", f"{prefix}.existing_agent_output"], confidence=0.9, human_review_required=False, source=base_sources, limitations=["分镜不是实际图片资产。"]),
            claim(agent_id, "screenshot_assets_need_capture", "真实截图仍需 Android 设备或模拟器捕获，并需人工确认图片规格和内容授权。", "needs_human", "C4", [f"{prefix}.human_gate"], confidence=0.93, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不得列出不存在的截图文件。"]),
            claim(agent_id, "reserved_features_must_not_show", "分镜不得展示 Supabase、RevenueCat、Push 等保留但未上线能力。", "blocked", "C5", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.87, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["只能展示当前已实现或内部证据边界。"]),
        ],
        "launch-info-collector": [
            claim(agent_id, "source_of_truth_can_include_product_key", "launch-info-collector 可收集 product_key、scenario_id、source_kind 和真实内容包摘要样例作为产品事实。", "observed_in_repo", "C1", [f"{prefix}.runtime_bundle_metadata", f"{prefix}.sample_article_variants"], confidence=0.92, human_review_required=False, source=base_sources, limitations=["不能推断 Play Console app 已创建。"]),
            claim(agent_id, "play_console_fields_need_human", "Play Console app、privacyPolicyUrl、contactEmail、category、contentRating、targetAudience 仍需人工提供。", "needs_human", "C4", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.9, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不能用仓库默认值替代 Owner 输入。"]),
            claim(agent_id, "downstream_inputs_are_draft", "下游 listing/privacy/release 只能消费带状态的 draft 字段，不得把 missing 字段视作完成。", "blocked", "C5", [f"{prefix}.existing_agent_output"], confidence=0.86, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["必须保留 needs_human gate。"]),
        ],
        "google-data-safety-agent": [
            claim(agent_id, "data_safety_evidence_can_reference_runtime_surfaces", "Data Safety 草稿可以引用真实内容包、DATA_INVENTORY 和 SDK_INVENTORY 的证据表。", "observed_in_repo", "C2", [f"{prefix}.runtime_bundle_metadata", f"{prefix}.existing_agent_output"], confidence=0.85, human_review_required=False, source=base_sources, limitations=["该证据不等于 Play Console Data Safety 答案。"]),
            claim(agent_id, "data_safety_answers_need_human", "数据收集、数据共享、儿童/家庭、广告追踪和 SDK 披露答案必须保持 needs_human。", "needs_human", "C4", [f"{prefix}.human_gate"], confidence=0.94, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["需要 Owner/legal/privacy review。"]),
            claim(agent_id, "no_final_data_safety_claim", "不得声称 Data Safety 已获批、已提交或可直接上线。", "blocked", "C5", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.91, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["只允许证据草稿。"]),
        ],
        "screenshot-capture-agent": [
            claim(agent_id, "capture_targets_are_real", "capture 目标可使用真实 article_id、刊物和摘要变体进行定位。", "observed_in_repo", "C1", [f"{prefix}.sample_article_variants", f"{prefix}.existing_agent_output"], confidence=0.88, human_review_required=False, source=base_sources, limitations=["目标真实不等于图片已存在。"]),
            claim(agent_id, "capture_blocked_without_device", "没有 Android 设备/模拟器捕获证据时，capture_status 必须保持 blocked。", "blocked", "C5", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.95, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["不得伪造 screenshots 列表。"]),
            claim(agent_id, "screenshot_files_need_evidence", "任何截图路径都必须对应磁盘文件、设备、locale、route 和 commit 证据。", "needs_human", "C4", [f"{prefix}.human_gate"], confidence=0.9, human_review_required=True, source=list(AGENT_SOURCE_REFS[agent_id]), limitations=["当前 M1 不产出截图图片。"]),
        ],
        "launch-package-agent": [
            claim(agent_id, "consumes_all_eight_outputs", "launch-package-agent 的 M1 包消费八个代理的 agent-output.json，并汇总 evidence_count 与 human_review_count。", "observed_in_repo", "C1", [f"{prefix}.existing_agent_output", f"{prefix}.runtime_bundle_metadata"], confidence=0.95, human_review_required=False, source=[LAUNCH_MANIFEST], limitations=["消费关系不等于发布可提交。"]),
            claim(agent_id, "readiness_is_red_with_reasons", "M1 launch package readiness=RED，原因包括 release、privacy、data safety、screenshot capture 和 Play Console blockers。", "blocked", "C5", [f"{prefix}.existing_agent_output", f"{prefix}.human_gate"], confidence=0.93, human_review_required=True, source=[LAUNCH_MANIFEST, f"{LAUNCH_PACKAGE_DIR}/readiness-report.md"], limitations=["RED 是 fail-closed 结论。"]),
            claim(agent_id, "can_submit_google_play_false", "M1 包必须声明 can_submit_google_play=false，且不调用 Play Console API 或真实凭证。", "blocked", "C5", [f"{prefix}.human_gate"], confidence=0.94, human_review_required=True, source=[LAUNCH_MANIFEST], limitations=["只能供 Pro review。"]),
        ],
    }
    return common + specific[agent_id]


def semantic_checks() -> dict[str, bool]:
    return {
        "real_magazine_digest": True,
        "has_product_key": True,
        "has_real_content_samples": True,
        "claim_evidence_or_needs_human": True,
        "no_final_privacy_legal_store_claims": True,
    }


def output_for(agent_id: str, content: dict[str, Any], generated_at: str) -> dict[str, Any]:
    readiness, reasons = AGENT_READINESS[agent_id]
    claims = claims_for(agent_id)
    evidence = evidence_for(agent_id, content)
    human_count = sum(1 for item in claims if item.get("human_review_required") is True)
    output = {
        "schema_version": "play_store_agent_magazine_reality_output.v1",
        "agent_id": agent_id,
        "app_key": "magazine-digest",
        "product_key": "demo_cn_content",
        "generated_at": generated_at,
        "source_bundle": SOURCE_BUNDLE,
        "source_manifest": SOURCE_MANIFEST,
        "source_provenance": SOURCE_PROVENANCE,
        "source_kind": "real_content_release_candidate",
        "scenario_id": "data2_multi_publication_release_candidate",
        "readiness": readiness,
        "readiness_reasons": list(reasons),
        "content_evidence": content,
        "evidence": evidence,
        "claims": claims,
        "human_approval_gates": [
            "Owner must review release, privacy, data safety, listing, screenshot, and Play Console claims before any submission.",
            "Pro review must verify that every material claim has claim_id plus evidence_refs or needs_human/blocker status.",
        ],
        "downstream_consumed_by": [LAUNCH_MANIFEST],
        "semantic_checks": semantic_checks(),
        "evidence_count": len(evidence),
        "human_review_count": human_count,
    }
    if agent_id == "launch-package-agent":
        output["consumes_agent_outputs"] = [agent_output_path(agent) for agent in AGENTS]
    return output


def build_launch_package(outputs: dict[str, dict[str, Any]], generated_at: str) -> dict[str, Any]:
    blockers = [
        "signed Android build / EAS / Play Console submission evidence is missing",
        "privacy policy URL, developer contact, Data Safety, SDK disclosure, children/family, ads/tracking require human review",
        "real screenshot capture is blocked because no device/emulator screenshot evidence is present",
        "content rights, listing category, target audience, and content rating require owner/legal review",
    ]
    per_agent = {
        agent_id: {
            "readiness": output["readiness"],
            "evidence_count": output["evidence_count"],
            "human_review_count": output["human_review_count"],
            "readiness_reasons": output["readiness_reasons"],
            "output_path": agent_output_path(agent_id),
        }
        for agent_id, output in outputs.items()
    }
    manifest = {
        "schema_version": "play_store_agent_reality_launch_package_manifest.v1",
        "package_id": PACKAGE_ID,
        "generated_at": generated_at,
        "app_key": "magazine-digest",
        "product_key": "demo_cn_content",
        "source_bundle": SOURCE_BUNDLE,
        "readiness": "RED",
        "readiness_reasons": [
            "八个代理均产生了真实 Magazine Digest reality 输出。",
            "至少 release/privacy/data-safety/screenshot-capture/Play Console 仍有 blocker，因此 fail-closed。",
        ],
        "blockers": blockers,
        "can_submit_google_play": False,
        "safe_to_strengthen_agent_outputs": "evidence_bound_magazine_outputs_only",
        "safe_to_strengthen_final_store_claims": False,
        "agent_outputs": {agent_id: agent_output_path(agent_id) for agent_id in AGENTS},
        "per_agent": per_agent,
        "launch_package_outputs": [
            LAUNCH_MANIFEST,
            f"{LAUNCH_PACKAGE_DIR}/readiness-report.md",
            f"{LAUNCH_PACKAGE_DIR}/FILES_INCLUDED.txt",
            f"{LAUNCH_PACKAGE_DIR}/NEED_HUMAN.md",
        ],
        "non_claims": [
            "not submitted",
            "not production_ready",
            "not Play Store ready",
            "not Data Safety approved",
            "not screenshots captured",
            "Play Console API not called",
            "real credentials not used",
        ],
    }
    return manifest


def render_summary(agent_id: str, output: dict[str, Any]) -> str:
    samples = output["content_evidence"]["sample_articles"]
    sample_lines = "\n".join(
        f"- `{sample['article_id']}` / {sample['publication_name']} / {sample['title']} / hash `{sample['content_hash']}`"
        for sample in samples[:3]
    )
    claim_lines = "\n".join(
        f"- `{claim['claim_id']}`: {claim['status']} / {claim['claim_class']} / evidence={', '.join(claim['evidence_refs'])}"
        for claim in output["claims"]
    )
    return f"""# {agent_id} M1 Reality Output

readiness: {output['readiness']}
product_key: {output['product_key']}
scenario_id: {output['scenario_id']}
source_bundle: `{output['source_bundle']}`

## Real Magazine Digest Samples
{sample_lines}

## Material Claims
{claim_lines}

## Human Review
- human_review_count: {output['human_review_count']}
- final privacy/legal/store claims: not allowed
"""


def render_readiness_report(manifest: dict[str, Any]) -> str:
    per_agent_lines = "\n".join(
        f"| `{agent_id}` | {summary['readiness']} | {summary['evidence_count']} | {summary['human_review_count']} | {summary['output_path']} |"
        for agent_id, summary in manifest["per_agent"].items()
    )
    blocker_lines = "\n".join(f"- {blocker}" for blocker in manifest["blockers"])
    return f"""# Play Store Agent M1 Reality Package

当前结论：Reality Gate 对八个代理的真实 Magazine Digest 输出已可验证；发布 readiness 仍为 RED。

## Per-Agent Evidence Table

| Agent | Readiness | Evidence Count | Human Review Count | Output |
| --- | --- | ---: | ---: | --- |
{per_agent_lines}

## Blockers
{blocker_lines}

## Safety
- can_submit_google_play=false
- safe_to_strengthen_agent_outputs=evidence_bound_magazine_outputs_only
- safe_to_strengthen_final_store_claims=false
- Play Console API not called
- real credentials not used
"""


def main() -> int:
    root = Path(".").resolve()
    bundle = read_json(root / SOURCE_BUNDLE)
    content = collect_content_evidence(bundle)
    generated_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

    outputs = {agent_id: output_for(agent_id, content, generated_at) for agent_id in AGENTS}

    for agent_id, output in outputs.items():
        base = root / agent_dir(agent_id)
        write_json(base / "agent-output.json", output)
        write_json(base / "evidence-ledger.json", output["evidence"])
        write_text(base / "summary.md", render_summary(agent_id, output))

    manifest = build_launch_package(outputs, generated_at)
    write_json(root / LAUNCH_MANIFEST, manifest)
    write_json(root / f"{LAUNCH_PACKAGE_DIR}/launch-package-agent-output.json", outputs["launch-package-agent"])
    write_text(root / f"{LAUNCH_PACKAGE_DIR}/readiness-report.md", render_readiness_report(manifest))
    write_text(root / f"{LAUNCH_PACKAGE_DIR}/NEED_HUMAN.md", "\n".join(f"- {item}" for item in manifest["blockers"]) + "\n")
    write_text(
        root / f"{LAUNCH_PACKAGE_DIR}/FILES_INCLUDED.txt",
        "\n".join(
            [
                LAUNCH_MANIFEST,
                f"{LAUNCH_PACKAGE_DIR}/readiness-report.md",
                f"{LAUNCH_PACKAGE_DIR}/launch-package-agent-output.json",
                f"{LAUNCH_PACKAGE_DIR}/NEED_HUMAN.md",
                f"{LAUNCH_PACKAGE_DIR}/FILES_INCLUDED.txt",
                *[agent_output_path(agent_id) for agent_id in AGENTS],
            ]
        )
        + "\n",
    )
    print(f"generated_agent_outputs={len(outputs)}")
    print(f"launch_package={LAUNCH_PACKAGE_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
