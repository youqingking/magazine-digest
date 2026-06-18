---
name: privacy-disclosure-prep
description: 从 app 项目的代码、SDK、权限、埋点、账号流程、隐私政策 URL、后端脱敏日志样本和儿童/敏感数据信号生成 Google Play Data safety 与隐私披露准备证据。Use when Codex needs privacy disclosure prep, SDK inventory, data inventory, tracking/sharing inference, account deletion checks, privacy policy URL checks, or children/sensitive-data risk review without claiming final legal compliance.
---

# privacy-disclosure-prep

## 目标

生成隐私披露准备材料，用于人工审核 Google Play Data safety。这个 skill 只证明“仓库和可选脱敏样本里观察到了什么、推断了什么、缺什么证据”，不填写 Play Console，不给法律结论，不声明 Data safety 正确、完整或可提交。

核心原则：Parse, don’t validate。先把项目事实解析为结构化 evidence、SDK、权限、数据流和 claim，再根据规则判定阻塞项；不要只检查文档关键词。

Google Play Data safety 对齐口径以官方说明为准：`https://support.google.com/googleplay/android-developer/answer/10787469?hl=en`。输出必须包含可映射到 Play Console 的填表草稿：是否收集或共享用户数据、传输是否加密、是否支持删除请求、隐私政策 URL、每个数据类型是否 collected/shared、是否 ephemeral、required/optional、用途、身份关联与 tracking 候选。凡是代码、SDK、权限或脱敏日志不能最终证明的答案，必须显式写 `review_status: NEED_HUMAN`。

## 使用方式

优先运行 skill 同目录扫描器：

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py --root .
```

默认输出：

```text
play-store-launch/reports/privacy-disclosure-prep.zh.md
play-store-launch/reports/privacy-disclosure-prep-output.json
play-store-launch/reports/privacy-disclosure-prep-evidence.jsonl
play-store-launch/reports/data-safety-form-draft.zh.md
play-store-launch/reports/data-safety-form-draft.json
play-store-launch/reports/data-safety-form-draft.csv
```

如需指定输出目录：

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py --root . --output-dir play-store-launch/reports
```

如有人提供已脱敏、可提交到仓库且未被 `.gitignore` 忽略的后端日志样本：

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py --root . --backend-log-sample docs/privacy/sanitized-backend-log.jsonl
```

如有人提供从 Google Play Console Data safety 页面下载的官方 sample/export CSV：

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py --root . --play-console-csv-template "path/to/official-data-safety-sample.csv"
```

这会额外生成：

```text
play-store-launch/reports/data-safety-form-draft.play-console-template.csv
```

该文件保持官方 CSV 的列和行结构，会清空 sample 里的示例答案，再写入当前 app 的候选 `Response value`。空白值表示需要人工确认；即使已填 `TRUE`，导入 Play Console 前也必须人工审核。

校验输出：

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/validate.py --root . --report play-store-launch/reports/privacy-disclosure-prep-output.json
```

## 检查范围

扫描器必须尽量解析：

- SDK：`package.json`、lockfile、Gradle、Podfile、Flutter `pubspec.yaml`、Expo config、源码 import/init。
- 用户数据：表单字段、auth/profile 字段、analytics event props、network payload、storage key、database/schema、日志字段。
- 身份关联：`userId`、email、phone、account/profile、device/session id 与事件、日志、请求或第三方 SDK 的绑定。
- 追踪：广告 SDK、归因 SDK、Advertising ID/IDFA、跨 app/device 标识、`identify`/`setUserId` 等信号。
- 第三方共享：analytics、crash、ads、payment、auth、subscription、database/backend SDK 和外部 API sink。
- 账号删除：账号创建/登录信号、删除账号 UI/route/API/SDK 调用、Data deletion URL。
- 隐私政策 URL：app config、listing source、README/docs、settings/about screen。
- 儿童/敏感数据：children/kids/family/teen/age 信号，以及位置、健康、金融、联系人、照片、音频等敏感数据。

## 判定规则

- `observed_in_repo`：直接从结构化文件、源码、权限、日志样本解析到。
- `inferred`：由多个证据组合推断，例如 SDK + 初始化 + event props。
- `not_observed`：扫描范围内未发现；不能写成“不存在”或“不收集”。
- `missing`：应存在的证据缺失，例如有账号体系但没有删除流程。
- `conflict`：文档、配置或代码证据互相矛盾。
- `needs_human`：需要 owner、legal 或 privacy 人工判断。
- `blocked`：证据不足，不能形成可用披露草稿。
- `not_applicable`：有证据证明当前项目不适用。

机器可读输出中保留 lowercase `status` 表示证据状态，同时用 uppercase `review_status` 表示人工确认状态。需要人工确认的字段必须写成 `NEED_HUMAN`，例如 app 自有隐私政策 URL、删除请求机制、传输加密、第三方共享、tracking、数据用途、是否必需、是否 ephemeral。

Claim class：

- `C0`：项目元信息和扫描范围。
- `C1`：直接仓库证据。
- `C2`：确定性推断。
- `C3`：隐私披露解释，必须人工审核。
- `C4`：追踪、第三方共享、广告、儿童或敏感风险，必须人工审核。
- `C5`：阻塞项，必须人工审核。

`C3`、`C4`、`C5` 必须 `human_review_required=true`。模型或人工总结不得覆盖脚本解析出的 deterministic facts。

## 安全边界

- 严格尊重 `.gitignore`，默认用 `git ls-files --cached --others --exclude-standard` 枚举文件。
- 不扫描 `node_modules`、build output、runtime artifacts、真实 `.env`、keystore、service account、未脱敏日志。
- 不调用 Google Play API，不提交 Play Console，不上传日志，不访问生产系统。
- 不修改 app 源码、生产配置、fixture、迁移文件或运行时生成物。
- 不读取 `prd.md` 作为 skill 运行输入；skill 只关注目标 app 项目的隐私证据。
- 不依赖其他 agent、Agno workflow 或 `play-store-launch` 下的共享 validator。`play-store-launch/reports` 只作为默认输出目录。

## 引用资料

- `references/data-safety-taxonomy.zh.md`：Google Play Data safety 数据类别、用途和人工审核口径。
- `references/sdk-signal-registry.json`：常见 SDK 的分类、数据类别和风险信号。
- `references/evidence-rules.zh.md`：证据强度、claim class、阻塞项和报告规则。

## 输出要求

中文报告必须包含：

- 总状态和非最终声明。
- 扫描范围、平台识别、文件数量和 `.gitignore` 策略。
- 8 个披露问题矩阵。
- SDK 清单、权限清单、数据流清单。
- 身份关联、追踪、第三方共享、账号删除、隐私政策 URL、儿童/敏感数据风险。
- Google Play Data safety 填表草稿：全局问题和逐数据类型明细，所有人工确认点以 `NEED_HUMAN` 标记。
- 阻塞项、人工审核项和解除方式。

独立 Data safety 产物必须包含：

- `data-safety-form-draft.zh.md`：逐项中文解释，面向人工审核和填表。
- `data-safety-form-draft.json`：按官方问题结构输出 `draft_answer`、`evidence_refs`、`confidence`、`review_status`、`human_review_items`。
- `data-safety-form-draft.csv`：近似 Play Console CSV 的草稿映射表；`response_value` 必须保持空白，直到人工用官方导出或 sample CSV 对齐并确认后再导入。
- `data-safety-form-draft.play-console-template.csv`：仅当提供官方 sample/export CSV 时生成；列和行结构来自官方模板，`Response value` 只写当前 app 的候选答案。

机器报告必须包含：

- `schema_version`
- `generated_at`
- `scan_policy`
- `project_fingerprint`
- `overall_status`
- `detected_platforms`
- `sdk_inventory`
- `permission_inventory`
- `data_flows`
- `data_safety_form_draft`
- `privacy_policy`
- `account_deletion`
- `children_sensitive_risks`
- `claims`
- `evidence`
- `human_review_gates`
- `blockers`
- `limitations`
- `output_paths.data_safety_markdown`
- `output_paths.data_safety_json`
- `output_paths.data_safety_csv`

## 完成后的验证

```powershell
python .codex/skills/privacy-disclosure-prep/scripts/privacy_scan.py --root .
python .codex/skills/privacy-disclosure-prep/scripts/validate.py --root . --report play-store-launch/reports/privacy-disclosure-prep-output.json
python C:/Users/Administrator/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/privacy-disclosure-prep
git diff --check
git status --short
```
