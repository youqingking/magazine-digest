# Privacy Disclosure Draft

## Status

This is a `privacy disclosure draft` for M2 harness evidence. It is not a Play Console answer, not a privacy policy, and not legal approval.

All privacy, Data safety, SDK disclosure, children/family, ads/tracking, developer contact, Privacy policy URL, legal and submission decisions are `human review required`.

## Evidence-Bound Draft

| claim_id | claim_class | status | draft value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `pdp.c0.fixture_data_surfaces_observed` | `C0` | `observed_in_repo` | 当前 app shell 读取本地 runtime fixture，并展示 publication/article/scenario/product_key 相关内容 | `evidence.pdp.data_inventory`, `evidence.pdp.smoke_fixture` | no |
| `pdp.c0.sdk_manifest_evidence_observed` | `C0` | `observed_in_repo` | 当前 mobile manifest/source 未显示 live Supabase SDK、RevenueCat SDK、Push SDK、ads/tracking SDK 接入 | `evidence.pdp.sdk_inventory` | no |
| `pdp.c3.service_seams_need_review` | `C3` | `needs_human` | Supabase、RevenueCat、Push 仅能描述为 reserved seams；未来接线会改变 disclosure | `evidence.pdp.service_seams` | yes |
| `pdp.c3.privacy_policy_url_missing` | `C3` | `needs_human` | Privacy policy URL 缺失，不能填写 Play Store public policy field | `evidence.pdp.privacy_policy_missing` | yes |
| `pdp.c4.data_safety_requires_owner_review` | `C4` | `needs_human` | Data Safety 只能作为 evidence draft；Play Console 答案必须人工确认 | `evidence.pdp.data_safety_draft` | yes |

## Disclosure Draft Notes

- Current repo evidence supports a local fixture-backed runtime shell, not live user account/cloud/payment/push behavior.
- Fixture content and publication-like labels require rights, policy, and privacy review before public store use.
- Root `app.json` and `apps/mobile/app.json` release identity differences require owner decision before release artifact review.
- This draft must stay blocked on `docs/launch/privacy/human-review-required.md`.

## Required Human Review

- Privacy policy URL and Developer contact.
- Data collection, sharing, deletion, retention, security, and optional/required answers.
- Release artifact SDK inventory and native permission review.
- Children/family, content rating, target audience, ads/tracking, identifiers, diagnostics and crash-reporting.
- Legal/privacy sign-off before any Play Console form is used.
