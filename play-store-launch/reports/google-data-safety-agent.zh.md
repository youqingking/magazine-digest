# google-data-safety-agent Data safety 准备报告

生成时间：`2026-06-18T10:15:44Z`

## 总状态
- overall_status: `blocked`
- proof_mode: `parsed_repo_evidence`
- 输出目录：`play-store-launch/reports`

## 全局问题草稿
| 字段 | 草稿答案 | 人工确认 | 原因/动作 |
| --- | --- | --- | --- |
| `does_app_collect_or_share_user_data` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现用户数据或 SDK 信号。 |
| `is_all_user_data_collected_encrypted_in_transit` | `NEED_HUMAN` | `NEED_HUMAN` | 静态项目证据不能证明所有传输路径和第三方 SDK 均加密传输。 |
| `can_users_request_data_deletion` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现账号删除/注销候选。 |
| `privacy_policy_url` | `NEED_HUMAN` | `NEED_HUMAN` | 未发现可用于 Data safety 的隐私政策 URL。 |
| `third_party_sdk_or_external_sharing` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现第三方 SDK/服务候选。 |
| `tracking` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现 ads、analytics 或 device id 相关 tracking 候选。 |
| `children_or_sensitive_data_risk` | `NEED_HUMAN` | `NEED_HUMAN` | 未发现足够证据确认是否面向儿童或处理敏感数据。 |
| `account_system` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现相关实现或数据结构信号。 |
| `payment_provider` | `YES_CANDIDATE` | `NEED_HUMAN` | 发现相关实现或数据结构信号。 |
| `crash_reporting` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | 未发现相关证据。 |
| `ad_sdk` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | 未发现相关证据。 |

## 逐数据类型草稿
| 数据类别 | 数据类型 | Collected | Shared | 用途候选 | 身份关联 | Tracking | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Personal info | User IDs | `YES_CANDIDATE` | `NEED_HUMAN` | Account management, App functionality | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | ev_0012 |
| Personal info | Name | `YES_CANDIDATE` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | ev_0013 |
| Personal info | Email address | `YES_CANDIDATE` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | ev_0014 |
| Personal info | Phone number | `YES_CANDIDATE` | `NEED_HUMAN` | Account management, Fraud prevention, security, and compliance | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | ev_0015 |
| Financial info | Purchase history | `YES_CANDIDATE` | `NEED_HUMAN` | App functionality, Payments | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | ev_0016 |
| Photos and videos | Photos or videos | `YES_CANDIDATE` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | ev_0017 |
| Files and docs | Files and docs | `YES_CANDIDATE` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | ev_0018 |
| App activity | App interactions | `YES_CANDIDATE` | `NEED_HUMAN` | Analytics, App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | ev_0019 |
| App info and performance | Diagnostics | `YES_CANDIDATE` | `NEED_HUMAN` | Analytics, App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | ev_0020 |
| Device or other IDs | Device or other IDs | `YES_CANDIDATE` | `NEED_HUMAN` | App functionality, Fraud prevention, security, and compliance | `NEED_HUMAN` | `YES_CANDIDATE` | ev_0021 |
| Messages | Other in-app messages | `YES_CANDIDATE` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | ev_0022 |

## 证据来源摘要
| 证据主题 | 状态 | 数量/说明 | 证据 |
| --- | --- | --- | --- |
| app_permissions | `missing` | 0 | - |
| sdk_list | `observed` | 2 | ev_0005, ev_0006 |
| analytics_events | `inferred` | 发现相关实现或数据结构信号。 | ev_0007 |
| backend_api_logs | `inferred` | 发现相关实现或数据结构信号。 | ev_0008 |
| account_system | `inferred` | 发现相关实现或数据结构信号。 | ev_0009 |
| account_deletion | `inferred` | 发现相关实现或数据结构信号。 | ev_0010 |
| payment_provider | `inferred` | 发现相关实现或数据结构信号。 | ev_0011 |
| crash_reporting | `missing` | 未发现相关证据。 | - |
| ad_sdk | `missing` | 未发现相关证据。 | - |
| children_sensitive | `missing` | 未发现相关证据。 | - |
| privacy_policy_url | `NEED_HUMAN` | 未发现可用于 Data safety 的隐私政策 URL。 | - |
| owner_input | `observed` |  | ev_0001, ev_0002 |
| source_reports | `observed` | 2 | ev_0003, ev_0004 |

## 证据样本
- `ev_0001` `owner_data_safety_input` from `play-store-launch/inputs/privacy-data-safety-owner-input.json`：{"schema_version": "privacy_data_safety_owner_input.v1", "status": "draft_owner_review_required", "keys": ["canUseAsFinalPlayConsoleAnswer", "canUsersRequestDataDeletion", "childrenOrSensitiveDataRisk", "dataTypes", "encryptedInTransit", "ownerReviewRequired", "privacyPolicyUrl", "schema_version", "status"]}
- `ev_0002` `owner_data_safety_input` from `play-store-launch/inputs/google-play-listing.json`：{"schema_version": "google_play_listing_input.v1", "status": "draft_owner_review_required", "keys": ["appName", "canUseForSubmission", "category", "contactEmail", "contentRating", "draftOnly", "fullDescription", "locale", "ownerReviewRequired", "privacyPolicyUrl", "schema_version", "shortDescription", "status", "targetAudience"]}
- `ev_0003` `source_report` from `play-store-launch/reports/privacy-disclosure-prep-output.json`：{"schema_version": "privacy_disclosure_prep.v1", "overall_status": "blocked", "top_keys": ["schema_version", "generated_at", "root", "scan_policy", "project_fingerprint", "overall_status", "detected_platforms", "disclosure_question_matrix", "sdk_inventory", "permission_inventory", "data_flows", "data_safety_form_draft"]}
- `ev_0004` `source_report` from `play-store-launch/reports/launch-info-collector-output.json`：{"schema_version": "launch_info_collector_output.v1", "overall_status": "blocked", "top_keys": ["schema_version", "generated_at", "proof_mode", "overall_status", "output_dir", "scanned_file_count", "document_source_count", "document_sources", "fields", "blockers", "evidence", "source_of_truth"]}
- `ev_0005` `sdk_list` from `mobile/uni_modules/uni-id-common`：{"sdk_type": "auth", "dependencies": [], "paths": ["mobile/uni_modules/uni-id-common", "mobile/uni_modules/uni-id-pages"]}
- `ev_0006` `sdk_list` from `mobile/uni_modules/uni-cloud-s2s`：{"sdk_type": "cloud_backend", "dependencies": [], "paths": ["mobile/uni_modules/uni-cloud-s2s"]}
- `ev_0007` `analytics_events` from `backend/surfaces/bootstrap-config.mjs`：[{"source": "backend/surfaces/bootstrap-config.mjs", "where": "content", "matched": "experiment", "excerpt": "s: product?.active_status ?? \"inactive\" }, feature_flags: [], experiments: repository.listExperiments(productKey).map((item) => ({ experiment_id"}, {"source": "backend/surfaces/experiment-assign.mjs", "where": "path", "matched": "experiment"}, {...
- `ev_0008` `backend_api_logs` from `backend/surfaces/auth-refresh.mjs`：[{"source": "backend/surfaces/auth-refresh.mjs", "where": "path", "matched": "backend[\\\\/]"}, {"source": "backend/surfaces/auth-session.mjs", "where": "path", "matched": "backend[\\\\/]"}, {"source": "backend/surfaces/auth-signout.mjs", "where": "path", "matched": "backend[\\\\/]"}, {"source": "backend/surfaces/bootstrap-config.mjs", "where": "path", "m...
- `ev_0009` `account_system` from `backend/surfaces/auth-refresh.mjs`：[{"source": "backend/surfaces/auth-refresh.mjs", "where": "path", "matched": "\\bauth\\b"}, {"source": "backend/surfaces/auth-session.mjs", "where": "path", "matched": "\\bauth\\b"}, {"source": "backend/surfaces/auth-signout.mjs", "where": "path", "matched": "\\bauth\\b"}, {"source": "backend/surfaces/profile-benefits.mjs", "where": "path", "matched": "pr...
- `ev_0010` `account_deletion` from `mobile/pages.json`：[{"source": "mobile/pages.json", "where": "content", "matched": "deactivate", "excerpt": "leText\": \"设置密码\" } } ,{ \"path\": \"uni_modules/uni-id-pages/pages/userinfo/deactivate/deactivate\", \"style\": { \"navigationBarTitleText\": \"注销账号\" } } ,{"}]
- `ev_0011` `payment_provider` from `backend/surfaces/entitlement-snapshot.mjs`：[{"source": "backend/surfaces/entitlement-snapshot.mjs", "where": "path", "matched": "entitlement"}, {"source": "backend/surfaces/pricing-preview.mjs", "where": "path", "matched": "pricing"}, {"source": "backend/surfaces/promo-preview.mjs", "where": "content", "matched": "pricing", "excerpt": ".promo_code); return repository.previewPromo(productKey, promo...
- `ev_0012` `data_type` from `backend/surfaces/auth-session.mjs`：{"category": "Personal info", "data_type": "User IDs", "hits": [{"source": "backend/surfaces/auth-session.mjs", "where": "content", "matched": "user[_-]?id", "excerpt": "source) { const now = runtimeConfig.now || new Date().toISOString(); const userId = request.user_id || \"user_local_stage_e0\"; return { session_state: adap"}, {"source": "backend/surface...
- `ev_0013` `data_type` from `mobile/pages.json`：{"category": "Personal info", "data_type": "Name", "hits": [{"source": "mobile/pages.json", "where": "content", "matched": "realname", "excerpt": "leText\": \"注销账号\" } } ,{ \"path\": \"uni_modules/uni-id-pages/pages/userinfo/realname-verify/realname-verify\", \"style\": { \"enablePullDownRefresh\": false,"}, {"source": "mobile/pages/auth-test/index.vue",...
- `ev_0014` `data_type` from `mobile/pages.json`：{"category": "Personal info", "data_type": "Email address", "hits": [{"source": "mobile/pages.json", "where": "content", "matched": "\\bemail\\b", "excerpt": "\"\" } } ,{ \"path\": \"uni_modules/uni-id-pages/pages/register/register-by-email\", \"style\": { \"navigationBarTitleText\": \"邮箱验证码注册\" } } ,{ \"pa"}, {"source": "mobile/services/auth.service.js",...
- `ev_0015` `data_type` from `database/user_profiles.schema.json`：{"category": "Personal info", "data_type": "Phone number", "hits": [{"source": "database/user_profiles.schema.json", "where": "content", "matched": "phone", "excerpt": "8\", \"scope\": \"global\", \"write_model\": \"master_data\", \"required\": [\"_id\", \"phone\", \"auth_state\", \"consent_accepted\", \"created_at\", \"updated_at\"], \"properties\""}, {"...
- `ev_0016` `data_type` from `backend/surfaces/entitlement-snapshot.mjs`：{"category": "Financial info", "data_type": "Purchase history", "hits": [{"source": "backend/surfaces/entitlement-snapshot.mjs", "where": "path", "matched": "entitlement"}, {"source": "backend/surfaces/pricing-preview.mjs", "where": "path", "matched": "pricing"}, {"source": "backend/surfaces/promo-preview.mjs", "where": "content", "matched": "pricing", "e...
- `ev_0017` `data_type` from `mobile/pages.json`：{"category": "Photos and videos", "data_type": "Photos or videos", "hits": [{"source": "mobile/pages.json", "where": "content", "matched": "cropimage", "excerpt": "Text\": \"绑定手机号码\" } } ,{ \"path\": \"uni_modules/uni-id-pages/pages/userinfo/cropImage/cropImage\", \"style\": { \"navigationBarTitleText\": \"\" } } ,{"}]}
- `ev_0018` `data_type` from `mobile/pages/feed/index.vue`：{"category": "Files and docs", "data_type": "Files and docs", "hits": [{"source": "mobile/pages/feed/index.vue", "where": "content", "matched": "\\bpdf\\b", "excerpt": "ems=\"heroMeta\" /> </AppCard> </view> <AppCard class=\"pdf-import-card\" tone=\"muted\"> <view class=\"pdf-import-content\">"}]}
- `ev_0019` `data_type` from `backend/surfaces/bootstrap-config.mjs`：{"category": "App activity", "data_type": "App interactions", "hits": [{"source": "backend/surfaces/bootstrap-config.mjs", "where": "content", "matched": "experiment", "excerpt": "s: product?.active_status ?? \"inactive\" }, feature_flags: [], experiments: repository.listExperiments(productKey).map((item) => ({ experiment_id"}, {"source": "backend/surface...
- `ev_0020` `data_type` from `database/audit_logs.schema.json`：{"category": "App info and performance", "data_type": "Diagnostics", "hits": [{"source": "database/audit_logs.schema.json", "where": "path", "matched": "audit_logs?"}, {"source": "mobile/pages/auth-test/index.vue", "where": "content", "matched": "diagnostic", "excerpt": "ed debug\" description=\"AUTH_TEST_ADVANCED_DEBUG. Expanded only when deeper H0.5 dia...
- 另有 2 条证据见 JSONL。

## 阻塞项
- `加密传输`：静态项目证据不能证明所有传输路径和第三方 SDK 均加密传输。 解除方式：提供网络传输与第三方 SDK 传输是否加密的证明或人工确认。
- `隐私政策 URL`：未发现可用于 Data safety 的隐私政策 URL。 解除方式：提供公开可访问且覆盖当前 app 数据行为的隐私政策 URL。
- `儿童/敏感数据风险`：未发现足够证据确认是否面向儿童或处理敏感数据。 解除方式：确认目标年龄、儿童/家庭政策和敏感数据处理范围。
- `逐数据类型答案`：发现 11 个数据类型候选，其中 11 个仍未完成 owner 逐项确认；collected/shared/purpose/identity/tracking/required 需要人工逐项确认。 解除方式：填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中每个 dataTypes 条目的 collected、shared、purposes、linkedToIdentity、usedForTracking、requiredOrOptional、processedEphemerally。

## 总结
- 当前 Data safety 准备状态：`blocked`。
- 不能作为最终 Data safety 答案：还有 4 类字段需要人工确认。
- 优先处理：加密传输：提供网络传输与第三方 SDK 传输是否加密的证明或人工确认；隐私政策 URL：提供公开可访问且覆盖当前 app 数据行为的隐私政策 URL；儿童/敏感数据风险：确认目标年龄、儿童/家庭政策和敏感数据处理范围；逐数据类型答案：填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中每个 dataTypes 条目的 collected、shared、purposes、linkedToIdentity、usedForTracking、requiredOrOptional、processedEphemerally。
- 已形成数据类型候选：Personal info / User IDs, Personal info / Name, Personal info / Email address, Personal info / Phone number, Financial info / Purchase history, Photos and videos / Photos or videos, Files and docs / Files and docs, App activity / App interactions。
- 本报告只准备 Data safety 证据草稿，不执行任何发布动作。
