# 截图分镜规划

Agent: `screenshot-storyboard`
Agno Step: `04-screenshot-storyboard`
Skill: `.agents/skills/screenshot-storyboard/SKILL.md`
Skill Hash: `da08aa967bfa2e4cff3c6a0e074dcb4f095f64e03ced27cbad43edc30f34f484`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
当前仅确认截图分镜、镜头清单与截图校验说明三个目标文件均缺失；因此本轮不能产出基于仓库证据的具体 route、scenario 或 value proposition，只能标记为待补充草稿输入。

## 人工补充项
- `screenshot-storyboard.fresh_run.fail_closed_status`：owner/Pro 审核分镜表达，dev 后续用真实设备或模拟器捕获截图。

## Evidence Index
- `screenshot-storyboard.evidence.01` -> docs/launch/screenshots/storyboard.md (repo_file)
- `screenshot-storyboard.evidence.02` -> docs/launch/screenshots/shot-list.json (repo_file)
- `screenshot-storyboard.evidence.03` -> docs/launch/screenshots/screenshot-validation-notes.md (repo_file)
