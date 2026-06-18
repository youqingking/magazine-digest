# 商店文案草稿

Agent: `google-play-listing`
Agno Step: `03-google-play-listing`
Skill: `.agents/skills/google-play-listing/SKILL.md`
Skill Hash: `73cda927dba4e9fd91c57df780d44f02e54dd5284a4ab3920ee73d3670a38f55`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
当前仅确认既有上架文案文件与校验报告均缺失，因此只能给出无功能声称的占位草稿：标题草稿为“杂志摘要”；短描述草稿为“阅读与整理杂志内容摘要。”；完整描述草稿为“杂志摘要用于呈现杂志内容摘要，帮助用户查看整理后的阅读内容。实际功能、数据来源、目标地区、隐私说明与合规表述仍需人工基于当前应用证据补充和审核。本内容仍为草稿，不能提交。”

## 人工补充项
- `google-play-listing.fresh_run.fail_closed_status`：owner/Pro 审核文案、类别、内容评级、目标受众、授权和商标风险。

## Evidence Index
- `google-play-listing.evidence.01` -> docs/launch/google-play/listing.en-US.json (repo_file)
- `google-play-listing.evidence.02` -> docs/launch/google-play/listing.zh-CN.json (repo_file)
- `google-play-listing.evidence.03` -> docs/launch/google-play/listing-validation-report.md (repo_file)
