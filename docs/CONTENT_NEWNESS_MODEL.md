# Stage F0 Content Newness Model

## Goal

- Distinguish brand-new content from meaningful revisions.
- Support continue-reading, save-for-later, inbox, and batch-summary surfaces without changing Stage B content truth.

## Canonical Inputs

- `article_variants.publish_at`
- `article_variants.revision`
- `article_variants.publish_batch_id`
- `article_variants.update_type`
- `article_variants.update_priority`
- `article_variants.change_summary`
- `article_variants.notify_level`
- `article_variants.is_breaking`
- `article_variants.available_from`
- `article_variants.available_until`
- `user_content_state`

## Interpretation

- `new_publish` means the user has no earlier readable version in the same article family.
- `revision` means a newer readable revision exists and should usually preserve resume context.
- `correction` is a revision with stronger explanation needs and may escalate inbox or push priority.
- `highlight_refresh` means re-surfacing existing content for discoverability without changing base access truth.
- `sunset` marks content approaching or entering an unavailable window.

## User-State Projection

- `user_content_state.newness_state=new` means the user has not yet seen the item in discovery or inbox.
- `seen_in_list` means surfaced but not opened.
- `opened` means the detail path was entered.
- `consumed` means completion or equivalent terminal read behavior.

## Ranking Hints

- `update_priority` sorts within an already eligible set.
- `is_breaking=true` is a stronger hint than `update_priority=critical` for quiet-hours override discussions, but still cannot bypass safety or entitlement rules.
- `change_summary` is display copy only and must not become rule truth.

## Window Model

- `publish_at` is workflow effectiveness.
- `available_from` / `available_until` is user-facing discoverability/readability window.
- If `available_until` passes, the item must drop out of resume/discovery and inbox actions even if historical audit rows remain.
