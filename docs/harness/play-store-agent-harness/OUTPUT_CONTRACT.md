# Output Contract

Every Play Store agent must emit claims using one common claim object shape.

## Required Claim Fields

The output contract must contain:

- `value`
- `source`
- `status`
- `confidence`
- `claim_class`
- `human_review_required`

## Claim Object Schema

| Field | Type | Required | Rule |
| --- | --- | --- | --- |
| `claim_id` | string | yes | Stable id scoped to the agent run. |
| `value` | string, number, boolean, object, array, or null | yes | The claim payload. |
| `source` | array | yes | Evidence ledger ids or source refs supporting the claim. |
| `status` | enum | yes | One of the claim status enum values. |
| `confidence` | number | yes | `0.0` to `1.0`, lower for inferred or incomplete evidence. |
| `claim_class` | enum | yes | One of `C0`, `C1`, `C2`, `C3`, `C4`, `C5`. |
| `human_review_required` | boolean | yes | Required true for `C3`, `C4`, `C5`. |
| `limitations` | array | yes | Known limits and blockers. |
| `owner_action` | string or null | yes | Required when status is `needs_human` or `blocked`. |

## Minimal JSON Shape

```json
{
  "schema_version": "play_store_agent_output.v1",
  "agent_id": "privacy-disclosure-prep",
  "run_id": "local-dry-run-YYYYMMDD-HHMMSS",
  "claims": [
    {
      "claim_id": "privacy.sdk_inventory.current_repo",
      "value": "Current repo manifests show no Supabase SDK in apps/mobile package manifest.",
      "source": ["evidence.sdk_inventory.package_manifest"],
      "status": "observed_in_repo",
      "confidence": 0.85,
      "claim_class": "C3",
      "human_review_required": true,
      "limitations": ["Release artifact SDK inventory is not available."],
      "owner_action": "Review release artifact SDK inventory before Play Console use."
    }
  ],
  "human_review_required": true,
  "agno_status": "dry_run_only"
}
```

## Output Rules

- `C0` and `C1` claims may be drafted by Codex, but validator must check evidence.
- `C2` claims may be drafted by Codex, but Pro or owner review is required.
- `C3` and `C4` claims are evidence drafts only and must set `human_review_required=true`.
- `C5` claims must not execute actions. They may only list blockers and must set `human_review_required=true`.
- No output may promote M0 `dry_run_only` to `L3`.
