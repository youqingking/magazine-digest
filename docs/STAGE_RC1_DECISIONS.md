# Stage RC1 Decisions

## Scope

- RC1 only closes the long-running `UI3.5 manual runtime closeout` gap as a reusable manual workflow kit.
- RC1 does not reopen IA, tab structure, `detail` ownership, Stage G, or H0/H1a foundation.
- RC1 stays outside OPS1 publish gate. Manual runtime proof remains a separate human closeout.

## Decision Summary

- Establish one repo-local runtime closeout kit rooted at `ops/closeout/ui35/` and `output/stage-rc1/`.
- Split proof into two classes:
  - auto-provided context: scenario pointers, current mirror metadata, TEST1 / gate state, git baseline provenance, build audit source values
  - human-only runtime proof: visible shell shape, route reachability, detail mode behavior, return-state, real compile/runtime observations
- Keep final RC1 result binary:
  - `YES`: only when all blocker manual items pass and required evidence is present
  - `NO`: any missing blocker item, failed blocker item, or missing required evidence

## What Automation May Prove

- current branch / commit / baseline tag reachability
- current selected scenario pointer
- current published mirror scenario metadata
- latest TEST1 status and latest publish gate report
- source-side build audit metadata embedded in the app
- canonical checklist, template, and final report generation

## What Automation Must Not Claim

- HBuilderX compile actually succeeded in a fresh human run
- H5 or HBuilderX UI visually matches the frozen 3-tab shell
- `detail` interaction felt correct to a human operator
- non-tab route entry paths were actually clicked in a real session
- screenshots exist unless the files are really present

## Blocker Policy

- All 12 required runtime checklist items are blocker-class manual items.
- Missing screenshots or missing required text capture for a blocker item are blockers.
- Missing operator / runtime target / execution timestamp are blockers.
- Any mismatch between observed Build Audit values and expected runtime context is a blocker until explained and re-run.

## Warning Policy

- Accepted upstream warnings from DATA1D / TEST1 stay warnings in RC1 and do not auto-fail closeout by themselves.
- Optional extra notes, optional extra screenshots, and uncommitted large evidence artifacts are warnings only.
- RC1 may finish kit implementation while final runtime closeout still remains `NO`.

## Evidence Rules

- Screenshots are mandatory for shell shape, detail mode state, settings Build Audit visibility, and compile/runtime error absence proof surfaces.
- Text capture is mandatory for branch / sha / baseline tag / scenario ids / runtime target / operator / execution timestamp.
- The repo tracks structure and templates; real screenshots may stay repo-local and uncommitted when large or environment-specific.

## YES / NO Gate

RC1 may report `YES` only when all are true:

1. `output/stage-rc1/runtime-closeout-template.json` exists and is manually filled.
2. `output/stage-rc1/runtime-context.json` exists and reflects current repo state.
3. `output/stage-rc1/manual-checklist.md` exists.
4. every blocker manual item is marked `pass`.
5. every blocker manual item has required screenshot references and required text values.
6. referenced evidence files actually exist.
7. operator identity, runtime target, and executed timestamp are recorded.
8. final report contains no blockers.

RC1 must report `NO` when any of the above is false.
