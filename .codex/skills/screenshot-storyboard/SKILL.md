---
name: screenshot-storyboard
description: 生成 Google Play 截图 storyboard 与 capture shot-list，把每个截图 shot 绑定到真实 app screen、route、scenario、claim、证据、文案和禁止展示项。Use when Codex needs screenshot planning, store screenshot shot contracts, capture handoff JSON, route/claim binding, or no-fabrication screenshot storyboards without capturing screenshots, editing UI, or producing final store assets.
---

# screenshot-storyboard

## 目标

为 Google Play 上架截图准备可执行、可审计的 storyboard。这个 skill 只写镜头、页面、场景、claim、文案和限制；不捕获 raw screenshot，不生成最终设计图，不修改 UI，不把 mockup 当作真实 app 截图。

核心原则：Parse, don't validate。先解析真实项目事实，再输出规划结论：

- 真实 route：优先从 `mobile/pages.json`、app 配置和页面源码解析。
- 真实 scenario：优先从 runtime fixture、listing claim、已有发布报告解析。
- 真实 claim：只绑定已有证据可支撑的功能，不写不存在的卖点。
- 人工确认：公开上架使用、商标/内容授权、裁切、安全区、文案、设备规格、订阅/支付/账号画面都必须 `NEED_HUMAN`。

## 使用方式

优先运行 skill 同目录脚本：

```powershell
python .codex/skills/screenshot-storyboard/scripts/screenshot_storyboard.py --root .
```

默认输出：

```text
play-store-launch/reports/screenshot-storyboard.zh.md
play-store-launch/reports/screenshot-storyboard-output.json
play-store-launch/reports/screenshot-storyboard-evidence.jsonl
play-store-launch/reports/screenshot-shot-list.json
play-store-launch/reports/screenshot-capture-handoff.json
play-store-launch/reports/screenshot-design-brief.json
```

校验输出：

```powershell
python .codex/skills/screenshot-storyboard/scripts/validate.py --root . --report play-store-launch/reports/screenshot-storyboard-output.json
```

把 storyboard 交给真实截图 skill 时，使用显式 shot-list：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-list play-store-launch/reports/screenshot-shot-list.json
```

## 职责边界

Do:

- 把每个 shot 绑定到真实 `screen / route / scenario / claim / evidence_refs`。
- 写清每张上架图“讲什么故事”、允许的 overlay copy、可见证据和 `must_not_show`。
- 输出 capture handoff，供 `screenshot-capture-agent` 后续从真实 Android app 捕获 raw PNG。
- 标记所有公开使用、合规、设计、内容授权和商标判断为 `NEED_HUMAN`。

Do not:

- 不调用 Play Console。
- 不捕获 screenshot，不伪造 raw PNG。
- 不修改 app UI、fixture、生产配置或代码行为来迎合截图。
- 不使用项目中不存在的页面、route、功能、订阅权益、账号能力或内容。
- 不把 storyboard、旧设计稿、候选图片或 mockup 写成“可提交”“最终合规”“submission ready”。
- 不依赖 Agno workflow、其他 agent skill 或 `play-store-launch` 目录下的共享 validator。`play-store-launch/reports` 仅作为默认输出目录。

## 与 screenshot-capture-agent 的关系

`screenshot-storyboard` 是上游规划；`screenshot-capture-agent` 是下游真实截图证明。

```text
真实代码/页面/fixture/listing claim
        ↓
screenshot-storyboard：生成 shot 合同与 capture handoff
        ↓
screenshot-capture-agent：按 shot-list 捕获真实 Android raw screenshots
        ↓
design：基于 raw screenshot 加背景/标题，不虚构功能
```

storyboard 可以读取 capture 报告来展示当前捕获状态，但不能把 capture 失败或旧图片候选当作真实截图证据。

## 输出要求

中文报告必须包含：

- 总状态与“非最终上架素材”声明。
- 真实 app identity、route、runtime fixture、listing claim 和上游 gate 摘要。
- shot 表：`shot_id`、route、scenario、claim、story、overlay copy、must_not_show、人工确认。
- capture handoff 命令与阻塞项。
- `NEED_HUMAN` 清单。
- 不能公开使用或需要暂缓的页面/shot。

机器报告必须包含：

- `schema_version`
- `generated_at`
- `overall_status`
- `storyboard_status`
- `root`
- `project_fingerprint`
- `official_requirements`
- `source_of_truth`
- `shots`
- `capture_shot_list`
- `capture_handoff`
- `design_brief`
- `claims`
- `evidence`
- `human_review_gates`
- `blockers`
- `limitations`
- `output_paths`

## 引用资料

- `references/google-play-screenshot-spec.zh.md`：Google Play 截图基础规格和人工审核点。
- `references/evidence-rules.zh.md`：shot、claim、evidence、`NEED_HUMAN` 规则。
- `references/capture-handoff-schema.zh.md`：传给 capture skill 的 shot-list/handoff 字段约定。
- `references/boundary.md`：skill 自有边界与禁止事项。

## 完成后的验证

```powershell
python .codex/skills/screenshot-storyboard/scripts/screenshot_storyboard.py --root .
python .codex/skills/screenshot-storyboard/scripts/validate.py --root . --report play-store-launch/reports/screenshot-storyboard-output.json
python C:/Users/Administrator/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/screenshot-storyboard
git diff --check
git status --short
```
