# Claim Classification

## Claim Status Enum

- `observed_in_repo`
- `inferred`
- `missing`
- `blocked`
- `needs_human`
- `not_applicable`

## Claim Classes

| Class | Name | Meaning |
| --- | --- | --- |
| `C0` | observed technical fact | Directly observed repo fact, command result, file value, or validator result. |
| `C1` | inferred product fact | Product-level inference grounded in repo evidence. |
| `C2` | marketing wording | Store copy, public claim, positioning, naming, or screenshot narrative. |
| `C3` | privacy / data safety claim | Privacy, SDK, Data safety, retention, deletion, sharing, tracking, or data handling statement. |
| `C4` | legal / policy / store submission claim | Legal, policy, trademark, content rights, content rating, target audience, Play Console, or submission statement. |
| `C5` | credential / account / production action | Credential, account, signing, Play upload, rollout, production release, or external service action. |

## Claim Class Rules

- `C0` and `C1`: Codex may draft, but validator must check evidence.
- `C2`: Codex may draft, but Pro or owner human review is required.
- `C3` and `C4`: evidence draft only, must set `human_review_required=true`.
- `C5`: action is forbidden in this harness. Only blocker entries are allowed and must set `human_review_required=true`.

## Forbidden Conclusion Terms

These words are forbidden as unapproved outcomes:

- `final`
- `approved`
- `submitted`
- `complete`
- `production_ready`

Allowed usage is limited to this forbidden-term list, negative guardrails, and
blocked or human-review warnings.

## Status And Class Matrix

| Class | Allowed status values | Human review rule |
| --- | --- | --- |
| `C0` | `observed_in_repo`, `missing`, `blocked`, `not_applicable` | Required only when owner decision is needed. |
| `C1` | `inferred`, `missing`, `blocked`, `needs_human`, `not_applicable` | Required when inference affects public or production decisions. |
| `C2` | `inferred`, `missing`, `blocked`, `needs_human` | Required before public use. |
| `C3` | `observed_in_repo`, `inferred`, `missing`, `blocked`, `needs_human`, `not_applicable` | Always required. |
| `C4` | `missing`, `blocked`, `needs_human`, `not_applicable` | Always required. |
| `C5` | `missing`, `blocked`, `needs_human`, `not_applicable` | Always required. Execution is forbidden. |
