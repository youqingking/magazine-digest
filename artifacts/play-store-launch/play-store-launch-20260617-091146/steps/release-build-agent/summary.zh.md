# 发布构建检查

Agent: `release-build-agent`
Agno Step: `01-release-build-agent`
Skill: `.agents/skills/release-build-agent/SKILL.md`
Skill Hash: `4325f1cf16c29a2f5ab7332ee14b194b97834a5c2d76fc640037eb14da0a5a0a`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
本轮校验器退出码为 1，输出为 RELEASE_BUILD_AGENT_VALIDATION_FAILED；已确认多份上架准备所需文档缺失，因此当前只能解释为证据链不完整和工程闸门材料不足，不能据此进入商店提交流程。

## 人工补充项
- `release-build-agent.fresh_run.fail_closed_status`：owner/dev 提供 EAS project、签名策略、release build 和 dry-run 证据。

## Evidence Index
- `release-build-agent.evidence.01` -> python scripts/agent_tools/validate_release_build_agent.py . (command)
- `release-build-agent.evidence.02` -> docs/release/ANDROID_BUILD_READINESS.md (repo_file)
- `release-build-agent.evidence.03` -> docs/release/PLAY_STORE_RELEASE_GATE.md (repo_file)
