# Google Play 截图规格参考

官方说明来源：`https://support.google.com/googleplay/android-developer/answer/9866151?hl=en`

## 基础规格

- 每个支持的设备类型至少需要 2 张截图才能发布商店详情。
- 格式：JPEG 或 24-bit PNG。
- PNG 不应包含 alpha。
- 最小尺寸：320 px。
- 最大尺寸：3840 px。
- 最大尺寸不能超过最小尺寸的 2 倍。
- 截图必须展示当前 app 体验，不能误导用户。

## 推荐与人工审核

- 推荐为 app 提供至少 4 张截图。
- 常见推荐方向为 1080p、9:16 纵向或 16:9 横向。
- 不要展示与 app 体验无关的额外文字、价格、排名、促销、设备框或商店表现声明。
- 大屏、平板、Chromebook、Wear OS、TV、Automotive、XR 可能有额外尺寸和设备类型要求。

## skill 判定口径

- `google_play_spec_checks.basic_dimensions_pass=true` 只表示 raw PNG 满足基础尺寸和比例。
- `google_play_spec_checks.store_ready_candidate=true` 需要基础尺寸通过且 PNG 无 alpha。
- 即使 `store_ready_candidate=true`，仍必须 `review_status=NEED_HUMAN`，因为内容、裁切、安全区、商标和是否误导需要人工审核。
