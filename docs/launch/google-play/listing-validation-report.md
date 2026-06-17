# Listing Validation Report

## Status

本文件是 Play Store listing validation evidence，不是 listing 发布判断，也不是 Play Store submission readiness。所有 listing、trademark、content rating、target audience、Privacy policy URL、Developer contact、submission 结论都必须 `human review required` / `NEED_HUMAN`。

本轮 `google-play-listing` 已执行 no-credential listing draft dry-run：只刷新 repo-local source-of-truth provenance 和 reviewer-facing evidence，不访问 Google Play API，不提交 Play Console，不添加 credentials，不修改 app source behavior。

## Sources Checked

- `docs/launch/store-fields/source-of-truth.json`
- `docs/launch/google-play/listing.en-US.json`
- `docs/launch/google-play/listing.zh-CN.json`
- `apps/mobile/README.md`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `.agents/skills/google-play-listing/SKILL.md`
- `scripts/agent_tools/validate_google_play_listing.py`

## Field Length Readiness

| Field | Rule | Current evidence |
| --- | --- | --- |
| `appName` | `<= 30` characters | en-US `Magazine Digest` length 15; zh-CN `Magazine Digest` length 15 |
| `shortDescription` | `<= 80` characters | en-US length 60; zh-CN length 33 |
| `fullDescription` | `<= 4000` characters | en-US length 650; zh-CN length 426 |

## Claim Guardrails

Listing drafts must not claim:

- Google Play submission.
- Live cloud sync.
- Paid subscription purchase.
- Push notifications available.
- Account sign-in.
- Privacy or Data safety correctness without human review.
- Authorized third-party publication trademark usage.
- Rankings, awards, promotions, partnerships, or operational claims without evidence.

forbidden_terms checked by M2 validator:

- `#1`
- `best`
- `top`
- `award-winning`
- `keyword stuffing`
- fabricated AI capability
- fabricated Supabase / RevenueCat / Push capability
- fabricated privacy promise
- fabricated launched capability
- competitor comparison
- limited-time promotion

## M2 Evidence Binding

| claim_id | claim_class | status | value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `gpl.c0.field_lengths_within_limits` | `C0` | `observed_in_repo` | `appName`, `shortDescription`, and `fullDescription` are inside current Google Play draft limits | `evidence.gpl.field_lengths` | no |
| `gpl.c1.current_app_capabilities_draft` | `C1` | `inferred` | Listing describes only fixture-backed discovery, article detail, scenario metadata, and reserved seam status | `evidence.gpl.source_of_truth`, `evidence.gpl.mobile_runtime` | no |
| `gpl.c2.localized_copy_draft_needs_review` | `C2` | `needs_human` | Localized marketing wording is draft copy and needs owner/Pro review | `evidence.gpl.localized_listing` | yes |
| `gpl.c4.play_submission_not_attempted_needs_human` | `C4` | `needs_human` | Play Console use is blocked until owner review and external credentials/account decisions | `evidence.gpl.play_console_not_attempted` | yes |

## Validator Evidence

```powershell
python scripts/agent_tools/validate_google_play_listing.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
```

Current local classification: `pass` for `validate_google_play_listing.py` and `validate_play_store_agent_mvp.py`. Current listing draft keeps contact email, privacy policy URL, category, content rating, and target audience as `NEED_HUMAN`.

## Listing Draft Conclusion

- `docs/launch/store-fields/source-of-truth.json` remains `status=draft`, `submission_scope=dry-run_only`, and `human_review_required=true`.
- `listing.en-US.json` and `listing.zh-CN.json` remain localized metadata drafts, not Play Console entries.
- Draft copy only describes fixture-backed discovery, fixture-backed article detail, scenario metadata, and reserved service seam status.
- Draft copy does not claim live Supabase sync, RevenueCat purchases, Push notifications, account sign-in, production content ingestion, ranking, awards, promotions, partnerships, Google Play review status, privacy correctness, or Data safety correctness.

## NEED_HUMAN

- Privacy policy URL.
- Developer contact email.
- Category, content rating, and target audience.
- Trademark/content authorization.
- Human review of all listing claims before Play Console use.
