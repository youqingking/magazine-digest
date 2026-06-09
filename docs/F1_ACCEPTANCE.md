# Stage F1 Acceptance

## Required runtime foundation

- `home-discovery`, `search-content`, `follow-catalog`, `follow-toggle`, `notification-inbox`, `notification-prefs`, `mark-inbox-read`, `content-resume`, `save-for-later`, and `publish-batch-summary` exist in backend local runtime.
- `notification_inbox` remains the durable source of truth for user-visible notification history.
- `saved_filters` remains deferred and is not frozen as a persisted object in F1.

## Required scenario coverage

- `s11_new_publish_batch` covers new publish batch grouping and new-vs-updated distinction.
- `s12_followed_topic_alert` covers followed publication / topic alert behavior.
- `s13_inbox_digest` covers digest packaging over inbox truth.
- `s14_revision_highlight` covers revision highlight plus continue-reading preservation.
- `s15_quiet_hours_and_dedupe` covers quiet-hours suppression and dedupe behavior without removing inbox truth.

## Required mobile foundation

- Feed is upgraded into discovery home while preserving read-path entry.
- Inbox, search, and follows pages exist and read local runtime surfaces.
- Settings exposes lightweight notification prefs.
- Detail exposes save-for-later / continue reading state without breaking the E2 typography baseline.

## Required validation

- `verify`
- `validate-stage-b`
- `validate-f1-foundation`
- synthetic test pack build / validate / export / select
- `build:backend`
- `build:admin`
- `build:mobile`
- `smoke:stage-f1`
