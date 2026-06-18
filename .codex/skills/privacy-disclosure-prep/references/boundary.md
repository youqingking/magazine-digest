# privacy-disclosure-prep 边界

这个 skill 只负责隐私披露准备证据，不负责 Play Console 提交、法律结论或其他 agent 协作。

## Skill 自有内容

- `.codex/skills/privacy-disclosure-prep/SKILL.md`
- `.codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py`
- `.codex/skills/privacy-disclosure-prep/scripts/validate.py`
- `.codex/skills/privacy-disclosure-prep/references/**`
- `.codex/skills/privacy-disclosure-prep/agents/openai.yaml`

## 运行输出

默认输出写入调用项目：

- `play-store-launch/reports/privacy-disclosure-prep.zh.md`
- `play-store-launch/reports/privacy-disclosure-prep-output.json`
- `play-store-launch/reports/privacy-disclosure-prep-evidence.jsonl`

`play-store-launch/reports` 只是报告目录，不是运行依赖。

## 禁止事项

- 不导入或委托 `play-store-launch/validators/**`、`play-store-launch/shared/**` 或其他 agent 代码。
- 不读取真实 `.env`、keystore、service account、未脱敏日志。
- 不扫描 `.gitignore` 已忽略路径。
- 不把 `not_observed` 渲染成“没有收集”。
- 不输出 `ready to submit`、`final compliance`、`approved` 等最终合规措辞。

