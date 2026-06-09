# Stage G Acceptance

## Required Surfaces

- `commercial-offer`
- `quota-status`
- `promo-preview`
- `referral-summary`
- `reward-summary`
- `campaign-landing`
- `profile-benefits`

## Required Synthetic Coverage

- `s16_quota_exhausted_paywall`
- `s17_campaign_discount_offer`
- `s18_promo_code_apply_preview`
- `s19_referral_reward_preview`
- `s20_active_entitlement_profile`

## Required Mobile Foundation

- paywall reads `commercial-offer` plus `quota-status`
- detail explains paywall reason and quota hint without breaking E2 reading baseline
- profile shows entitlement, quota, reward, save-later, and inbox summaries
- invite shows invite code, share preview, reward summary, and rule block placeholders
- campaign shows landing preview, discount summary, and CTA placeholders
- settings keeps only lightweight commercial/notification summary

## Required Admin Foundation

- generated track covers `pricing_plans`, `quota_policies`, `promo_campaigns`, `promo_codes`, `referrals`, `reward_ledger`, `experiments`, and `feature_flags`
- manual track covers `offer_preview_inspector`, `promo_stacking_inspector`, `quota_policy_inspector`, `referral_reward_preview`, `campaign_landing_preview`, and `experiment_offer_preview`

## Required Event Wiring

- `paywall_offer_impression`
- `quota_exhausted`
- `promo_apply_attempt`
- `promo_apply_success`
- `promo_apply_fail`
- `invite_preview_open`
- `referral_share_click`
- `reward_summary_open`
- `entitlement_view`
- `campaign_open`

## Required Validation Chain

- `verify`
- `validate-stage-b`
- `validate-f1-foundation`
- `validate-stage-g`
- synthetic pack build, validate, export, and select for `s16`, `s18`, and `s19`
- `build:backend`
- `build:admin`
- `build:mobile`
- `smoke:stage-g`
