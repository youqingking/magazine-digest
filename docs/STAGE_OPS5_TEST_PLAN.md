# Stage OPS5 Test Plan

## Scope

OPS5 validates that the lightweight editorial CRUD console can manage file-backed publication, issue, article metadata override, taxonomy, and scenario membership changes without breaking TEST2 protections, release evaluation, or existing runtime/release foundations.

## Required Checks

1. Publication create/edit/archive works through the CRUD action layer.
2. Issue create/edit/archive works through the CRUD action layer.
3. Article override create/edit/delete works through override files and normalized metadata refresh.
4. Taxonomy mapping create/edit/disable works through taxonomy source files and targeted rebuilds.
5. Scenario membership include/exclude/rebuild works through warning budget edits and candidate rebuild.
6. CRUD writes produce:
   - `output/stage-ops5/crud-audit-log.json`
   - `output/stage-ops5/entity-change-report.json`
   - `output/stage-ops5/rebuild-trigger-report.json`
7. Operator console can read:
   - `/api/editorial`
   - `/api/ops5`
   - `/api/crud-action`
8. Existing validation chain remains green:
   - TEST1
   - OPS2
   - DATA2
   - OPS3
   - TEST2
   - OPS4
   - REL1
   - OBS1

## Safety Rules

- Smoke must snapshot and restore source-of-truth files after temporary CRUD mutations.
- Smoke must not mutate immutable release artifacts directly.
- Smoke must preserve baseline scenario selection and current mirror.
- Stateful CRUD scripts must continue to acquire the `runtime-state` lock.

## Expected Outputs

- `output/stage-ops5/smoke-report.json`
- refreshed OPS5 audit outputs
- refreshed dependent quality/taxonomy/candidate reports after smoke restore
