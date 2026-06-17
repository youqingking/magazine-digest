# Human Approval Gate

The human approval gate prevents draft evidence from becoming public, store,
legal, privacy, credential, account, or production action claims.

## Required Gate Fields

- `approval_id`
- `claim_id`
- `claim_class`
- `required`
- `human_review_required`
- `owner_role`
- `status`
- `decision_ref`
- `expires_at`
- `limitations`

## Gate Schema

```json
{
  "schema_version": "play_store_human_approval_gate.v1",
  "approvals": [
    {
      "approval_id": "approval.privacy_policy_url",
      "claim_id": "privacy.policy_url.public",
      "claim_class": "C4",
      "required": true,
      "human_review_required": true,
      "owner_role": "owner_or_pro_review",
      "status": "needs_human",
      "decision_ref": null,
      "expires_at": null,
      "limitations": [
        "No public privacy policy URL has owner approval in repo evidence."
      ]
    }
  ]
}
```

## Required Human Gates

- Privacy policy URL.
- Developer contact.
- Android package and release source of truth.
- EAS owner, project id, and build profile.
- Signing key and service account policy.
- Play developer account and app record.
- Data safety answers.
- SDK inventory from release artifact.
- Target audience, content rating, and Families policy.
- Trademark, content authorization, and public screenshot use.
- Submission, rollout, and production release.

## Gate Rules

- `C3`, `C4`, and `C5` must set `human_review_required=true`.
- `C5` may never execute inside this harness.
- Missing approval must produce status `needs_human` or `blocked`.
- Validator must fail if a `C3`, `C4`, or `C5` example omits `human_review_required=true`.
