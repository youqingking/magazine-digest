# google-play-listing 主商店 Listing 草稿报告

生成时间：`2026-06-18T09:52:47Z`

## 总状态
- overall_status: `blocked`
- 证明模式：`executed`
- can_submit_google_play: `false`

## Listing 草稿输出
| Locale | Source | appName | shortDescription | fullDescription |
| --- | --- | --- | --- | --- |
| en-US | `play-store-launch/inputs/google-play-listing.json` | Magazine Digest | Save, search, and continue reading magazine digests on mobile. | Magazine Digest helps readers keep up with long-form magazine content in one mob... |

## 字段长度矩阵
| Locale | Field | Length | Limit | Status | Reason |
| --- | --- | --- | --- | --- | --- |
| en-US | `appName` | 15 | 30 | `pass` | 字段存在且长度合规。 |
| en-US | `shortDescription` | 62 | 80 | `pass` | 字段存在且长度合规。 |
| en-US | `fullDescription` | 570 | 4000 | `pass` | 字段存在且长度合规。 |

## Listing Gate 矩阵
| Gate | Status | 结论 |
| --- | --- | --- |
| `app_identity` | `pass` | 发现通用 app identity。 |
| `listing_metadata_source` | `pass` | 发现 Google Play listing metadata 输入。 |
| `listing_text_fields` | `pass` | app title、short description、full description 均存在且长度合规。 |
| `metadata_policy` | `pass` | 未发现 metadata policy 风险词。 |
| `preview_assets` | `blocked` | app icon、feature graphic 或 screenshots 缺失/不合规。 |
| `human_required_fields` | `blocked` | privacy policy URL、developer contact、category、content rating 或 target audience 仍需人工提供/确认。 |

## Preview Assets 状态
- `app_icon`：`blocked`；未发现 512x512、32-bit PNG、<=1024KB 的 app icon。
- `feature_graphic`：`blocked`；未发现 1024x500 JPEG 或 24-bit PNG feature graphic。
- `screenshots`：`blocked`；未发现至少 2 张 screenshot 候选。
- `video`：`optional_missing`；Promo video 是可选素材；当前未发现视频候选。

## Metadata Policy 风险
- status: `pass`
- 未发现误导、无关、过度格式化、排名、价格、促销或不合适 metadata 风险。

## 人类需要提供什么
- `privacy_policy_url`：`NEED_HUMAN`；status=`candidate_found`；需要人工确认该字段适用于当前 app 和 Google Play Console。
- `developer_contact_email`：`NEED_HUMAN`；status=`candidate_found`；需要人工确认该字段适用于当前 app 和 Google Play Console。
- `category`：`News & Magazines`；status=`candidate_found`；需要人工确认该字段适用于当前 app 和 Google Play Console。
- `content_rating`：`NEED_HUMAN`；status=`candidate_found`；需要人工确认该字段适用于当前 app 和 Google Play Console。
- `target_audience`：`Adults and general readers`；status=`candidate_found`；需要人工确认该字段适用于当前 app 和 Google Play Console。

## 阻塞项
- `gate:preview_assets`：status=`blocked`；原因：app icon、feature graphic 或 screenshots 缺失/不合规。；解除：提供 512x512 32-bit PNG app icon、1024x500 feature graphic、至少 2 张截图；video 可选。
- `gate:human_required_fields`：status=`blocked`；原因：privacy policy URL、developer contact、category、content rating 或 target audience 仍需人工提供/确认。；解除：人工提供并确认 privacy policy URL、developer contact、category、content rating 和 target audience。

## 总结
- 当前 Google Play 主商店 listing gate 状态：`blocked`。
- 阻塞 gate：preview_assets, human_required_fields。
- 已通过 gate：app_identity, listing_metadata_source, listing_text_fields, metadata_policy。
- 优先顺序：补齐 icon、feature graphic 和 screenshots；补齐人工字段。
- 本报告只准备 listing draft 和阻塞证据，不提交 Google Play，不声明最终批准。
