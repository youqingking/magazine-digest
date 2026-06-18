# Data Safety 草稿

Agent: `google-data-safety-agent`
Agno Step: `06-google-data-safety-agent`
Skill: `.agents/skills/google-data-safety-agent/SKILL.md`
Skill Hash: `62a149f85363365cd0a4e27972417b0917f9ed85373cfab7914cc603caf3afe1`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
当前仅有证据显示 3 个 Data Safety 相关文件缺失；因此本步骤只能形成草稿状态说明，所有 Data Safety 判断均保持 unknown / needs_human，不能把未知项写成未收集数据。

## 人工补充项
- `google-data-safety-agent.fresh_run.fail_closed_status`：owner/Pro 按 Play Console 问题逐项确认 Data Safety、SDK、儿童家庭和广告追踪答案。

## Evidence Index
- `google-data-safety-agent.evidence.01` -> docs/launch/google-play/data-safety-draft.md (repo_file)
- `google-data-safety-agent.evidence.02` -> docs/launch/google-play/data-safety-evidence.md (repo_file)
- `google-data-safety-agent.evidence.03` -> docs/launch/google-play/data-safety-human-review-required.md (repo_file)
