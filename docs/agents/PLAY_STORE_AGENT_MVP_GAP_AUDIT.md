# Play Store Agent MVP Gap Audit

M0: Harness audit + Agno runtime check

## Repo Position

- Branch: detached HEAD (`git branch --show-current` returned empty)
- Commit: `914f0ce`
- Worktree clean before M0: yes
- Scope: audit only. No M1 implementation, no Common Harness creation, no agent hardening, no new agents.

## Files Found

Play Store agent docs and outputs:

- `docs/agents/PLAY_STORE_AGENT_REGISTRY.md`
- `docs/agents/PLAY_STORE_AGENT_MVP.md`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`
- `docs/release/PLAY_STORE_RELEASE_DRY_RUN.md`
- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md`
- `docs/launch/privacy/human-review-required.md`
- `docs/launch/privacy/privacy-disclosure-prep-report.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`
- `docs/launch/store-fields/source-of-truth.json`
- `docs/launch/google-play/listing.en-US.json`
- `docs/launch/google-play/listing.zh-CN.json`
- `docs/launch/google-play/listing-validation-report.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`
- `docs/launch/screenshots/storyboard.md`
- `docs/launch/screenshots/shot-list.json`
- `docs/launch/screenshots/screenshot-validation-notes.md`

Skill files:

- `.agents/skills/release-build-agent/SKILL.md`
- `.agents/skills/privacy-disclosure-prep/SKILL.md`
- `.agents/skills/google-play-listing/SKILL.md`
- `.agents/skills/screenshot-storyboard/SKILL.md`

Validator files:

- `scripts/agent_tools/play_store_agent_validation_lib.py`
- `scripts/agent_tools/validate_release_build_agent.py`
- `scripts/agent_tools/validate_privacy_disclosure_prep.py`
- `scripts/agent_tools/validate_google_play_listing.py`
- `scripts/agent_tools/validate_screenshot_storyboard.py`
- `scripts/agent_tools/validate_play_store_agent_mvp.py`

Eval files:

- `evals/agents/release-build-agent.eval.yaml`
- `evals/agents/privacy-disclosure-prep.eval.yaml`
- `evals/agents/google-play-listing.eval.yaml`
- `evals/agents/screenshot-storyboard.eval.yaml`
- `evals/agents/play-store-agent-mvp.eval.yaml`

Agno workflow docs found:

- `docs/agno/PLAY_STORE_AGENT_TEAM.md`
- `docs/agno/PLAY_STORE_LAUNCH_WORKFLOW.md`

## Per-Agent Audit

| Agent | Skill / SKILL.md | Agent doc | Input contract | Output schema | Evidence rules | Validator | Validator depth | Eval cases | Agno step artifact | Evidence vs draft | Risky final wording |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `release-build-agent` | yes | yes: registry, MVP, release gate, release dry-run | partial: prose `Required Inputs` in skill | partial: prose outputs, no machine schema | partial: command evidence and NEED_HUMAN markers | yes | surface plus guardrails: required files, required terms, secret scan, bounded final-word scan | skeleton | missing | has repo command evidence, but no signed release artifact and no artifact ledger | guarded; current docs explicitly say blocked / not ready to submit |
| `privacy-disclosure-prep` | yes | yes: registry, MVP, privacy docs, data safety docs, report | partial: prose `Required Inputs` in skill | partial: prose tables and markdown, no common schema | partial: evidence table and human review gate | yes | surface plus guardrails: required files, required terms, secret scan, bounded final-word scan | draft | missing | mostly draft/evidence docs; no release artifact SDK inventory | guarded; current docs explicitly say not legal approval / not final |
| `google-play-listing` | yes | yes: registry, MVP, listing JSON/report/readiness | partial: prose plus `source-of-truth.json` | partial: listing JSON shape checked, no common agent schema | partial: claim guardrails in source/listing JSON | yes | stronger than surface for listing JSON: parses JSON, checks status, field limits, NEED_HUMAN fields, claim guardrails, plus final-word scan | draft | missing | produces draft listing metadata from repo source-of-truth; no Play Console evidence | guarded; listing remains draft and blocked |
| `screenshot-storyboard` | yes | yes: registry, MVP, storyboard/shot-list/notes | partial: prose `Required Inputs` in skill | partial: `shot-list.json` shape checked, no common agent schema | partial: must_not_show, internal `/debug`, human review markers | yes | partial structural check: parses shot-list JSON, checks hardcoded allowed routes, human review, draft, no submission assets; does not derive route truth from app | draft | missing | planning docs only, no real screenshots or image spec approval | guarded; storyboard remains draft planning |

## Largest Gaps Across The Four Existing Agents

- No Common Harness substrate exists for these agents.
- Per-agent contracts are prose in `SKILL.md`; there is no shared machine-readable input contract.
- Per-agent outputs are a mix of markdown and JSON; there is no shared output contract or run artifact schema.
- Evidence is present as docs/tables, but not as a normalized evidence ledger with claim IDs, source references, freshness, and verifier results.
- Claim classification is ad hoc: listing has claim guardrails, validators scan final/compliance words, but there is no shared claim taxonomy.
- Human approval gates are documented but not enforced as a common gate artifact.
- Validators check presence, required terms, JSON shape for listing/shot-list, secret patterns, and bounded final wording. They do not prove every agent claim is bound to repo evidence.
- Eval files are skeleton/draft cases, not an executable eval protocol with fixtures, expected artifacts, and pass/fail scoring.
- Agno workflow docs exist, but no step-level Agno run artifact was found.

## Missing Contracts

- Common Harness input contract.
- Common Harness output contract.
- Common run artifact schema.
- Evidence ledger schema.
- Claim classification schema.
- Human approval gate schema.
- Agent handoff schema.
- Step artifact schema for Agno or Agno-ready runs.
- Eval protocol and eval result schema.
- Failure mode taxonomy shared across all agents.

## Missing Validators

- No validator for a common input contract.
- No validator for a common output contract.
- No validator for an evidence ledger.
- No validator for claim classification.
- No validator for human approval gate completeness.
- No validator for a validation matrix tied to each claim class.
- No validator for Agno step protocol or step-level artifacts.
- No validator for executable eval runs.
- No validator proving docs with command evidence reflect freshly run commands.

## Surface-Only Or Mostly Surface Validators

- `validate_release_build_agent.py`: mostly required-file and required-term checks, plus final-word and secret scans. It does not replay or verify release command evidence.
- `validate_privacy_disclosure_prep.py`: mostly required-file and required-term checks, plus final-word and secret scans. It does not bind every Data safety statement to a structured evidence record.
- `validate_play_store_agent_mvp.py`: aggregate presence, term, changed-path, final-word, and secret checks. It does not create or validate a Common Harness artifact.

Partially structural validators:

- `validate_google_play_listing.py`: parses listing/source JSON and checks draft status, field limits, NEED_HUMAN fields, submission guardrails, and must-not-claim terms.
- `validate_screenshot_storyboard.py`: parses shot-list JSON and checks draft status, route allowlist, internal `/debug`, `must_not_show`, and human review markers.

## Evidence-Binding Gaps

- Release build claims are not bound to a normalized command-run artifact with command, cwd, exit code, timestamp, stdout/stderr digest, and generated-output policy.
- Privacy/Data safety claims are not bound to claim IDs or structured evidence rows with source type, source path, limitation, and reviewer status.
- Listing claims are guarded by JSON fields, but not traced claim-by-claim to app source, fixture evidence, and human review blockers.
- Screenshot claims use a shot-list shape, but route truth is hardcoded in the validator rather than derived from the app/router surface during the run.
- Human approval requirements exist in docs, but no approval gate artifact blocks a claim from moving to final/approved/submitted.
- Existing outputs are primarily draft docs and JSON drafts. Only some docs cite repo evidence; none are Common Harness evidence ledger entries.

## Potentially Misleading Final Outputs

Current files mostly avoid unbounded final wording. The validator library scans `final`, `approved`, `compliant`, `ready to submit`, and `submission ready` and allows them only in bounded contexts.

Residual risk:

- `PLAY_STORE_SUBMISSION_READINESS.md` and release dry-run docs include "pass" classifications for local validators/commands. Without a common claim taxonomy, readers may overread local validation pass as store readiness.
- `validate_play_store_agent_mvp.py` prints `agno_dry_run_ready=true`; this can be misread as real Agno runtime readiness even though no repo Agno runner or step artifacts were found.
- Listing and screenshot outputs are draft artifacts, but there is no machine gate preventing reuse as final Play Console inputs.

## Human Approval Gate Gaps

- Approval needs are documented in `docs/NEED_HUMAN.md` and per-agent docs.
- Missing: a machine-readable human approval gate artifact.
- Missing: per-claim owner, approver, status, timestamp, and scope.
- Missing: validator that fails if a claim requiring approval is promoted to final/submitted/approved.
- Missing: gate for Play developer account, app record, Android package, EAS owner/projectId, signing, privacy policy URL, developer contact, Data safety answers, target audience, content rating, trademark/content authorization, screenshots, submission, and rollout.

## Common Harness Audit

| Common Harness item | Status | Notes |
| --- | --- | --- |
| Input contract | missing | Only per-skill prose `Required Inputs` exists. |
| Output contract | missing | Outputs are mixed docs/JSON without a shared agent result contract. |
| Evidence ledger | missing | Evidence tables exist, but no normalized ledger. |
| Claim classification | missing | Only ad hoc guardrails and forbidden-final scans. |
| Human approval gate | partial docs only | No machine-readable gate artifact or validator. |
| Validation matrix | missing for Play Store Common Harness | Existing `docs/VALIDATION_MATRIX.md` is not this substrate. |
| Agno step protocol | docs only | `docs/agno/**` describes dry-run workflow; no executable protocol artifact. |
| Run artifact schema | missing | No common run report/trace schema found. |
| Eval protocol | skeleton only | Eval YAML files are draft/skeleton cases. |
| Failure modes | partial | Per-agent blocked cases exist; no shared taxonomy. |

Existing unrelated harness assets such as `docs/HARNESS.md`, `docs/harness/**`, `packages/attention-*-harness/**`, and `scripts/agent_tools/validate_harness_minimal.py` are not the requested Play Store Common Harness substrate. `validate_harness_minimal.py` also targets an older minimal skill set (`owner-card`, `reality-object-compiler`, `repo-audit`) and should not be treated as M1 readiness.

## Can Proceed To M1?

No.

The repo has useful Play Store agent MVP material, but it is not yet safe to enter M1 Common Harness Substrate without owner confirmation and a dedicated implementation thread. The blockers are structural, not cosmetic.

## Immediate Blockers

- Common Harness contracts are missing.
- Evidence ledger and claim classification are missing.
- Human approval gate is not machine-readable or validator-enforced.
- Eval protocol is skeleton/draft only.
- Agno runtime is not repo-integrated; workflow is document dry-run only.
- Existing validators are not sufficient to prove evidence-bound claims.

## Owner Decisions Needed

- Approve whether M1 should create a Common Harness substrate in this repo.
- Decide whether the next stage is L2 Agno-ready only or real L3 Agno runtime adoption.
- Decide whether Agno dependency, runner, MCP/connector assets, and eval workflow assets are allowed in a future scoped thread.
- Decide the canonical schema locations for input contract, output contract, evidence ledger, approval gate, run artifact, and eval protocol.
