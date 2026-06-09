# Stage H1a Decisions

## Frozen Decisions

- Stage H1a is readiness-only and does not implement real payment in the main project.
- Current repo client type is judged as `uni-app`.
- Current repo payment plugin route is fixed to `uni-pay`.
- `uni-pay-x` is retained as migration-only guidance for any future `uni-app x` rewrite.
- Example-first validation is mandatory before H1b.
- Merchant ids, certificates, webhook inputs, callback ownership, and provider choice remain NEED_HUMAN until supplied by operators.
- smoke-only auth channels remain outside payment acceptance and cannot be reused as payment proof.

## Route Evidence Summary

- `mobile/App.vue` and `mobile/main.js` are present.
- `mobile/pages.json` is standard `uni-app` page configuration.
- `mobile/unpackage/dist/dev/app-plus/manifest.json` reports `useragent.value = "uni-app"`.
- No app-owned `App.uvue` or `main.uts` markers were found.

## H1b Gate Decision

- H1a documentation gate target: YES
- H1b real payment integration target: NO until example validation and merchant prerequisites are closed

## Explicit Boundaries Reconfirmed

- do not modify Stage B canonical billing contracts
- do not implement real provider create-order in H1a
- do not implement main-project webhook or entitlement grant in H1a
- do not treat H0.5 auth smoke as payment acceptance evidence
