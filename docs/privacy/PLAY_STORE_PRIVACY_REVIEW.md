# PLAY_STORE_PRIVACY_REVIEW

## Status

本文件是 Play Store privacy review draft。它不是 legal approval，也不是 Google Play Data safety 答案。

所有 privacy、Data safety、SDK disclosure、children/family、ads/tracking、Developer contact、Privacy policy URL、submission 判断均保持 `NEED_HUMAN` / `human review required`。

## Review Inputs

- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/launch/privacy/human-review-required.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`
- `docs/NEED_HUMAN.md`
- `README.md`
- `apps/mobile/README.md`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/mobile/SUPABASE_ENV_CONTRACT.md`

## Privacy Review Table

| Area | Current repo evidence | Current status | Human action |
| --- | --- | --- | --- |
| Privacy policy URL | No approved public URL in repo evidence | NEED_HUMAN | Provide real privacy policy URL and review wording against actual app behavior |
| Developer contact | No approved Play developer contact in repo evidence | NEED_HUMAN | Provide support email/name/address as required by Google Play |
| Data collection | Current shell renders local runtime fixture metadata/content; no live service collection evidenced | draft evidence only | Review actual release artifact, fixture data, service setup, and Google Play form categories |
| Data sharing | No live sharing service evidenced in current `apps/mobile` shell | NEED_HUMAN | Confirm with legal/privacy owner; do not infer from reserved seams |
| SDK inventory | Repo dependency evidence exists in `SDK_INVENTORY.md` | draft evidence only | Review generated artifact and dependency tree |
| SDK disclosure | Supabase/RevenueCat/Push are reserved seams, not live SDK integrations in current shell | NEED_HUMAN | Confirm third-party SDK disclosure before Play Console use |
| Data deletion / retention | No account, cloud storage, or deletion flow evidenced in current shell | NEED_HUMAN | Decide Data safety answers for deletion, retention, and account/data controls |
| Security practices | No release artifact or production transport/storage setup reviewed in this prep | NEED_HUMAN | Decide encryption/security answers from actual production architecture |
| Children/family | No target audience or Families policy decision in repo evidence | NEED_HUMAN | Decide target audience, children/family applicability, content rating, and age policy |
| Ads/tracking | No ads/tracking SDK evidenced in current shell | NEED_HUMAN | Confirm whether ads, analytics, identifiers, attribution, or tracking apply |
| Content rights / publication names | Fixture and listing content reference magazine/publication concepts | NEED_HUMAN | Confirm trademark, copyright, licensing, and marketing claims before public use |
| App identity | `apps/mobile/app.json` omits production ids; root `app.json` has owner/project/package metadata | NEED_HUMAN | Decide release source of truth and reconcile before EAS/Play work |
| Submission | Play Console action is explicitly out of scope | NEED_HUMAN | Human review required before any Play Console action |

## Current Non-Claims

- This prep does not claim privacy compliance.
- This prep does not claim Data safety correctness.
- This prep does not claim Play Store approval.
- This prep does not submit, upload, or call Play Console.

## Guardrails

- Do not answer Play Console forms from this file alone.
- Do not infer live collection, sharing, SDK behavior, or permission usage from reserved seams.
- Do not add SDKs, credentials, analytics, ads, tracking, push, RevenueCat, or Supabase connections during this prep work.
- Keep all unresolved privacy and Data safety items marked `NEED_HUMAN`.
