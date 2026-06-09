# Release Notes

- scenario id: data2_multi_publication_release_candidate
- baseline: data1a_readers_digest_12112025
- build label: data2_multi_publication_release_candidate
- promotion decision: promotable
- gate status: passed

## Inventory
- publications: barrons, the_atlantic
- issues: barrons__09022026, the_atlantic__012026
- article count: 27
- baseline article delta: 12

## Warnings
- gate warnings: 0
- decision warnings: 0
- accepted anomalies: 0

## Overrides
- total override count: 9
- accepted override groups: 1

## Why Promotable
- OPS1 gate passed.
- OPS2 promotion decision is promotable.
- DATA2 budget allows remaining override drift without unresolved release-blocking warnings.

## Why Mixed Preview Was Not Chosen
- data1c_three_release_mixed_preview remains preview-only by DATA2 policy.
- Economist anomaly is accepted only for preview, not for release-candidate apply.

## Accepted Anomalies
- none carried into this release candidate

## Accepted Overrides
- the_atlantic__012026: 9 (temporary_override)
