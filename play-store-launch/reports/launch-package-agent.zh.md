# Google Play 上架材料总包

- 生成时间：2026-06-18T12:30:52Z
- 总状态：blocked
- readiness：RED
- 结论：当前不能提交 Google Play

本报告面向 owner 复核：它只打包和解释已有上游材料，不提交 Play Console，也不把草稿或阻塞项包装成最终可提交材料。

## 一页结论

| 问题 | 结论 |
| --- | --- |
| 现在能否提交 Google Play | 不能 |
| 当前总包能用来做什么 | 内部复核、分工推进、缺口追踪 |
| 当前不能用来做什么 | Play Console 最终提交、对外公开素材发布、声明 release ready |
| 最高优先级阻塞 | 5 个 P0 行动项 |
| 完整文件清单 | `launch-package-manifest.json` 和 `launch-package-files-included.txt` |

## Owner 优先行动项

| 优先级 | 负责人 | 行动项 | 为什么重要 | 完成标准 | 下一步 |
| --- | --- | --- | --- | --- | --- |
| P0 | 产品/隐私/法务 | 提供公开隐私政策 URL 并确认覆盖当前数据行为 | 隐私政策 URL 同时阻塞隐私披露、Data safety 和 Google Play listing，是提交前的硬性材料。 | 提供可公开访问的隐私政策 URL，并确认内容覆盖当前 app、SDK、数据收集、共享、删除流程和儿童/敏感数据边界。 | 准备隐私政策页面；把公开 URL 填入 play-store-launch/inputs/privacy-data-safety-owner-input.json 和 google-play-listing.json；确认 URL 可访问后重跑 privacy-disclosure-prep、google-data-safety-agent 和 google-play-listing。 |
| P0 | 产品/隐私/法务 | 逐项确认 Google Play Data safety 答案 | 当前只能从证据推断数据类型候选，不能替 owner 回答是否收集、共享、关联身份或用于追踪。 | 每个数据类型都确认 collected/shared/purpose/identity/tracking/required，并确认传输加密、儿童/敏感数据风险。 | 填写 play-store-launch/inputs/privacy-data-safety-owner-input.json 中的隐私政策 URL、加密传输、删除请求、儿童/敏感数据和逐数据类型答案；确认后重跑 privacy-disclosure-prep 与 google-data-safety-agent。 |
| P0 | 产品/运营 | 确认 Google Play listing 人工必填信息 | 当前 app title、short description、full description 已由 google-play-listing 检查通过；剩余阻塞是 开发者联系邮箱、应用分类、内容分级、目标受众 仍需 owner 确认，脚本不能替产品/运营/法务做最终提交判断。 | 开发者联系邮箱、应用分类、内容分级、目标受众 已提供或确认，隐私政策 URL 按单独 P0 项处理；重跑 google-play-listing 后不再报告 human_required_fields 阻塞。 | 在 play-store-launch/inputs/google-play-listing.json 或项目既有 fastlane/metadata 输入中补齐/确认 开发者联系邮箱、应用分类、内容分级、目标受众；如果字段值仍是 NEED_HUMAN，必须替换为真实可提交值或明确 owner 确认值。 |
| P0 | 设计/产品/运营 | 补齐 Google Play preview assets | app icon、feature graphic 和 screenshots 是主商店 listing 的核心素材，当前缺失或没有合规证明。 | app icon 为 512x512 32-bit PNG 且 <=1024KB；feature graphic、至少 2 张截图和可选 video 均有文件与规格证据。 | 准备 app icon、feature graphic；等真实截图捕获通过后再生成最终截图素材。 |
| P0 | 工程/设计 | 补齐 release app 与最终截图规格证据 | 最新 screenshot-capture-agent 已从真实设备捕获到 raw PNG，且 route 已有导航证据；但当前运行的是 HBuilderX debug 容器，raw Android screencap 也还不是可直接提交的 24-bit 商店截图素材。 | 安装 release package 后重跑，或由 owner 明确确认 debug 容器画面可代表最终 app；最终截图完成尺寸、alpha/格式转换和人工公开使用审核。 | 优先安装 `com.daowei2026.magazinedigest` release 包后重跑 capture；如果暂时只能使用 HBuilderX debug 容器，需 owner 书面确认可代表最终体验。随后把已捕获 raw PNG 转成符合 Google Play 要求的最终截图素材。 |
| P1 | 产品/运营 | 确认上架基础信息 source of truth | App 名称、定位、目标用户、账号系统和支持方式会影响 listing、Data safety、截图文案和审核材料。 | 最终 App 名称、备用名、定位、目标用户、账号/删除流程、support URL/email/FAQ 均有 owner 确认。 | 补齐 launch-info-collector 报告中缺失或冲突的信息，然后重跑 launch-info-collector。 |
| P1 | 产品/设计/法务 | 完成截图公开使用审核 | 即使 raw screenshot 捕获成功，也需要确认标题、裁切、安全区、第三方内容、商标和宣传 claim 不误导。 | 所有最终商店截图均完成公开使用、内容授权、商标和 claim 审核。 | 在 raw screenshots 捕获通过后，基于真实截图完成设计稿并进行公开使用审核。 |
| P2 | 发布负责人 | 重跑所有受影响 agent 并重新生成上架总包 | 当前总包只是 blocked 状态快照；修复上游材料后必须重新生成，才能形成新的提交判断。 | 相关上游报告全部更新，本报告重新生成后 readiness 不再是 RED。 | 按 P0/P1 顺序处理后，重新运行 launch-package-agent。 |

## 推荐处理顺序

1. 工程发布门禁已通过；优先补齐隐私政策 URL 和 Data safety 人工答案，因为它们会影响 listing、目标受众和截图文案。
2. 确认产品上架 source of truth，再补齐 listing 文案、分类、开发者联系信息和 preview assets。
3. 基于当前可运行 app 重跑 screenshot-storyboard / screenshot-capture-agent，用真实 app UI 逐张捕获 raw screenshots。
4. 完成截图公开使用审核，确认标题、裁切、安全区、商标和 claim 不误导。
5. 重跑受影响的上游 agent，最后重新生成 launch-package-agent 总包。

## 材料可用性看板

| 材料 | 状态 | 当前能用来做什么 | 当前不能用来做什么 | 主要阻塞 |
| --- | --- | --- | --- | --- |
| 工程发布门禁 | pass | 工程发布门禁 当前未报告阻塞，可进入 owner 复核。 | 仍需最终人工确认后再用于提交。 | 未发现阻塞 |
| 隐私披露准备 | blocked | 可用于内部隐私复核和确认隐私政策缺口。 | 不能作为最终隐私披露或 Data safety 答案。 | 隐私政策 URL 缺失：未在扫描范围内发现隐私政策 URL。 |
| 上架基础信息 | blocked | 可用于整理产品上架信息候选项。 | 不能作为 owner 已确认的唯一 source of truth。 | 账号系统：发现账号/登录能力信号，但没有证明 app 是否必须登录。<br>支持方式：未发现 support URL、email 或 FAQ。 |
| Google Play Data safety | blocked | 可用于 Data safety 草稿和逐项确认清单。 | 不能直接提交到 Play Console Data safety 表单。 | 加密传输：静态项目证据不能证明所有传输路径和第三方 SDK 均加密传输。<br>隐私政策 URL 缺失：未发现可用于 Data safety 的隐私政策 URL。<br>儿童/敏感数据风险：未发现足够证据确认是否面向儿童或处理敏感数据。<br>另有 1 项 |
| Google Play 主商店 listing | blocked | 可用于 listing 缺口检查和文案草稿起点。 | 不能作为最终 Play Store listing metadata。 | Preview assets 缺失或不合规：app icon、feature graphic 或 screenshots 缺失，或还没有规格证明。<br>Listing 必填人工信息缺失：privacy policy URL、developer contact、category、content rating 或 target audience 仍需人工提供/确认。<br>隐私政策 URL 缺失：需要人工确认该字段适用于当前 app 和 Google Play Console。<br>另有 4 项 |
| 截图 storyboard | blocked | 可用于截图规划、shot-list 和 capture handoff。 | 不能证明真实截图已经捕获或素材可公开使用。 | 目标受众缺失：隐私、Data safety、目标年龄或敏感内容仍有人工确认项，公开截图文案需同步确认。 |
| 真实截图捕获 | partial | 可用于证明已从真实设备捕获 4 张 raw screenshot，并追溯 package、route、locale、commit 和 PNG 规格。 | 不能直接作为最终 Play Store 截图素材；仍需 release app/公开使用审核和 Google Play 规格转换。 | 当前是 HBuilderX debug 容器：当前运行目标是调试容器，不能自动等同于最终 release app 体验。<br>google_play_spec_needs_work：4 张 PNG 基础规格存在风险：dimension_or_ratio_failed, png_has_alpha, png_not_24_bit_truecolor；affected_shots=shot_01_home_feed, shot_02_detail_deep_read, shot_03_sources_follow, shot_04_profile_summary<br>截图公开使用未审核：截图公开上架使用必须人工审核内容、裁切、安全区、商标和是否误导。 |

## 为什么现在不能提交

- 提供公开隐私政策 URL 并确认覆盖当前数据行为：隐私政策 URL 同时阻塞隐私披露、Data safety 和 Google Play listing，是提交前的硬性材料。（关联 3 个原始阻塞项）
- 逐项确认 Google Play Data safety 答案：当前只能从证据推断数据类型候选，不能替 owner 回答是否收集、共享、关联身份或用于追踪。（关联 3 个原始阻塞项）
- 确认 Google Play listing 人工必填信息：当前 app title、short description、full description 已由 google-play-listing 检查通过；剩余阻塞是 开发者联系邮箱、应用分类、内容分级、目标受众 仍需 owner 确认，脚本不能替产品/运营/法务做最终提交判断。（关联 5 个原始阻塞项）
- 补齐 Google Play preview assets：app icon、feature graphic 和 screenshots 是主商店 listing 的核心素材，当前缺失或没有合规证明。（关联 1 个原始阻塞项）
- 补齐 release app 与最终截图规格证据：最新 screenshot-capture-agent 已从真实设备捕获到 raw PNG，且 route 已有导航证据；但当前运行的是 HBuilderX debug 容器，raw Android screencap 也还不是可直接提交的 24-bit 商店截图素材。（关联 1 个原始阻塞项）

## 文件索引

- 已纳入文件：32 个。完整列表见 `launch-package-files-included.txt`。
- 缺失文件或目录：0 个。完整列表见 `launch-package-manifest.json`。
- owner 主读报告只保留材料级索引，避免把文件流水账混入决策部分。

## 已生成的关键包文件

- human_report: `play-store-launch/reports/launch-package-agent.zh.md`
- machine_report: `play-store-launch/reports/launch-package-agent-output.json`
- manifest: `play-store-launch/reports/launch-package-manifest.json`
- need_human: `play-store-launch/reports/launch-package-need-human.md`
- files_included: `play-store-launch/reports/launch-package-files-included.txt`

## 原始明细在哪里

- 合并后的人工处理清单见 `launch-package-need-human.md`。
- 原始 blocker、材料矩阵和文件存在性见 `launch-package-agent-output.json`。
- 完整纳入文件和缺失文件见 `launch-package-manifest.json`。

## 最终总结

当前总包是一个真实的 blocked 状态快照，适合 owner 做内部复核和分工推进；它还不是可提交 Play Console 的最终包。请按 P0 行动项处理：提供公开隐私政策 URL 并确认覆盖当前数据行为、逐项确认 Google Play Data safety 答案、确认 Google Play listing 人工必填信息、补齐 Google Play preview assets、补齐 release app 与最终截图规格证据。处理后重跑受影响的上游 agent，最后重新生成本总包。
