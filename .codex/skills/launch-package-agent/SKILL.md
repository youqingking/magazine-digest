---
name: launch-package-agent
description: 汇总并打包 Google Play 上架准备材料。Use when Codex needs a Chinese-first, human-readable launch package from existing release, privacy, Data safety, listing, screenshot, and launch-info agent reports under play-store-launch/reports, with blockers and human actions preserved without submitting to Play Console.
---

# launch-package-agent

## 目标

把已经生成的 Google Play 上架准备材料打成一个总包。报告必须中文为主、面向人类阅读，回答：

- 当前有哪些材料可以复核。
- 哪些材料缺失、阻塞或只是草稿。
- 为什么现在不能提交 Google Play。
- 需要人类补充什么信息，或需要工程继续修什么问题。

本 skill 只聚合与解释上游报告，不重新证明 build/typecheck/smoke/preflight，不重新填写 Data safety，不捕获截图，不提交 Play Console，不读取或使用真实凭据。

## 输入

默认从 `play-store-launch/reports` 读取这些上游机器输出：

- `release-build-agent-output.json`
- `privacy-disclosure-prep-output.json`
- `launch-info-collector-output.json`
- `google-data-safety-agent-output.json`
- `google-play-listing-output.json`
- `screenshot-storyboard-output.json`
- `screenshot-capture-agent-output.json`

如果某个文件不存在，要在总包里标为 `missing`，并说明缺失会阻塞最终上架包。

## 输出

写入 `play-store-launch/reports`：

- `launch-package-agent.zh.md`：给 owner/人工复核者看的中文总包报告。
- `launch-package-agent-output.json`：机器可读的总状态、材料矩阵、阻塞项和人类待办。
- `launch-package-manifest.json`：纳入总包的文件清单、来源 agent、是否存在。
- `launch-package-need-human.md`：合并后的人工处理清单。
- `launch-package-files-included.txt`：已纳入文件路径列表。

## 执行方式

优先运行 skill-local 脚本：

```powershell
python .codex/skills/launch-package-agent/scripts/validate.py .
```

需要自定义输出目录时：

```powershell
python .codex/skills/launch-package-agent/scripts/validate.py . --output-dir play-store-launch/reports
```

## 报告规则

- 报告主题只能围绕 Google Play 上架材料包，不加入版本控制状态、代码差异、运行流水线日志、项目摘要或实现细节。
- 不把草稿写成最终材料；不把 `blocked`、`needs_human`、`missing` 写成通过。
- 任一关键上游报告缺失、解析失败或存在阻塞时，`can_submit_google_play` 必须是 `false`。
- release build 或真实截图捕获没有通过时，总结论必须明确“当前不能提交 Google Play”。
- 每个阻塞项都要尽量保留上游的 `reason` 和 `unblock_action`，不要改写成空泛确认项。
- 输出路径、脚本和辅助信息都保留在本 skill 目录或 `play-store-launch/reports` 下。

## 判断口径

- `GREEN`：所有必需材料存在，状态通过，没有 blockers / needs_human / missing。
- `YELLOW`：材料基本存在，但仍有人类确认、草稿或非致命待办，不能直接视为提交完成。
- `RED`：缺少必需材料，或存在 build、listing、privacy/Data safety、截图捕获等阻塞。
