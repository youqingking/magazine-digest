# Play Store Privacy Human Review Gate

## Status

本文件是 `Play Store launch privacy human-review gate`，用于把 privacy / Data safety 相关 blocker 集中到 launch preparation 包中。它不是 legal approval，不是 Google Play Data safety 结论，也不是 submission 判断。

所有 privacy、Data safety、SDK disclosure、children/family、ads/tracking、Developer contact、Privacy policy URL、submission 判断均保持 `NEED_HUMAN` / `human review required`。

## Evidence Links

- `docs/NEED_HUMAN.md`
- `docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md`
- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`

## Human Review Checklist

| Area | Status | Evidence | Required human action |
| --- | --- | --- | --- |
| Privacy policy URL | NEED_HUMAN | No approved public URL in repo evidence | Provide and review real public policy URL |
| Developer contact | NEED_HUMAN | No approved Play developer contact in repo evidence | Provide contact email/name/address as required |
| Data safety | human review required | `data-safety-draft.md`, `data-safety-evidence.md` | Review answers against actual release artifact, production services, and Google Play policy |
| SDK inventory | human review required | `docs/privacy/SDK_INVENTORY.md` | Confirm release artifact SDK/dependency inventory |
| SDK disclosure | NEED_HUMAN | `SDK_INVENTORY.md`, current no-credential runtime docs | Confirm third-party SDK disclosure before Play Console use |
| Data collection/sharing | NEED_HUMAN | `DATA_INVENTORY.md`, current app source evidence | Decide collection, sharing, purpose, optional/required, and user-control answers |
| Data deletion/retention/security | NEED_HUMAN | No account/cloud deletion flow or production storage setup evidenced | Decide deletion, retention, encryption, and security answers |
| children/family | NEED_HUMAN | No target audience decision in repo evidence | Decide target audience, children/family policy, age range, and Families policy applicability |
| ads/tracking | NEED_HUMAN | No live ads/tracking evidence in current shell | Confirm whether ads, analytics, identifiers, attribution, or tracking apply |
| App identity/config | NEED_HUMAN | root `app.json` and `apps/mobile/app.json` contain different release metadata | Decide release source of truth before EAS/Play work |
| Content rights/claims | NEED_HUMAN | Fixture/listing may refer to magazine/publication content | Confirm trademark, copyright, licensing, and store copy claims |
| submission | NEED_HUMAN | Play Store submission remains out of scope | Human review required before any Play Console action |

## Guardrails

- Do not treat this file as legal approval.
- Do not answer Play Console privacy or Data safety forms from this file alone.
- Do not add credentials, SDKs, analytics, ads, tracking, push, RevenueCat, or Supabase connections while maintaining this gate.
- Do not remove `NEED_HUMAN` until a human reviewer supplies explicit evidence.
