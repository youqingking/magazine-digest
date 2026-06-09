# Stage RC1 Gaps

## Intentional Non-goals

- no full release engineering platform
- no GUI automation stack
- no new publish gate coupling
- no IA or visual redesign work
- no schema / backend contract rewrite

## Current Gaps That Remain Manual

- fresh HBuilderX compile confirmation still requires a human run
- H5 visual verification still requires a human browser session
- non-tab route click-through still requires human interaction
- provenance still depends on the operator comparing runtime Build Audit against current source context

## Residual Risk

- source-side `Build Audit` metadata can be newer than the currently running package until the operator rebuilds and relaunches
- screenshots may stay local and therefore are not guaranteed to be visible from git history alone
- RC1 can standardize closeout workflow, but cannot manufacture trustworthy manual proof

## NEED_HUMAN Triggers

- no access to HBuilderX
- no runnable H5 environment
- no way to capture screenshots
- runtime package does not show updated Build Audit values after rebuild
- compile/runtime error reappears on `detail`
- selected/current scenario does not match intended manual validation target
