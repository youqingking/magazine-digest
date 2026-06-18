# privacy-disclosure-prep 隐私披露准备报告

生成时间：`2026-06-18T10:14:22Z`

## 总状态

- overall_status: `blocked`
- 发现平台：`expo`, `react_native`, `backend_or_api`
- 非最终声明：本报告不是法律意见，不是 Play Console 最终答案，不证明 Data safety 已正确、完整或可提交。
- 官方口径来源：Google Play Data safety 表单说明 `https://support.google.com/googleplay/android-developer/answer/10787469?hl=en`
- NEED_HUMAN 规则：凡是代码不能证明的 Play Console 答案、app 自有隐私政策 URL、删除请求机制、共享/追踪/用途/是否必需，均标记为 `NEED_HUMAN`。

## 扫描范围

- root: `C:\Users\Administrator\.codex\worktrees\66ef\magazine-digest`
- git_commit: `b1d7c7ff5ae38633ee454e11bd323c6c012510f5`
- file_discovery_mode: `git_ls_files_exclude_standard`
- ignored_paths_respected: `True`
- scanned/skipped/raw: `2271` / `493` / `2764`

## 披露问题矩阵

| 问题 | 证据状态 | 人工确认 | 摘要 |
| --- | --- | --- | --- |
| 使用了哪些 SDK | `observed_in_repo` | `NEED_HUMAN` | 发现 2 个 SDK/依赖候选。 |
| 收集哪些用户数据 | `observed_in_repo` | `NEED_HUMAN` | 发现 163 条数据流信号、0 条权限信号。 |
| 是否关联身份 | `inferred` | `NEED_HUMAN` | 身份关联候选 49 条。 |
| 是否用于追踪 | `needs_human` | `NEED_HUMAN` | 追踪候选 12 条。 |
| 是否与第三方共享 | `needs_human` | `NEED_HUMAN` | 第三方 SDK/共享候选 2 个。 |
| 是否有账号删除流程 | `observed_in_repo` | `NEED_HUMAN` | account_and_deletion_signal_observed_needs_human_review |
| 是否有隐私政策 URL | `blocked` | `NEED_HUMAN` | url_missing_or_only_third_party_placeholder_observed |
| 是否有儿童/敏感数据风险 | `needs_human` | `NEED_HUMAN` | 风险信号 27 条。 |

## Google Play Data safety 填表草稿

该部分按 Google Play Data safety 官方问题组织，只能作为人工填表依据。

### 全局问题

| Play Console 字段 | 草稿答案 | 人工确认 | 说明 |
| --- | --- | --- | --- |
| `does_app_collect_or_share_user_data` | `YES_CANDIDATE` | `NEED_HUMAN` |  |
| `is_all_user_data_collected_encrypted_in_transit` | `NEED_HUMAN` | `NEED_HUMAN` | 静态扫描不能证明所有传输路径均使用加密，也不能证明第三方 SDK 传输行为。 |
| `can_users_request_data_deletion` | `YES_CANDIDATE` | `NEED_HUMAN` | Play Console 需要确认删除请求机制；如果 app 支持账号创建，还需要确认账号和关联数据删除路径。 |
| `privacy_policy_url` | `NEED_HUMAN` | `NEED_HUMAN` | 必须由人工确认这是 app 自有、公开可访问且覆盖当前数据行为的隐私政策 URL。 |
| `third_party_sdk_or_external_sharing` | `YES_CANDIDATE` | `NEED_HUMAN` |  |
| `tracking` | `YES_CANDIDATE` | `NEED_HUMAN` |  |
| `children_or_sensitive_data_risk` | `YES_CANDIDATE` | `NEED_HUMAN` |  |

### 数据类型明细

| 数据类别 | Google Play 数据类型 | Collected | Shared | Ephemeral | Required/Optional | 用途候选 | 人工确认 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| App activity | App interactions | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Analytics | `NEED_HUMAN` |
| App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | Analytics, App functionality | `NEED_HUMAN` |
| Calendar | Calendar events | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Contacts | Contacts | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Advertising or marketing, Fraud prevention, security, and compliance | `NEED_HUMAN` |
| Files and docs | Files and docs | `YES_CANDIDATE` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Financial info | Purchase history | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Location | Approximate or precise location | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Messages | Other in-app messages | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Personal info | Address | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `NEED_HUMAN` |
| Personal info | Email address | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `NEED_HUMAN` |
| Personal info | Name | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `NEED_HUMAN` |
| Personal info | Phone number | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `NEED_HUMAN` |
| Personal info | User IDs | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `NEED_HUMAN` |
| Photos and videos | Photos or videos | `YES_CANDIDATE` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |
| Web browsing | Web browsing history | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` |

## SDK 清单

| SDK/依赖 | 分类 | 使用状态 | 第三方 | 来源 |
| --- | --- | --- | --- | --- |
| `expo` | `app_framework` | `imported` | Expo | `package.json` |
| `expo-dev-client` | `app_framework` | `declared_only` | Expo | `package.json` |

## 权限清单

| 权限 | 数据类别 | 数据类型 | 来源 |
| --- | --- | --- | --- |
| 无 | 无 | 无 | 无 |

## 数据流候选

| 数据类别 | 数据类型 | Sink | 关联身份 | 追踪 | 第三方共享 | 来源 |
| --- | --- | --- | --- | --- | --- | --- |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:37` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:42` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:50` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:68` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:118` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:119` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:123` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:127` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:128` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:136` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:149` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:150` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:154` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:157` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:158` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:169` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:173` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/index.obj.js:191` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/device-sync-co/package.json:2` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:35` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:36` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:40` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:41` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:43` |
| Personal info | Email address | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:44` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:45` |
| Personal info | Email address | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:46` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:51` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:52` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:53` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:66` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:151` |
| Personal info | Name | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:152` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:164` |
| Device or other IDs | Device or other ID | `code_reference` | `candidate_or_unknown` | `candidate_inferred` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:166` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:199` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:207` |
| Personal info | User ID | `code_reference` | `yes_observed` | `not_observed` | `not_observed` | `mobile/uniCloud-tcb/cloudfunctions/h0_5-web-auth-smoke/index.js:213` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/adapters/fixture-repository.mjs:657` |
| Financial info | Payment or purchase info | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/contracts/surfaces.mjs:153` |
| Financial info | Payment or purchase info | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/contracts/surfaces.mjs:158` |
| Financial info | Payment or purchase info | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/contracts/surfaces.mjs:163` |
| App activity | Analytics event | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/index.mjs:71` |
| App activity | Analytics event | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/surfaces/event-ingest.mjs:10` |
| App activity | Analytics event | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `backend/surfaces/event-ingest.mjs:18` |
| Photos and videos | Photos or videos | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/.idea/caches/deviceStreaming.xml:944` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/api/local-runtime-api.js:555` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/api/remote-runtime-api.js:96` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/api/remote-runtime-api.js:101` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/api/remote-runtime-api.js:107` |
| Messages | Messages | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/api/remote-runtime-api.js:112` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4130` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4179` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4228` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4249` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4277` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4298` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4326` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4347` |
| Location | Location | `code_reference` | `candidate_or_unknown` | `not_observed` | `not_observed` | `mobile/fixtures/runtime/current/content-detail.json:4375` |

## 隐私政策 URL

状态：`blocked` / `url_missing_or_only_third_party_placeholder_observed` / `NEED_HUMAN`

- 未发现隐私政策 URL。

## 账号删除流程

状态：`observed_in_repo` / `account_and_deletion_signal_observed_needs_human_review` / `NEED_HUMAN`

- `https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#unbind-third-account` 来源 `mobile/uni_modules/uni-id-pages/changelog.md`
- `https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#close-account` 来源 `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/index.obj.js`
- `https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-account-info` 来源 `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/index.obj.js`
- `https://account.cloud.huawei.com` 来源 `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/lib/third-party/huawei/account/index.js`
- `https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#close-account` 来源 `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/module/account/close-account.js`
- `https://uniapp.dcloud.net.cn/uniCloud/uni-id-pages.html#get-account-info` 来源 `mobile/uni_modules/uni-id-pages/uniCloud/cloudfunctions/uni-id-co/module/account/get-account-info.js`

## 儿童和敏感数据风险

- `children_risk.0001` / `children_or_age_signal` / `needs_human` / evidence=evidence.0407
- `children_risk.0002` / `children_or_age_signal` / `needs_human` / evidence=evidence.0408
- `children_risk.0003` / `children_or_age_signal` / `needs_human` / evidence=evidence.0409
- `children_risk.0004` / `children_or_age_signal` / `needs_human` / evidence=evidence.0410
- `children_risk.0005` / `children_or_age_signal` / `needs_human` / evidence=evidence.0411
- `children_risk.0006` / `children_or_age_signal` / `needs_human` / evidence=evidence.0412
- `children_risk.0007` / `children_or_age_signal` / `needs_human` / evidence=evidence.0413
- `children_risk.0008` / `children_or_age_signal` / `needs_human` / evidence=evidence.0414
- `children_risk.0009` / `children_or_age_signal` / `needs_human` / evidence=evidence.0415
- `children_risk.0010` / `children_or_age_signal` / `needs_human` / evidence=evidence.0416
- `children_risk.0011` / `children_or_age_signal` / `needs_human` / evidence=evidence.0417
- `children_risk.0012` / `children_or_age_signal` / `needs_human` / evidence=evidence.0418
- `children_risk.0013` / `children_or_age_signal` / `needs_human` / evidence=evidence.0419
- `children_risk.0014` / `children_or_age_signal` / `needs_human` / evidence=evidence.0420
- `children_risk.0015` / `children_or_age_signal` / `needs_human` / evidence=evidence.0421
- `children_risk.0016` / `children_or_age_signal` / `needs_human` / evidence=evidence.0422
- `children_risk.0017` / `children_or_age_signal` / `needs_human` / evidence=evidence.0423
- `children_risk.0018` / `children_or_age_signal` / `needs_human` / evidence=evidence.0424
- `children_risk.0019` / `children_or_age_signal` / `needs_human` / evidence=evidence.0425
- `children_risk.0020` / `children_or_age_signal` / `needs_human` / evidence=evidence.0426
- `sensitive_data.calendar` / `sensitive_data_category` / `needs_human` / evidence=evidence.0127,evidence.0128,evidence.0144,evidence.0145
- `sensitive_data.contacts` / `sensitive_data_category` / `needs_human` / evidence=evidence.0111,evidence.0112,evidence.0115,evidence.0116,evidence.0117
- `sensitive_data.financial_info` / `sensitive_data_category` / `needs_human` / evidence=evidence.0049,evidence.0050,evidence.0051,evidence.0083,evidence.0084
- `sensitive_data.health_and_fitness` / `sensitive_data_category` / `needs_human` / evidence=evidence.0136,evidence.0137,evidence.0152,evidence.0153,evidence.0172
- `sensitive_data.location` / `sensitive_data_category` / `needs_human` / evidence=evidence.0061,evidence.0062,evidence.0063,evidence.0064,evidence.0065
- `sensitive_data.messages` / `sensitive_data_category` / `needs_human` / evidence=evidence.0048,evidence.0056,evidence.0057,evidence.0058,evidence.0059
- `sensitive_data.photos_and_videos` / `sensitive_data_category` / `needs_human` / evidence=evidence.0055,evidence.0113,evidence.0129,evidence.0130,evidence.0138

## 阻塞项

- `privacy_policy_url_missing`：未在扫描范围内发现隐私政策 URL。 解除方式：提供公开可访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享和删除流程。

## 人工审核项

- human_review_gates: `7`
- 人工确认标记值：`NEED_HUMAN`
- 所有 C3/C4/C5 claim 必须由 owner/legal/privacy 人工确认，不能直接用于 Play Console 提交。

## 证据索引

- evidence_count: `426`
- evidence_jsonl: `C:/Users/Administrator/.codex/worktrees/66ef/magazine-digest/play-store-launch/reports/privacy-disclosure-prep-evidence.jsonl`
- machine_json: `C:/Users/Administrator/.codex/worktrees/66ef/magazine-digest/play-store-launch/reports/privacy-disclosure-prep-output.json`
- data_safety_markdown: `C:/Users/Administrator/.codex/worktrees/66ef/magazine-digest/play-store-launch/reports/data-safety-form-draft.zh.md`
- data_safety_json: `C:/Users/Administrator/.codex/worktrees/66ef/magazine-digest/play-store-launch/reports/data-safety-form-draft.json`
- data_safety_csv: `C:/Users/Administrator/.codex/worktrees/66ef/magazine-digest/play-store-launch/reports/data-safety-form-draft.csv`
- data_safety_play_console_template_csv: `未提供官方 CSV 模板，未生成`
