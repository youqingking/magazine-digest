# Stage UI3.5 Build Classification

## Purpose

- separate “tool missing”, “shell readiness failed”, and “real compile not triggered”
- avoid misreporting automation limits as real compile failures

## Normalized Result Classes

1. `tool_missing`
2. `compile_readiness_failed`
3. `compile_readiness_passed_but_real_compile_not_triggered`
4. `real_compile_passed`
5. `real_compile_failed`

## Current Classification Logic

- `tool_missing`
  - HBuilderX executable cannot be found
- `compile_readiness_failed`
  - shell-level blockers exist in required source files or imports
- `compile_readiness_passed_but_real_compile_not_triggered`
  - shell-level checks pass
  - but no trustworthy signal proves that a real compile was started and finished
- `real_compile_passed`
  - a real compile attempt is explicitly recorded as successful
- `real_compile_failed`
  - a real compile attempt is explicitly recorded as failed

## Important Filtering Rule

For UI3.5 closeout, readiness classification ignores Node-only references found under:

- generated `mobile/unpackage/*`
- cloudfunction-only trees under `mobile/uniCloud-aliyun/*`
- uni-module cloudfunction trees under `mobile/uni_modules/*/uniCloud/*`

These are not treated as front-end shell compile blockers for the mobile client shell.

## Current Result

- normalized current result should be:
  - `compile_readiness_passed_but_real_compile_not_triggered`

## Output Files

- normalized classification report:
  - `output/stage-ui3/build-mobile-report.json`
- compile closeout snapshot:
  - `output/stage-ui3/compile-report.json`
