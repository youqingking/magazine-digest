# 真实截图捕获

Agent: `screenshot-capture-agent`
Agno Step: `07-screenshot-capture-agent`
Skill: `.agents/skills/screenshot-capture-agent/SKILL.md`
Skill Hash: `7e41b67898a7cc8cef8c982dfc1d9515a110074a5935fee2cf810b34da5809cf`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
当前截图采集未完成：本轮证据显示无法确认 Android 设备可用性，且截图采集报告与阻塞项文档均缺失。因此不能生成、补写或伪造 Play 商店截图材料。

## 人工补充项
- `screenshot-capture-agent.fresh_run.fail_closed_status`：dev 连接 Android 设备或模拟器，生成带 route、device、locale、commit 的真实截图证据。

## Evidence Index
- `screenshot-capture-agent.evidence.01` -> adb devices (command)
- `screenshot-capture-agent.evidence.02` -> docs/launch/screenshots/capture-report.md (repo_file)
- `screenshot-capture-agent.evidence.03` -> docs/launch/screenshots/capture-blockers.md (repo_file)
