# Google Play Data Safety 分类参考

用于把代码和 SDK 信号映射为披露草稿类别。这里不是法律意见，所有 C3/C4/C5 结论都需要人工审核。

官方口径来源：`https://support.google.com/googleplay/android-developer/answer/10787469?hl=en`。Data safety 输出应贴近 Play Console 表单，而不是只给自然语言结论。

## 表单级字段

| 字段 | 草稿策略 |
| --- | --- |
| 是否收集或共享用户数据 | 由数据流、权限、SDK 候选推断；最终答案 `NEED_HUMAN` |
| 用户数据传输是否加密 | 静态扫描不能最终证明；默认 `NEED_HUMAN` |
| 用户是否可请求删除数据 | 从删除账号流程或 Data deletion URL 推断候选；最终 `NEED_HUMAN` |
| 隐私政策 URL | 必须是 app 自有、公开可访问、覆盖当前数据行为；默认 `NEED_HUMAN` |
| 第三方共享 | 第三方 SDK、外部 API、analytics/crash/payment/ads 信号只作为候选；最终 `NEED_HUMAN` |
| Tracking | 广告 SDK、归因 SDK、Advertising ID、跨 app/device 标识、identify/setUserId 只作为候选；最终 `NEED_HUMAN` |

## 数据类别

| 类别 | 常见字段或信号 |
| --- | --- |
| Location | gps、location、latitude、longitude、geofence、address |
| Personal info | name、email、phone、address、userId、account、profile、age、birthday |
| Financial info | card、payment、billing、invoice、subscription、purchase、revenue |
| Health and fitness | health、medical、fitness、workout、steps、heart |
| Messages | message、chat、sms、email body、notification content |
| Photos and videos | camera、photo、image、video、media library |
| Audio files | microphone、audio、voice、recording |
| Files and docs | file、document、upload、attachment |
| Calendar | calendar、event date、reminder |
| Contacts | contacts、address book |
| App activity | analytics event、screen view、search、click、in-app action |
| Web browsing | webview url、browser history、referrer |
| App info and performance | crash、diagnostics、performance、logs |
| Device or other IDs | advertising ID、IDFA、androidId、deviceId、installationId、push token |

## 用途候选

- App functionality
- Analytics
- Developer communications
- Advertising or marketing
- Fraud prevention, security, and compliance
- Personalization
- Account management

## 每个数据类型必须输出的字段

- `collected`：是否收集。静态扫描只能给 `YES_CANDIDATE`、`NO_NOT_OBSERVED` 或 `NEED_HUMAN`。
- `shared`：是否共享给第三方。第三方 SDK 或外部网络 sink 命中时给候选，最终 `NEED_HUMAN`。
- `processed_ephemerally`：是否仅短暂处理。一般无法由代码证明，默认 `NEED_HUMAN`。
- `required_or_optional`：数据收集对用户是否必需。需要产品/隐私 owner 确认，默认 `NEED_HUMAN`。
- `purposes`：用途候选，只能作为人工填表参考；`purposes_review_status` 必须是 `NEED_HUMAN`。
- `linked_to_identity`：身份关联候选，不能直接写最终 Yes/No。
- `used_for_tracking`：tracking 候选，必须人工确认。

## 独立产物

- `data-safety-form-draft.zh.md`：中文逐项解释，方便人工按 Play Console 页面审核。
- `data-safety-form-draft.json`：后续 agent 使用的结构化草稿，必须包含 `global_questions`、`data_types`、`human_review_items`、`confidence`、`evidence_refs`。
- `data-safety-form-draft.csv`：CSV 草稿映射表，不是官方导出模板；`response_value` 在人工确认前必须为空。

## 人工审核口径

- 第三方 SDK 存在时，不能仅凭静态扫描确定是否“共享”；应输出候选并要求人工确认 SDK 数据处理条款。
- Advertising ID、归因 SDK、广告 SDK、跨 app/device 标识通常触发 tracking 人工审核。
- 账号体系存在但删除流程缺失时，应阻塞。
- 儿童、家庭、青少年或敏感数据命中时，应阻塞或至少需要人工审核。
