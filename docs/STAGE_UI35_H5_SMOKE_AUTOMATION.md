# Stage UI3.5 H5 Smoke Automation

## Goal

- Reduce UI3.5 manual smoke burden by moving stable shell and route checks into automated H5 Playwright smoke.
- Keep the remaining manual work focused only on proof that cannot be trusted from current automation.

## Automated Scope

- publish current `mobile` project to web through HBuilderX CLI
- serve the exported web build locally
- verify the final `3-tab` shell:
  - `feed`
  - `search` or `来源` on route `pages/search/index`
  - `profile`
- verify formal non-tab entry chains:
  - `feed -> paywall`
  - `profile -> paywall`
  - `paywall -> invite`
  - `profile -> settings`
  - `campaign alias -> paywall`
- verify detail read path basics:
  - default `quick_30s`
  - switch to `deep_3m`
- verify settings still exposes runtime / auth / device / push surfaces
- verify feed return-state UI signals that are reliably observable in H5:
  - `activeTab`
  - `updateType`

## Still Manual After Automation

- `Build Audit` visibility in a dev-style runtime
  - current published H5 build does not reliably expose the same dev-only block as the previously confirmed runtime
- source provenance re-confirmation through the in-app Build Audit surface
- exact scroll restoration pixel value after detail back
- app-plus / MuMu specific runtime behavior

## Why H5 Is A Good Fit

- HBuilderX CLI can publish the current project root to `mobile/unpackage/dist/build/web`
- Playwright can reliably read route text, bottom shell text, and visible CTA chains in the exported H5 build
- this removes most of the repetitive navigation work from human closeout

## Output

- wrapper report: `output/stage-ui35-h5/h5-shell-wrapper.json`
- main automation report: `output/stage-ui35-h5/h5-shell-report.json`
- screenshot: `output/stage-ui35-h5/h5-shell.png`
- publish log: `output/stage-ui35-h5/h5-shell-build.log`

## Run

- `npm run smoke:stage-ui35-h5`
- or `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-ui35-h5.ps1`

## Success Criteria

- automated report status is `passed`
- `3-tab` shell is detected in the exported H5 runtime
- non-tab official entry chains remain reachable
- detail mode switching remains healthy
- remaining manual work is materially smaller than the previous UI3.5 checklist
