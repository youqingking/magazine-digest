# H1a Acceptance

## Completion Criteria

- project type is explicitly judged as `uni-app` or `uni-app x`
- payment plugin route is fixed as `uni-pay` or `uni-pay-x`
- merchant/provider input checklist is documented without real secrets
- official example-first validation runbook is documented
- H1b integration entry criteria are documented
- validator and readiness smoke produce explicit artifacts under `output/stage-h1a`
- no frozen Stage B contract is modified by this stage

## Non-Completion Signals

- project type is ambiguous
- payment route is left undecided
- merchant fields are described vaguely without owner/source split
- example project runbook skips config upload, cloud object upload, or database initialization
- H1b entry criteria do not mention merchant inputs, callback ownership, and example proof
- H1a tries to implement real order create, real webhook, or entitlement grant

## Gate Outcome Semantics

- `H1a complete`: documentation and readiness validation are complete
- `H1b ready`: only true when provider, merchant, cert, callback, and example validation prerequisites are actually satisfied

## Expected H1a Outcome For Current Repo

- `H1a complete`: YES once docs and scripts are green
- `H1b ready`: NO until NEED_HUMAN merchant prerequisites are closed
