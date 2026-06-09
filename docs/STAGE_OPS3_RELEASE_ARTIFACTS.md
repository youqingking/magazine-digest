# Stage OPS3 Release Artifacts

## Required Files

- `output/stage-ops3/release-notes.md`
- `output/stage-ops3/release-manifest.json`
- `output/stage-ops3/pre-publish-snapshot.json`
- `output/stage-ops3/post-publish-snapshot.json`
- `output/stage-ops3/post-rollback-snapshot.json`
- `output/stage-ops3/drill-report.json`
- `output/stage-ops3/publish-history.json`
- `output/stage-ops3/dashboard.json`
- `output/stage-ops3/smoke-report.json`

## Release Notes Minimum Content

- scenario id
- compared baseline
- publication / issue additions
- article delta
- warning summary
- accepted anomaly summary
- override summary
- promotable reason
- mixed preview not chosen reason

## Provenance Snapshot Minimum Content

- selected scenario id
- current mirror scenario id
- baseline scenario id
- target scenario id
- source bundle path
- publish timestamp
- operator action
- gate result
- promotion decision
- git branch / sha / reachable tags when available

## Dashboard Minimum Content

- drill candidate
- baseline before drill
- current after publish
- current after rollback
- publish action summary
- rollback action summary
- accepted anomalies carried into release
