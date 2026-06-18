---
name: screenshot-capture-agent
description: 作为 screenshot-storyboard 下游，从真实 Android 设备或模拟器按 shot-list 尝试捕获 app raw screenshots，并生成 Google Play 截图证据、设备/route/locale/commit 记录、PNG 规格检查和 fail-closed 阻塞报告。Use when Codex needs real screenshot capture evidence, storyboard shot-list consumption, adb screenshot proof, Google Play screenshot spec checks, raw Android screenshots, capture blockers, or no-fabrication screenshot readiness review.
---

# screenshot-capture-agent

## 目标

真实尝试捕获 Android app 截图；如果不能证明设备、目标 app、目标 route 或截图文件，就明确 `capture_status=blocked`。这个 skill 是 `screenshot-storyboard` 的下游：优先消费 storyboard 生成的 handoff/shot-list，不设计 shot，不写营销文案，不把 storyboard、mockup、计划文案或任意设备屏幕当作 Play Store 截图证据。

核心原则：Parse, don’t validate。先把设备、adb、package、foreground app、shot plan、PNG 文件和 Google Play 规格解析成结构化 evidence，再根据证据判定 captured、partial 或 blocked。

## 使用方式

优先先运行 `screenshot-storyboard` 生成：

```text
play-store-launch/reports/screenshot-capture-handoff.json
play-store-launch/reports/screenshot-shot-list.json
```

然后运行 skill 同目录脚本：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root .
```

默认输出：

```text
play-store-launch/reports/screenshot-capture-agent.zh.md
play-store-launch/reports/screenshot-capture-agent-output.json
play-store-launch/reports/screenshot-capture-agent-evidence.jsonl
play-store-launch/reports/screenshot-capture-manifest.json
```

真实截图成功时，raw PNG 默认写到：

```text
play-store-launch/screenshots/raw/android/en-US/*.png
```

默认会读取 `play-store-launch/reports/screenshot-capture-handoff.json` 指向的 shot-list。推荐一次捕获一个 storyboard shot：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-id shot_01_home_feed
```

如果有人工准备好的 shot-list：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-list play-store-launch/reports/screenshot-shot-list.json --shot-id shot_01_home_feed
```

如果已经通过人工或自动化把设备导航到目标 shot 对应 route，可显式声明：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-id shot_01_home_feed --navigation-verified
```

如果人工已把模拟器停在目标 app 的目标页面，可显式允许捕获当前屏幕：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --serial emulator-5554 --allow-current-screen
```

如果要让脚本尝试启动已安装 app：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --serial emulator-5554 --package com.example.app --launch --allow-current-screen
```

校验输出：

```powershell
python .codex/skills/screenshot-capture-agent/scripts/validate.py --root . --report play-store-launch/reports/screenshot-capture-agent-output.json
```

## 判定规则

- `captured`：至少一张 raw PNG 真实来自 `adb exec-out screencap -p`，目标 package 前台证据存在，PNG 文件存在且基础解析通过，且没有硬阻塞。
- `partial`：真实捕获到 PNG，但 route 导航、Google Play 规格、debug container、foreground package 或人工确认项仍有阻塞。
- `blocked`：没有真实截图文件，或不能证明设备、adb、目标 app、shot plan、前台 app。
- `NEED_HUMAN`：公开上架使用、route 确认、裁切/安全区、商标/内容授权、是否代表真实 app 体验都必须人工确认。

Claim class：

- `C0`：扫描范围、设备和工具环境。
- `C1`：直接命令、文件或 PNG 证据。
- `C2`：由 adb/package/foreground/PNG 组合得到的确定性推断。
- `C3`：截图可公开使用解释，必须人工审核。
- `C4`：Google Play 规格、误导性、商标/内容风险，必须人工审核。
- `C5`：阻塞项，必须人工审核。

`C3`、`C4`、`C5` 必须 `human_review_required=true` 且 `review_status=NEED_HUMAN`。

## 捕获边界

- 不调用 Play Console。
- 不设计 storyboard；只消费 `screenshot-storyboard` 的 handoff/shot-list。
- 不修改 app 源码、生产配置、fixture、迁移文件或运行时数据。
- 不把 `adb devices` 在线写成截图成功。
- 不把 `adb screencap` 得到的系统桌面、启动器、错误页或 HBuilderX shell 误写成目标 route。
- 不把“shot-list 中有 route”写成“设备已经导航到该 route”；只有 `--navigation-verified` 或后续自动导航证据才能让 `route_verified=true`。
- 默认不允许一次把当前屏幕写成多个 shot；多 shot 必须使用 `--shot-id` 逐张捕获，或显式 `--navigation-verified`。
- 不把 PNG 规格通过写成可提交。Google Play 公开使用仍需人工审核。
- 不依赖其他 agent、Agno workflow 或 `play-store-launch` 下的共享 validator。`play-store-launch/reports` 和 `play-store-launch/screenshots` 只作为默认输出目录。

## 引用资料

- `references/google-play-screenshot-spec.zh.md`：Google Play 截图基础规格和人工审核口径。
- `references/evidence-rules.zh.md`：证据、claim、阻塞和报告规则。
- `references/boundary.md`：skill 自有边界和禁止事项。

## 输出要求

中文报告必须包含：

- 总状态和非最终声明。
- adb/device/package/foreground app 证据。
- shot plan 和每张截图尝试。
- raw PNG 路径、hash、尺寸、alpha、比例、空白检测。
- Google Play 基础规格检查。
- 阻塞项、人工审核项和解除方式。

机器报告必须包含：

- `schema_version`
- `generated_at`
- `capture_status`
- `root`
- `project_fingerprint`
- `tooling`
- `device_inventory`
- `target_app`
- `upstream_storyboard`
- `navigation`
- `shot_plan`
- `capture_attempts`
- `screenshots`
- `google_play_spec_checks`
- `claims`
- `evidence`
- `human_review_gates`
- `blockers`
- `limitations`
- `output_paths`

## 完成后的验证

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root .
python .codex/skills/screenshot-capture-agent/scripts/validate.py --root . --report play-store-launch/reports/screenshot-capture-agent-output.json
python C:/Users/Administrator/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/screenshot-capture-agent
git diff --check
git status --short
```
