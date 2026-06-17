---
name: screenshot-capture-agent
description: Attempt or explicitly block real Android screenshot capture from the screenshot storyboard while preserving route, device, locale, commit, and no-fabrication evidence.
---

# screenshot-capture-agent

## Goal

基于 storyboard 和 shot-list 尝试真实截图捕获；如果缺少 device/emulator/capture tooling，则明确 `capture_status=blocked`。该 Skill 不伪造截图，不生成 raw PNG，除非真实 capture 成功。

All screenshot public-use and capture decisions remain `human review required`.

## Required Inputs

- `docs/launch/screenshots/storyboard.md`
- `docs/launch/screenshots/shot-list.json`
- `docs/launch/screenshots/screenshot-human-review-required.md`
- `docs/launch/screenshots/screenshot-validation-notes.md`
- `docs/harness/play-store-agent-harness/INPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md`
- `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`

## Expected Outputs

- `docs/launch/screenshots/capture-report.md`
- `docs/launch/screenshots/capture-blockers.md`
- `docs/launch/screenshots/screenshot-capture-agent-output.json`
- `artifacts/agno/play-store/m4/screenshot-capture-agent.json`
- If real capture succeeds: `artifacts/screenshots/raw/android/en-US/*.png`
- `evals/agents/screenshot-capture-agent.eval.yaml`

## Do / Do Not Rules

Do:

- 记录 `adb devices`、device/emulator availability、route、locale、commit 和 blocker。
- 缺少真实 capture 条件时输出 `capture_status=blocked`。
- 每张未来截图必须记录 route、device、locale、commit hash。

Do not:

- 不伪造截图。
- 不把 storyboard 当作 captured screenshot。
- 不展示未实现功能。
- 不修改 app source behavior。
- 不调用 Play Console。

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_screenshot_capture_agent.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_screenshot_capture_agent.py
python scripts/agent_tools/validate_play_store_agent_mvp.py
git diff --check
git status --short
```

validator command: `python scripts/agent_tools/validate_screenshot_capture_agent.py`

## Final Report Format

- changed files
- capture_status
- screenshot paths or blocked reason
- validation results
- `NEED_HUMAN`
- blockers

## Human Approval Points

- Android device or emulator.
- Capture route rendering.
- Image specs, crop, safe area, status bar.
- Trademark/content authorization.
- Public store asset selection.
