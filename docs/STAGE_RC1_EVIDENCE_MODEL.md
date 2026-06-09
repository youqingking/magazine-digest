# Stage RC1 Evidence Model

## Repo-local Layout

- `ops/closeout/ui35/`
- `ops/closeout/ui35/screenshots/`
- `ops/closeout/ui35/notes/`
- `ops/closeout/ui35/templates/`
- `output/stage-rc1/`

## Storage Intent

- `ops/closeout/ui35/templates/` stores tracked canonical templates.
- `output/stage-rc1/` stores generated working files for the current closeout run.
- `ops/closeout/ui35/screenshots/` stores real human screenshots when kept repo-local.
- `ops/closeout/ui35/notes/` stores manual notes, operator annotations, and small proof attachments.

## Commit Strategy

- directory structure and lightweight templates should stay tracked
- real screenshots may remain uncommitted when large, repetitive, or environment-specific
- final JSON reports may be committed when they describe a meaningful closeout attempt
- absence of committed screenshots does not imply proof exists; finalize only trusts files present on disk

## Evidence Types

- screenshot evidence
  - image file path under `ops/closeout/ui35/screenshots/`
  - used for visible UI state and compile/runtime console captures
- note evidence
  - markdown or text file path under `ops/closeout/ui35/notes/`
  - used for operator remarks and environment caveats
- text capture
  - inline values inside `runtime-closeout-template.json`
  - used for branch, sha, baseline tag, scenario ids, runtime target, operator, and timestamps

## Evidence Presence Rules

- `evidence_present = true` only when required screenshot references resolve to existing files and required text capture is populated
- `evidence_present = false` when the template remains default, incomplete, or references missing files
- generated context alone never counts as manual runtime evidence

## Blocker vs Warning

- blocker
  - missing required screenshot
  - missing required text capture
  - missing operator / target / execution timestamp
  - failed blocker manual item
  - observed build/runtime provenance mismatch
- warning
  - accepted upstream gate warnings
  - optional notes absent
  - screenshots intentionally kept uncommitted but still present locally
