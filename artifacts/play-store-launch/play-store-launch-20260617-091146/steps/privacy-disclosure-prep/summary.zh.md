# 隐私披露准备

Agent: `privacy-disclosure-prep`
Agno Step: `02-privacy-disclosure-prep`
Skill: `.agents/skills/privacy-disclosure-prep/SKILL.md`
Skill Hash: `6239bf8c3c096a7fa0142d16d4f59b8a30328c2195ba058e41142145f68450e2`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
隐私披露准备阶段当前只能确认三项关键隐私材料均缺失，因此本轮不能形成可用于上架表单填写的披露结论。输出仅为草稿风险归纳与人工补充清单，不构成法律或隐私合规结论。

## 人工补充项
- `privacy-disclosure-prep.fresh_run.fail_closed_status`：owner/Pro 提供并审核隐私政策 URL、开发者联系人和适用法律披露。

## Evidence Index
- `privacy-disclosure-prep.evidence.01` -> docs/privacy/DATA_INVENTORY.md (repo_file)
- `privacy-disclosure-prep.evidence.02` -> docs/privacy/SDK_INVENTORY.md (repo_file)
- `privacy-disclosure-prep.evidence.03` -> docs/launch/privacy/privacy-disclosure-draft.md (repo_file)
