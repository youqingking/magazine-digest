# 上架信息收集

Agent: `launch-info-collector`
Agno Step: `05-launch-info-collector`
Skill: `.agents/skills/launch-info-collector/SKILL.md`
Skill Hash: `f9bb4a7884cdb01ec8fc784e2ea798939f4653bbc8e768cc5b0d5e10ee9f7b35`
状态: RED
执行: fresh_ai_agent_run
模型调用: enabled=true

## 运行说明
本步骤必须在当前 run_id 下重新收集 evidence、重新构建 prompt，并强制调用模型。如果模型不可用，本步骤保持 blocked_model_unavailable，不能回退到 deterministic-only，也不能读取旧 artifact 充当输出。AI 输出只能解释当前 evidence，不得覆盖 deterministic facts，不得把 missing、unknown 或 needs_human 改写为 ready。

## AI 输出摘要
本步骤仅从本轮证据抽取到候选应用名称为 magazine-digest；描述、支持联系方式、隐私政策、分类等上架字段均未在可用证据中确认，需人工补充。

## 人工补充项
- `launch-info-collector.fresh_run.fail_closed_status`：owner 补齐 Play Console app/account、公开字段和开发者联系信息。

## Evidence Index
- `launch-info-collector.evidence.01` -> package.json (repo_file)
- `launch-info-collector.evidence.02` -> apps/mobile/README.md (repo_file)
- `launch-info-collector.evidence.03` -> docs/launch/LAUNCH_INFO.md (repo_file)
- `launch-info-collector.evidence.04` -> docs/launch/store-fields/source-of-truth.json (repo_file)
