# Stage B Rule Precedence

## 1. Content Variant Selection

Decision order:

1. `product_key` exact match
2. `article_id` exact match
3. `language` exact match, then allowed fallback language only if future policy explicitly permits it
4. `audience_segment` safe boundary:
   - teen request: `teen`, then `general`, never `adult`
   - general request: `general`, then product-approved neutral fallback only
   - adult request: `adult`, then `general` if explicitly allowed by variant fallback policy
5. `reading_mode` exact match
6. `publish_status` must be effective and readable: `published`, or `scheduled` when `publish_at <= now`
7. `available_from <= now` when present, and `available_until > now` when present
8. highest `revision`
9. `fallback_policy` final gate

If no safe match survives, return an explicit unavailable reason.

## 2. Access Evaluation

Decision order:

1. product availability and kill switch
2. auth requirement
3. audience restriction
4. entitlement access
5. quota fallback
6. feature flag gating
7. experiment display changes that do not weaken any prior safety or billing rule

## 3. Price Settlement

Decision order:

1. base `pricing_plans.price_fen`
2. experiment display or targeting hints, without mutating the fact price directly unless experiment explicitly points to an eligible campaign or plan
3. active `promo_campaigns.price_multiplier_basis_points`
4. `promo_codes` adjustment derived from the linked campaign semantics
5. stackability rule from plan and campaign
6. floor price rule using `pricing_plans.price_floor_fen`
7. final amount persisted into `payment_orders.final_amount_fen`

Notes:

- Internal beta 3-discount is modeled as `price_multiplier_basis_points=3000`, not global repricing.
- A promo code cannot bypass a plan floor price.

## 4. Reward Granting

Decision order:

1. referral bind validity and anti-abuse checks
2. campaign eligibility window
3. trigger milestone evaluation:
   - registration reward
   - first valid action reward
4. duplicate grant check by business idempotency key
5. append `reward_ledger`
6. project resulting access change into `entitlements` only if the reward changes access

## 5. Configuration And Kill Switch

Decision order:

1. `products.active_status`
2. blocking `feature_flags`
3. `quota_policies`
4. `pricing_plans`
5. `promo_campaigns`
6. `promo_codes`
7. `experiments`

Interpretation:

- No single `app_config` truth table exists in Stage B.
- Each rule class owns its own contract and lifecycle.

## 6. Discovery Ranking

Decision order:

1. product active and no blocking kill switch
2. content is already readable under content variant selection and access evaluation
3. active availability window from `available_from` / `available_until`
4. explicit `publish_batches` grouping when present
5. user-state boosts in this order:
   - `user_content_state.reading_state=in_progress`
   - `user_follows.status=active`
   - `user_content_state.bookmark_status=saved`
6. `update_priority`
7. recency by effective publish or revision timestamp

Interpretation:

- Discovery ordering may reorder eligible content, but it must never make an ineligible item readable.

## 7. Notification Delivery

Decision order:

1. product active and campaign active
2. content or batch is still inside publish and availability windows
3. user channel eligibility:
   - OS/device push permission mirror
   - `user_product_profiles.push_opt_in`
   - `user_notification_prefs`
4. follow or audience targeting match
5. quiet-hours suppression unless `notify_level=mandatory` or breaking override applies
6. dedupe window and existing inbox/delivery suppression
7. channel fan-out:
   - inbox first
   - push second when allowed
   - digest aggregation last when configured

Interpretation:

- Inbox durability wins over push best-effort delivery.
- Quiet hours suppress channel send, not durable inbox creation, unless the campaign is fully suppressed.
