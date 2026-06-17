#!/usr/bin/env python3
"""Semantic reality checks for Play Store agent magazine-digest outputs."""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from play_store_agent_validation_lib import (
    CLAIM_STATUS_ENUM,
    validate_claim_shape,
)


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

SCHEMA_VERSION = "play_store_agent_magazine_reality_output.v1"
PRODUCT_KEY = "demo_cn_content"
SOURCE_BUNDLE_FRAGMENT = "rel_data2_multi_publication_release_candidate_20260323T121747Z/bundle.json"
LAUNCH_MANIFEST = "artifacts/launch-package/magazine-digest-m1/manifest.json"
LAUNCH_MANIFEST_SCHEMA = "play_store_agent_reality_launch_package_manifest.v1"

FORBIDDEN_FINAL_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("approved", re.compile(r"\bapproved\b", re.IGNORECASE)),
    ("submitted", re.compile(r"\bsubmitted\b", re.IGNORECASE)),
    ("production_ready", re.compile(r"\bproduction_ready\b", re.IGNORECASE)),
    ("ready_to_submit", re.compile(r"\bready to submit\b", re.IGNORECASE)),
    ("play_store_ready", re.compile(r"\bplay store ready\b", re.IGNORECASE)),
)

BOUNDARY_MARKERS = (
    "not ",
    "no ",
    "never",
    "blocked",
    "needs_human",
    "human review",
    "draft",
    "must not",
    "do not",
    "cannot",
    "without",
    "false",
    "未",
    "不是",
    "不得",
    "不能",
    "阻断",
    "人工",
)


def _rel(root: Path, path: Path) -> str:
    return path.relative_to(root).as_posix()


def _load_json(root: Path, relative: str, errors: list[str]) -> Any | None:
    path = root / relative
    if not path.is_file():
        errors.append(f"missing reality artifact: {relative}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"{relative} is not valid JSON: {exc}")
        return None


def _artifact_path(agent_id: str) -> str:
    return f"artifacts/agent-reality-runs/{agent_id}/magazine-digest/agent-output.json"


def _has_boundary(text: str) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in BOUNDARY_MARKERS)


def _validate_no_unbounded_final_claims(relative: str, claims: list[Any], errors: list[str]) -> None:
    for index, claim in enumerate(claims):
        if not isinstance(claim, dict):
            continue
        value = str(claim.get("value", ""))
        for label, pattern in FORBIDDEN_FINAL_PATTERNS:
            if not pattern.search(value):
                continue
            if _has_boundary(value):
                continue
            errors.append(f"{relative} claims[{index}] has unbounded final/store claim: {label}")


def _validate_evidence_entries(relative: str, evidence: Any, errors: list[str]) -> set[str]:
    if not isinstance(evidence, list) or not evidence:
        errors.append(f"{relative} expected non-empty evidence list")
        return set()

    ids: set[str] = set()
    for index, entry in enumerate(evidence):
        if not isinstance(entry, dict):
            errors.append(f"{relative} evidence[{index}] is not an object")
            continue
        for field in ("evidence_id", "source_type", "source_ref", "observed_value", "status"):
            if field not in entry:
                errors.append(f"{relative} evidence[{index}] missing required field: {field}")
        evidence_id = entry.get("evidence_id")
        if isinstance(evidence_id, str) and evidence_id:
            if evidence_id in ids:
                errors.append(f"{relative} duplicate evidence_id: {evidence_id}")
            ids.add(evidence_id)
        if entry.get("status") not in CLAIM_STATUS_ENUM:
            errors.append(f"{relative} evidence[{index}] invalid status: {entry.get('status')!r}")
    return ids


def _validate_claims(
    relative: str,
    claims: Any,
    evidence_ids: set[str],
    errors: list[str],
    *,
    min_claims: int,
) -> None:
    if not isinstance(claims, list):
        errors.append(f"{relative} expected claims to be a list")
        return
    if len(claims) < min_claims:
        errors.append(f"{relative} expected at least {min_claims} material claims")

    seen_claim_ids: set[str] = set()
    for index, claim in enumerate(claims):
        validate_claim_shape(claim, relative, index, errors)
        if not isinstance(claim, dict):
            continue
        claim_id = claim.get("claim_id")
        if isinstance(claim_id, str):
            if claim_id in seen_claim_ids:
                errors.append(f"{relative} duplicate claim_id: {claim_id}")
            seen_claim_ids.add(claim_id)
        evidence_refs = claim.get("evidence_refs")
        if isinstance(evidence_refs, list):
            for evidence_ref in evidence_refs:
                if evidence_ref not in evidence_ids:
                    errors.append(f"{relative} {claim_id} references unknown evidence: {evidence_ref}")
        if claim.get("status") in {"needs_human", "blocked", "missing"}:
            if claim.get("human_review_required") is not True:
                errors.append(f"{relative} {claim_id} needs human/blocker status must set human_review_required=true")
    _validate_no_unbounded_final_claims(relative, claims, errors)


def _validate_content_evidence(relative: str, data: dict[str, Any], errors: list[str]) -> None:
    content = data.get("content_evidence")
    if not isinstance(content, dict):
        errors.append(f"{relative} missing content_evidence object")
        return

    if content.get("publication_count", 0) < 5:
        errors.append(f"{relative} content_evidence.publication_count must be at least 5")
    if content.get("discovery_item_count", 0) < 30:
        errors.append(f"{relative} content_evidence.discovery_item_count must be at least 30")
    if content.get("detail_response_count", 0) < 30:
        errors.append(f"{relative} content_evidence.detail_response_count must be at least 30")

    publications = content.get("publication_names")
    if not isinstance(publications, list) or len(publications) < 5:
        errors.append(f"{relative} content_evidence.publication_names must list at least 5 publications")

    samples = content.get("sample_articles")
    if not isinstance(samples, list) or len(samples) < 3:
        errors.append(f"{relative} content_evidence.sample_articles must include at least 3 real samples")
        return

    sample_publications: set[str] = set()
    for index, sample in enumerate(samples):
        if not isinstance(sample, dict):
            errors.append(f"{relative} sample_articles[{index}] is not an object")
            continue
        for field in (
            "article_id",
            "article_key",
            "title",
            "summary",
            "publication_key",
            "publication_name",
            "reading_mode",
            "audience",
            "content_hash",
            "variant_key",
        ):
            if not sample.get(field):
                errors.append(f"{relative} sample_articles[{index}] missing {field}")
        if isinstance(sample.get("summary"), str) and len(sample["summary"]) < 40:
            errors.append(f"{relative} sample_articles[{index}] summary is too short to prove real digest output")
        if sample.get("reading_mode") not in {"quick_30s", "deep_3m"}:
            errors.append(f"{relative} sample_articles[{index}] invalid reading_mode: {sample.get('reading_mode')!r}")
        publication = sample.get("publication_name")
        if isinstance(publication, str):
            sample_publications.add(publication)
    if len(sample_publications) < 2:
        errors.append(f"{relative} sample_articles must span at least 2 publications")


def _validate_launch_manifest(root: Path, errors: list[str]) -> None:
    manifest = _load_json(root, LAUNCH_MANIFEST, errors)
    if not isinstance(manifest, dict):
        return

    if manifest.get("schema_version") != LAUNCH_MANIFEST_SCHEMA:
        errors.append(f"{LAUNCH_MANIFEST} schema_version must be {LAUNCH_MANIFEST_SCHEMA}")
    if manifest.get("package_id") != "magazine-digest-m1":
        errors.append(f"{LAUNCH_MANIFEST} package_id must be magazine-digest-m1")
    if manifest.get("product_key") != PRODUCT_KEY:
        errors.append(f"{LAUNCH_MANIFEST} product_key must be {PRODUCT_KEY}")
    if manifest.get("readiness") not in {"GREEN", "YELLOW", "RED"}:
        errors.append(f"{LAUNCH_MANIFEST} readiness must be GREEN, YELLOW, or RED")
    if manifest.get("readiness") == "GREEN" and manifest.get("blockers"):
        errors.append(f"{LAUNCH_MANIFEST} readiness must not be GREEN while blockers exist")
    if manifest.get("can_submit_google_play") is not False:
        errors.append(f"{LAUNCH_MANIFEST} can_submit_google_play must be false")
    if manifest.get("safe_to_strengthen_final_store_claims") is not False:
        errors.append(f"{LAUNCH_MANIFEST} safe_to_strengthen_final_store_claims must be false")

    agent_outputs = manifest.get("agent_outputs")
    if not isinstance(agent_outputs, dict):
        errors.append(f"{LAUNCH_MANIFEST} missing agent_outputs object")
        return
    for agent_id in AGENTS:
        expected = _artifact_path(agent_id)
        actual = agent_outputs.get(agent_id)
        if actual != expected:
            errors.append(f"{LAUNCH_MANIFEST} agent_outputs.{agent_id} must be {expected}")
        elif not (root / actual).is_file():
            errors.append(f"{LAUNCH_MANIFEST} references missing agent output: {actual}")

    per_agent = manifest.get("per_agent")
    if not isinstance(per_agent, dict):
        errors.append(f"{LAUNCH_MANIFEST} missing per_agent object")
    else:
        for agent_id in AGENTS:
            summary = per_agent.get(agent_id)
            if not isinstance(summary, dict):
                errors.append(f"{LAUNCH_MANIFEST} missing per_agent summary for {agent_id}")
                continue
            if summary.get("readiness") not in {"GREEN", "YELLOW", "RED"}:
                errors.append(f"{LAUNCH_MANIFEST} per_agent.{agent_id}.readiness invalid")
            if not isinstance(summary.get("evidence_count"), int) or summary["evidence_count"] < 4:
                errors.append(f"{LAUNCH_MANIFEST} per_agent.{agent_id}.evidence_count must be >= 4")
            if not isinstance(summary.get("human_review_count"), int):
                errors.append(f"{LAUNCH_MANIFEST} per_agent.{agent_id}.human_review_count must be an int")


def validate_magazine_reality_artifact(
    root: Path,
    agent_id: str,
    errors: list[str],
    *,
    min_claims: int = 5,
    min_evidence: int = 5,
    require_launch_consumption: bool = False,
) -> dict[str, Any] | None:
    """Validate an agent's real magazine-digest artifact and claim ledger."""

    if agent_id not in AGENTS:
        errors.append(f"unknown Play Store agent id: {agent_id}")
        return None

    relative = _artifact_path(agent_id)
    data = _load_json(root, relative, errors)
    if not isinstance(data, dict):
        return None

    if data.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"{relative} schema_version must be {SCHEMA_VERSION}")
    if data.get("agent_id") != agent_id:
        errors.append(f"{relative} agent_id must be {agent_id}")
    if data.get("product_key") != PRODUCT_KEY:
        errors.append(f"{relative} product_key must be {PRODUCT_KEY}")
    if data.get("app_key") != "magazine-digest":
        errors.append(f"{relative} app_key must be magazine-digest")
    if SOURCE_BUNDLE_FRAGMENT not in str(data.get("source_bundle", "")):
        errors.append(f"{relative} source_bundle must point to the DATA2 release candidate bundle")
    source_bundle = data.get("source_bundle")
    if isinstance(source_bundle, str) and not (root / source_bundle).is_file():
        errors.append(f"{relative} source_bundle missing on disk: {source_bundle}")

    readiness = data.get("readiness")
    if readiness not in {"GREEN", "YELLOW", "RED"}:
        errors.append(f"{relative} readiness must be GREEN, YELLOW, or RED")
    reasons = data.get("readiness_reasons")
    if not isinstance(reasons, list) or not reasons:
        errors.append(f"{relative} readiness_reasons must be non-empty")

    _validate_content_evidence(relative, data, errors)
    evidence_ids = _validate_evidence_entries(relative, data.get("evidence"), errors)
    evidence = data.get("evidence")
    if isinstance(evidence, list) and len(evidence) < min_evidence:
        errors.append(f"{relative} expected at least {min_evidence} evidence entries")
    _validate_claims(relative, data.get("claims"), evidence_ids, errors, min_claims=min_claims)

    human_gates = data.get("human_approval_gates")
    if not isinstance(human_gates, list) or not human_gates:
        errors.append(f"{relative} expected non-empty human_approval_gates")

    semantic = data.get("semantic_checks")
    if not isinstance(semantic, dict):
        errors.append(f"{relative} missing semantic_checks object")
    else:
        required_true = (
            "real_magazine_digest",
            "has_product_key",
            "has_real_content_samples",
            "claim_evidence_or_needs_human",
            "no_final_privacy_legal_store_claims",
        )
        for key in required_true:
            if semantic.get(key) is not True:
                errors.append(f"{relative} semantic_checks.{key} must be true")

    downstream = data.get("downstream_consumed_by")
    if agent_id != "launch-package-agent":
        if not isinstance(downstream, list) or LAUNCH_MANIFEST not in downstream:
            errors.append(f"{relative} must be consumed by {LAUNCH_MANIFEST}")
    else:
        consumes = data.get("consumes_agent_outputs")
        if not isinstance(consumes, list):
            errors.append(f"{relative} launch-package-agent missing consumes_agent_outputs list")
        else:
            for expected_agent in AGENTS:
                expected_path = _artifact_path(expected_agent)
                if expected_path not in consumes:
                    errors.append(f"{relative} launch-package-agent must consume {expected_path}")

    if require_launch_consumption:
        _validate_launch_manifest(root, errors)

    return data
