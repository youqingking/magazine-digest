# Google Play Data safety 表单草稿

生成时间：`2026-06-18T10:14:22Z`

## 使用边界

- 官方说明：`https://support.google.com/googleplay/android-developer/answer/10787469?hl=en`
- 总状态：`blocked`
- 人工确认状态：`NEED_HUMAN`
- 非最终声明：这是给人工填写 Play Console Data safety 表单用的证据草稿，不是最终提交答案。
- CSV 说明：Google Play Console 支持从 Data safety 页面导出/导入 CSV，并可下载 sample CSV；本 CSV 是证据草稿映射，不是官方导出的可直接导入模板。

## 全局问题

| Play Console 字段 | 草稿答案 | 人工确认 | 置信度 | 中文解释 | 证据 |
| --- | --- | --- | --- | --- | --- |
| `does_app_collect_or_share_user_data` | `YES_CANDIDATE` | `NEED_HUMAN` | `0.75` | 需要人工确认。 | evidence.0052, evidence.0053, evidence.0054, evidence.0104, evidence.0105, evidence.0106, evidence.0107, evidence.0108, evidence.0073, evidence.0074, evidence.0075, evidence.0076, evidence.0077, evidence.0078, evidence.0094, evidence.0095, evidence.0096, evidence.0097, evidence.0098, evidence.0099, evidence.0005, evidence.0007, evidence.0008, evidence.0009, evidence.0006, evidence.0127, evidence.0128, evidence.0144, evidence.0145, evidence.0111 |
| `is_all_user_data_collected_encrypted_in_transit` | `NEED_HUMAN` | `NEED_HUMAN` | `0.0` | 静态扫描不能证明所有传输路径均使用加密，也不能证明第三方 SDK 传输行为。 | 无 |
| `can_users_request_data_deletion` | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | Play Console 需要确认删除请求机制；如果 app 支持账号创建，还需要确认账号和关联数据删除路径。 | evidence.0294, evidence.0304, evidence.0313, evidence.0314, evidence.0320, evidence.0332, evidence.0333 |
| `privacy_policy_url` | `NEED_HUMAN` | `NEED_HUMAN` | `0.1` | 必须由人工确认这是 app 自有、公开可访问且覆盖当前数据行为的隐私政策 URL。 | 无 |
| `third_party_sdk_or_external_sharing` | `YES_CANDIDATE` | `NEED_HUMAN` | `0.7` | 需要人工确认。 | evidence.0005, evidence.0007, evidence.0008, evidence.0009, evidence.0006 |
| `tracking` | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 需要人工确认。 | evidence.0012, evidence.0013, evidence.0015, evidence.0016, evidence.0018, evidence.0019, evidence.0021, evidence.0022, evidence.0023, evidence.0025, evidence.0040, evidence.0044 |
| `children_or_sensitive_data_risk` | `YES_CANDIDATE` | `NEED_HUMAN` | `0.7` | 需要人工确认。 | evidence.0407, evidence.0408, evidence.0409, evidence.0410, evidence.0411, evidence.0412, evidence.0413, evidence.0414, evidence.0415, evidence.0416, evidence.0417, evidence.0418, evidence.0419, evidence.0420, evidence.0421, evidence.0422, evidence.0423, evidence.0424, evidence.0425, evidence.0426, evidence.0127, evidence.0128, evidence.0144, evidence.0145, evidence.0111, evidence.0112, evidence.0115, evidence.0116, evidence.0117, evidence.0049 |

## 逐数据类型草稿

| 数据类别 | Google Play 数据类型 | Collected | Shared | Ephemeral | Required/Optional | 用途候选 | 身份关联 | Tracking | 置信度 | 人工确认 | 证据 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| App activity | App interactions | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Analytics | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0052, evidence.0053, evidence.0054, evidence.0104, evidence.0105, evidence.0106, evidence.0107, evidence.0108 |
| App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | Analytics, App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0073, evidence.0074, evidence.0075, evidence.0076, evidence.0077, evidence.0078, evidence.0094, evidence.0095, evidence.0096, evidence.0097, evidence.0098, evidence.0099, evidence.0005, evidence.0007, evidence.0008, evidence.0009, evidence.0006 |
| Calendar | Calendar events | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0127, evidence.0128, evidence.0144, evidence.0145 |
| Contacts | Contacts | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0111, evidence.0112, evidence.0115, evidence.0116, evidence.0117, evidence.0118, evidence.0122, evidence.0126, evidence.0133, evidence.0134, evidence.0150, evidence.0151 |
| Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Advertising or marketing, Fraud prevention, security, and compliance | `NEED_HUMAN` | `YES_CANDIDATE` | `0.65` | `NEED_HUMAN` | evidence.0012, evidence.0013, evidence.0015, evidence.0016, evidence.0018, evidence.0019, evidence.0021, evidence.0022, evidence.0023, evidence.0025, evidence.0040, evidence.0044 |
| Files and docs | Files and docs | `YES_CANDIDATE` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0131, evidence.0132, evidence.0142, evidence.0143, evidence.0148, evidence.0149, evidence.0158, evidence.0159, evidence.0168, evidence.0169, evidence.0170, evidence.0171 |
| Financial info | Purchase history | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0049, evidence.0050, evidence.0051, evidence.0083, evidence.0084, evidence.0085, evidence.0086, evidence.0087, evidence.0088, evidence.0091, evidence.0092, evidence.0093 |
| Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0136, evidence.0137, evidence.0152, evidence.0153, evidence.0172 |
| Location | Approximate or precise location | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0061, evidence.0062, evidence.0063, evidence.0064, evidence.0065, evidence.0066, evidence.0067, evidence.0068, evidence.0069, evidence.0070, evidence.0071, evidence.0072 |
| Messages | Other in-app messages | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0048, evidence.0056, evidence.0057, evidence.0058, evidence.0059, evidence.0060, evidence.0079, evidence.0080, evidence.0081, evidence.0082, evidence.0089, evidence.0090 |
| Personal info | Address | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0165 |
| Personal info | Email address | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0034, evidence.0036, evidence.0100, evidence.0101, evidence.0103, evidence.0109, evidence.0110, evidence.0114, evidence.0119, evidence.0120, evidence.0121, evidence.0135 |
| Personal info | Name | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0028, evidence.0029, evidence.0030, evidence.0031, evidence.0032, evidence.0033, evidence.0035, evidence.0037, evidence.0038, evidence.0039, evidence.0041, evidence.0042 |
| Personal info | Phone number | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0123, evidence.0124, evidence.0125, evidence.0140, evidence.0141, evidence.0156, evidence.0157, evidence.0160, evidence.0163, evidence.0164, evidence.0166, evidence.0167 |
| Personal info | User IDs | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | Account management | `YES_CANDIDATE` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0010, evidence.0011, evidence.0014, evidence.0017, evidence.0020, evidence.0024, evidence.0026, evidence.0027, evidence.0043, evidence.0045, evidence.0046, evidence.0047 |
| Photos and videos | Photos or videos | `YES_CANDIDATE` | `NEED_HUMAN` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0055, evidence.0113, evidence.0129, evidence.0130, evidence.0138, evidence.0139, evidence.0146, evidence.0147, evidence.0154, evidence.0155, evidence.0161, evidence.0162 |
| Web browsing | Web browsing history | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `NEED_HUMAN` | App functionality | `NEED_HUMAN` | `NO_NOT_OBSERVED` | `0.65` | `NEED_HUMAN` | evidence.0102 |

## 人工确认清单

| 字段路径 | 数据类别 | 数据类型 | 草稿答案 | 状态 | 置信度 | 原因 |
| --- | --- | --- | --- | --- | --- | --- |
| `global_questions.does_app_collect_or_share_user_data` | 全局问题 | 无 | `YES_CANDIDATE` | `NEED_HUMAN` | `0.75` | 该字段需要人工确认后才能进入 Play Console。 |
| `global_questions.is_all_user_data_collected_encrypted_in_transit` | 全局问题 | 无 | `NEED_HUMAN` | `NEED_HUMAN` | `0.0` | 静态扫描不能证明所有传输路径均使用加密，也不能证明第三方 SDK 传输行为。 |
| `global_questions.can_users_request_data_deletion` | 全局问题 | 无 | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | Play Console 需要确认删除请求机制；如果 app 支持账号创建，还需要确认账号和关联数据删除路径。 |
| `global_questions.privacy_policy_url` | 全局问题 | 无 | `NEED_HUMAN` | `NEED_HUMAN` | `0.1` | 必须由人工确认这是 app 自有、公开可访问且覆盖当前数据行为的隐私政策 URL。 |
| `global_questions.third_party_sdk_or_external_sharing` | 全局问题 | 无 | `YES_CANDIDATE` | `NEED_HUMAN` | `0.7` | 该字段需要人工确认后才能进入 Play Console。 |
| `global_questions.tracking` | 全局问题 | 无 | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 该字段需要人工确认后才能进入 Play Console。 |
| `global_questions.children_or_sensitive_data_risk` | 全局问题 | 无 | `YES_CANDIDATE` | `NEED_HUMAN` | `0.7` | 该字段需要人工确认后才能进入 Play Console。 |
| `data_types[0].collected` | App activity | App interactions | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].shared` | App activity | App interactions | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].processed_ephemerally` | App activity | App interactions | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].required_or_optional` | App activity | App interactions | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].purposes` | App activity | App interactions | `['Analytics']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].linked_to_identity` | App activity | App interactions | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[0].used_for_tracking` | App activity | App interactions | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].collected` | App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].shared` | App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].processed_ephemerally` | App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].required_or_optional` | App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].purposes` | App info and performance | Diagnostics | `['Analytics', 'App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].linked_to_identity` | App info and performance | Diagnostics | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[1].used_for_tracking` | App info and performance | Diagnostics | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].collected` | Calendar | Calendar events | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].shared` | Calendar | Calendar events | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].processed_ephemerally` | Calendar | Calendar events | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].required_or_optional` | Calendar | Calendar events | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].purposes` | Calendar | Calendar events | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].linked_to_identity` | Calendar | Calendar events | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[2].used_for_tracking` | Calendar | Calendar events | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].collected` | Contacts | Contacts | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].shared` | Contacts | Contacts | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].processed_ephemerally` | Contacts | Contacts | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].required_or_optional` | Contacts | Contacts | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].purposes` | Contacts | Contacts | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].linked_to_identity` | Contacts | Contacts | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[3].used_for_tracking` | Contacts | Contacts | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].collected` | Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].shared` | Device or other IDs | Device or other IDs | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].processed_ephemerally` | Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].required_or_optional` | Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].purposes` | Device or other IDs | Device or other IDs | `['Advertising or marketing', 'Fraud prevention, security, and compliance']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].linked_to_identity` | Device or other IDs | Device or other IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[4].used_for_tracking` | Device or other IDs | Device or other IDs | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].collected` | Files and docs | Files and docs | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].shared` | Files and docs | Files and docs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].processed_ephemerally` | Files and docs | Files and docs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].required_or_optional` | Files and docs | Files and docs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].purposes` | Files and docs | Files and docs | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].linked_to_identity` | Files and docs | Files and docs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[5].used_for_tracking` | Files and docs | Files and docs | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].collected` | Financial info | Purchase history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].shared` | Financial info | Purchase history | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].processed_ephemerally` | Financial info | Purchase history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].required_or_optional` | Financial info | Purchase history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].purposes` | Financial info | Purchase history | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].linked_to_identity` | Financial info | Purchase history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[6].used_for_tracking` | Financial info | Purchase history | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].collected` | Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].shared` | Health and fitness | Health info or fitness info | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].processed_ephemerally` | Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].required_or_optional` | Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].purposes` | Health and fitness | Health info or fitness info | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].linked_to_identity` | Health and fitness | Health info or fitness info | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[7].used_for_tracking` | Health and fitness | Health info or fitness info | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].collected` | Location | Approximate or precise location | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].shared` | Location | Approximate or precise location | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].processed_ephemerally` | Location | Approximate or precise location | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].required_or_optional` | Location | Approximate or precise location | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].purposes` | Location | Approximate or precise location | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].linked_to_identity` | Location | Approximate or precise location | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[8].used_for_tracking` | Location | Approximate or precise location | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].collected` | Messages | Other in-app messages | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].shared` | Messages | Other in-app messages | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].processed_ephemerally` | Messages | Other in-app messages | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].required_or_optional` | Messages | Other in-app messages | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].purposes` | Messages | Other in-app messages | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].linked_to_identity` | Messages | Other in-app messages | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[9].used_for_tracking` | Messages | Other in-app messages | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].collected` | Personal info | Address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].shared` | Personal info | Address | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].processed_ephemerally` | Personal info | Address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].required_or_optional` | Personal info | Address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].purposes` | Personal info | Address | `['Account management']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].linked_to_identity` | Personal info | Address | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[10].used_for_tracking` | Personal info | Address | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].collected` | Personal info | Email address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].shared` | Personal info | Email address | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].processed_ephemerally` | Personal info | Email address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].required_or_optional` | Personal info | Email address | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].purposes` | Personal info | Email address | `['Account management']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].linked_to_identity` | Personal info | Email address | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[11].used_for_tracking` | Personal info | Email address | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].collected` | Personal info | Name | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].shared` | Personal info | Name | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].processed_ephemerally` | Personal info | Name | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].required_or_optional` | Personal info | Name | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].purposes` | Personal info | Name | `['Account management']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].linked_to_identity` | Personal info | Name | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[12].used_for_tracking` | Personal info | Name | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].collected` | Personal info | Phone number | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].shared` | Personal info | Phone number | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].processed_ephemerally` | Personal info | Phone number | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].required_or_optional` | Personal info | Phone number | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].purposes` | Personal info | Phone number | `['Account management']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].linked_to_identity` | Personal info | Phone number | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[13].used_for_tracking` | Personal info | Phone number | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].collected` | Personal info | User IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].shared` | Personal info | User IDs | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].processed_ephemerally` | Personal info | User IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].required_or_optional` | Personal info | User IDs | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].purposes` | Personal info | User IDs | `['Account management']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].linked_to_identity` | Personal info | User IDs | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[14].used_for_tracking` | Personal info | User IDs | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].collected` | Photos and videos | Photos or videos | `YES_CANDIDATE` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].shared` | Photos and videos | Photos or videos | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].processed_ephemerally` | Photos and videos | Photos or videos | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].required_or_optional` | Photos and videos | Photos or videos | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].purposes` | Photos and videos | Photos or videos | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].linked_to_identity` | Photos and videos | Photos or videos | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[15].used_for_tracking` | Photos and videos | Photos or videos | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].collected` | Web browsing | Web browsing history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].shared` | Web browsing | Web browsing history | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].processed_ephemerally` | Web browsing | Web browsing history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].required_or_optional` | Web browsing | Web browsing history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].purposes` | Web browsing | Web browsing history | `['App functionality']` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].linked_to_identity` | Web browsing | Web browsing history | `NEED_HUMAN` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |
| `data_types[16].used_for_tracking` | Web browsing | Web browsing history | `NO_NOT_OBSERVED` | `NEED_HUMAN` | `0.65` | 逐数据类型字段需要 owner/privacy 人工确认后才能填写 Play Console。 |

## 阻塞项

- `privacy_policy_url_missing` / `NEED_HUMAN`：未在扫描范围内发现隐私政策 URL。 解除方式：提供公开可访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享和删除流程。

## 后续填表说明

- `YES_CANDIDATE` 表示仓库证据提示可能为 Yes，不是最终 Yes。
- `NO_NOT_OBSERVED` 表示扫描范围内未发现，不是最终 No。
- `NEED_HUMAN` 表示必须由 app owner、legal 或 privacy 人工确认后再填写 Play Console。
