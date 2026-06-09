# Protected Path Snapshot Policy

## Purpose

Step 07 strengthens immutability checks for Step 02 to Step 06 protected files.

References:

- `docs/STAGE_SHARED_STEP02_DECISIONS.md`
- `docs/STAGE_SHARED_STEP03_DECISIONS.md`
- `docs/STAGE_SHARED_STEP04_DECISIONS.md`
- `docs/STAGE_SHARED_STEP05_DECISIONS.md`
- `docs/STAGE_SHARED_STEP06_DECISIONS.md`

## Why Step 07 Adds Snapshots

Git tracked diff alone is not enough for the protected-path rule because some local files may exist before they are tracked.

Step 07 therefore adds a content-hash snapshot policy.

## Snapshot Artifact

Step 07 writes:

- `output/shared-step-07/protected-paths.snapshot.json`

## What The Snapshot Stores

For each protected path, Step 07 records:

- relative path
- existence
- git tracked status
- SHA-256 content hash

## Validator Requirements

The Step 07 validator must check:

1. each protected file exists
2. the current content hash matches the snapshot hash
3. git tracked diff is still reported when available
4. when no snapshot exists yet, the validator creates a baseline snapshot and records that explicitly

## Baseline Rule

Step 07 does not require an automatic git commit to create the snapshot.

When the snapshot is created for the first time, validation must clearly report:

- baseline snapshot generated: `true`
- snapshot mode: `baseline`

This allows Step 08 and later stages to use stronger immutability checks even for files that were not previously tracked.
