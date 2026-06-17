# Play Store Agent + Agno Workflow Transfer

Run id: play-store-agent-agno-transfer-20260617-062046
Source: codex/play-store-agent-reality-gate @ 0fd7e70
Target base: origin/test @ 6bcff33
Files included: 228
Package: play-store-agent-agno-transfer-20260617-062046-source-0fd7e70.zip
SHA-256: 729610577d347c1b27919246a82f060ae9479bce260ee25ea3caf9049f875f05

## Scope

- 8 Play Store agent skill directories under `.agents/skills`.
- Agno-native workflow boundary under `play-store-launch`.
- Harness, Agno, and agent registry docs under `docs/harness`, `docs/agno`, and `docs/agents`.
- Command compatibility wrappers and validators under `scripts/agent_tools` and `scripts/harness`.
- App-owned evidence inputs under `docs/release`, `docs/privacy`, and `docs/launch` for validation only.
- Validator fixtures/evidence under `evals/agents`, `artifacts/agno/play-store/m2`, `artifacts/agno/play-store/m4`, `artifacts/agent-reality-runs`, and `artifacts/launch-package`.

## Guardrails

- No Play Console submission is performed.
- No credentials are packaged.
- Historical workflow artifacts are included only where existing validators require fixture/evidence inputs; they are not treated as new production outputs.
