# Domain Projection Fixtures

## Purpose

Step 06 freezes the projection fixtures used to verify first adoption paths for the selected domains.

References:

- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/SHARED_RUNTIME_ADOPTION_RULES.md`

## Fixture Rule

Fixtures are Step 06 validation assets.

They are not canonical source-of-truth and they do not replace the frozen contracts from Steps 02 to 05.

## Required Fixture Set

Each selected domain must emit at least:

- input fixture
- shared projection fixture
- diagnostics fixture

`podcast-domain` must also emit:

- family-normalized fixture

## Fixture Purpose

Fixtures exist only to prove that the Step 06 adoption path is executable.

Fixtures are used for:

- runtime adoption verification
- route and family-path verification
- diagnostics stability checks
- validator output generation

Fixtures are not used for:

- real ingestion
- real parser validation
- production source truth
- page runtime ownership

## Domain Fixture Matrix

| Domain | Input | Family-normalized | Shared projection | Diagnostics |
| --- | --- | --- | --- | --- |
| `magazine-domain` | required | not applicable | required | required |
| `youtube-domain` | required | not applicable | required | required |
| `podcast-domain` | required | required | required | required |

## Fixture Stability Rule

- Step 06 fixtures should stay small and deterministic
- fixtures should use pilot-safe sample values only
- fixtures should not introduce product intelligence that is still out of scope
