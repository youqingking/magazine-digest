# Google Play 上架材料人工处理清单

- 生成时间：2026-06-18T11:06:36Z
- 总状态：blocked

## 合并行动项

| 优先级 | 负责人 | 行动项 | 完成标准 | 关联原始阻塞数 |
| --- | --- | --- | --- | --- |
| P0 | 产品/隐私/法务 | 提供公开隐私政策 URL 并确认覆盖当前数据行为 | 提供可公开访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享、删除流程和儿童/敏感数据边界。 | 3 |
| P0 | 产品/隐私/法务 | 逐项确认 Google Play Data safety 答案 | 每个数据类型都确认 collected/shared/purpose/identity/tracking/required，并确认传输加密、儿童/敏感数据风险。 | 3 |
| P0 | 产品/运营 | 确认 Google Play listing 人工必填信息 | 开发者联系邮箱、应用分类、内容分级、目标受众 已提供或确认，隐私政策 URL 按单独 P0 项处理；重跑 google-play-listing 后不再报告 human_required_fields 阻塞。 | 5 |
| P0 | 设计/产品/运营 | 补齐 Google Play preview assets | app icon 为 512x512 32-bit PNG 且 <=1024KB；feature graphic、至少 2 张截图和可选 video 均有文件与规格证据。 | 1 |
| P0 | 工程/设计 | 补齐 release app 与最终截图规格证据 | 安装 release package 后重跑，或由 owner 明确确认 debug 容器画面可代表最终 app；shot-list 中每个必需 shot 都有 raw PNG、route、locale、device 和 commit 证据；最终截图完成规格转换和人工公开使用审核。 | 2 |
| P1 | 产品/运营 | 确认上架基础信息 source of truth | 最终 App 名称、备用名、定位、目标用户、账号/删除流程、support URL/email/FAQ 均有 owner 确认。 | 2 |
| P1 | 产品/设计/法务 | 完成截图公开使用审核 | 所有最终商店截图均完成公开使用、内容授权、商标和 claim 审核。 | 2 |
| P2 | 发布负责人 | 重跑所有受影响 agent 并重新生成上架总包 | 相关上游报告全部更新，本报告重新生成后 readiness 不再是 RED。 | 0 |

## 原始阻塞项附录

| 归属 | 来源材料 | 处理项 | 原因 | 完成标准 |
| --- | --- | --- | --- | --- |
| 隐私/法务/产品 | 隐私披露准备 | privacy_policy_url_missing | 未在扫描范围内发现隐私政策 URL。 | 提供公开可访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享和删除流程。 |
| 产品/运营 | 上架基础信息 | 账号系统 | 发现账号/登录能力信号，但没有证明 app 是否必须登录。 | 说明是否必须登录、哪些功能可游客使用、是否提供账号删除/注销入口。 |
| 产品/运营 | 上架基础信息 | 支持方式 | 未发现 support URL、email 或 FAQ。 | 提供可公开的 support URL、support email 或 FAQ/help center。 |
| 隐私/法务/产品 | Google Play Data safety | 加密传输 | 静态项目证据不能证明所有传输路径和第三方 SDK 均加密传输。 | 提供网络传输与第三方 SDK 传输是否加密的证明或人工确认。 |
| 隐私/法务/产品 | Google Play Data safety | 隐私政策 URL | 未发现可用于 Data safety 的隐私政策 URL。 | 提供公开可访问且覆盖当前 app 数据行为的隐私政策 URL。 |
| 隐私/法务/产品 | Google Play Data safety | 儿童/敏感数据风险 | 未发现足够证据确认是否面向儿童或处理敏感数据。 | 确认目标年龄、儿童/家庭政策和敏感数据处理范围。 |
| 隐私/法务/产品 | Google Play Data safety | 逐数据类型答案 | 发现 11 个数据类型候选，其中 11 个仍未完成 owner 逐项确认；collected/shared/purpose/identity/tracking/required 需要人工逐项确认。 | 填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中每个 dataTypes 条目的 collected、shared、purposes、linkedToIdentity、usedForTracking、requiredOrOptional、processedEphemerally。 |
| 产品/运营/设计 | Google Play 主商店 listing | gate:preview_assets | app icon、feature graphic 或 screenshots 缺失/不合规。 | 提供 512x512 32-bit PNG app icon、1024x500 feature graphic、至少 2 张截图；video 可选。 |
| 产品/运营/设计 | Google Play 主商店 listing | gate:human_required_fields | privacy policy URL、developer contact、category、content rating 或 target audience 仍需人工提供/确认。 | 人工提供并确认 privacy policy URL、developer contact、category、content rating 和 target audience。 |
| 产品/运营/设计 | Google Play 主商店 listing | privacy_policy_url | 需要人工确认该字段适用于当前 app 和 Google Play Console。 | 补充并确认 privacy_policy_url。 |
| 产品/运营/设计 | Google Play 主商店 listing | developer_contact_email | 需要人工确认该字段适用于当前 app 和 Google Play Console。 | 补充并确认 developer_contact_email。 |
| 产品/运营/设计 | Google Play 主商店 listing | category | 需要人工确认该字段适用于当前 app 和 Google Play Console。 | 补充并确认 category。 |
| 产品/运营/设计 | Google Play 主商店 listing | content_rating | 需要人工确认该字段适用于当前 app 和 Google Play Console。 | 补充并确认 content_rating。 |
| 产品/运营/设计 | Google Play 主商店 listing | target_audience | 需要人工确认该字段适用于当前 app 和 Google Play Console。 | 补充并确认 target_audience。 |
| 产品/设计 | 截图 storyboard | privacy_or_target_audience_needs_human | 隐私、Data safety、目标年龄或敏感内容仍有人工确认项，公开截图文案需同步确认。 | 完成 privacy/data safety/target audience 人工审核后再批准公开截图。 |
| 工程/设计 | 真实截图捕获 | debug_container_needs_human | 当前目标 package 是 HBuilderX debug 容器，不能自动等同于最终 release app 体验。 | 人工确认 debug 容器画面可代表目标 app，或安装 release package 后重跑。 |
| 工程/设计 | 真实截图捕获 | google_play_spec_needs_work | PNG 基础规格存在风险：dimension_or_ratio_failed, png_has_alpha, png_not_24_bit_truecolor | 按 Google Play 截图规格转换/裁切并人工审核。 |
| 工程/设计 | 真实截图捕获 | google_play_public_use_needs_human | 截图公开上架使用必须人工审核内容、裁切、安全区、商标和是否误导。 | 由 owner/design/legal 审核 raw 截图和最终商店图。 |
