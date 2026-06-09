# Stage G Decisions

## Canonical Source Rules

- content pack canonical source: `fixtures/test-inputs/scenarios/`
- business-flow pack canonical source: `fixtures/test-business/scenarios/` when that pack exists
- current Stage G primary reuse set: content pack in `fixtures/test-inputs/scenarios/` plus exported runtime bundles in `mobile/fixtures/runtime/current/`
- compatibility-only alias layer: Stage G synthetic ids `s16` through `s20` may project to `b01` through `b07` naming when a future business-flow pack appears
- forbidden: dual source-of-truth between `fixtures/test-inputs/scenarios/` and `fixtures/test-business/scenarios/`

## Existing Business-Flow Pack Detection

- checked directories: `fixtures/test-business/`, `scripts/business/`, `output/test-business-pack/`
- current result: not present in this worktree at Stage G start
- write policy: if another Codex thread or worktree later starts modifying those directories, Stage G must stop instead of parallel-writing them

## Stage G Reuse Strategy

- Stage G currently reuses the synthetic content pack as the executable local-runtime source
- if a business-flow pack is added later, `fixtures/test-business/scenarios/` becomes canonical for commercial and growth semantics
- until that pack exists, `s16` through `s20` remain runtime-compatible projections, not a second business canonical source

## Alias Map

- `s16_quota_exhausted_paywall` -> `b01_quota_boundary`
- `s16_quota_exhausted_paywall` -> `b02_premium_locked_then_preview` when paywall wording needs premium preview context
- `s17_campaign_discount_offer` -> `b06_internal_beta_pricing_conflict`
- `s18_promo_code_apply_preview` -> `b03_promo_redeem_success`
- `s18_promo_code_apply_preview` -> `b04_promo_redeem_duplicate_or_ineligible`
- `s19_referral_reward_preview` -> `b05_referral_bind_then_milestone_reward`
- `s20_active_entitlement_profile` -> `b07_subscription_lifecycle`
- `s20_active_entitlement_profile` -> `profile-benefit-summary` as projection only

## Reserved Business-Risk Assets

- `b08_order_idempotency_and_webhook_replay` stays reserved for Stage H/I validation and is not dropped
- `b09_event_dedup_and_metrics_rollup` stays reserved for Stage H/I validation and is not dropped
- `b10_admin_sensitive_change_audit` stays reserved for Stage H/I validation and is not dropped

## Boundary Notes

- Stage G does not make any hand-authored magazine markdown or demo markdown into a canonical dependency
- future editorial demo seam may be documented, but importer work remains disabled
