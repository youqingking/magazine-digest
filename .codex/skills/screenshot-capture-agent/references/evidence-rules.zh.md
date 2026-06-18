# Screenshot Capture Evidence 规则

## Evidence 类型

- `command`：adb、git、package、foreground、wm size 等命令输出。
- `repo_config`：`app.json`、`mobile/manifest.json`、`mobile/pages.json`、shot-list。
- `storyboard_handoff`：上游 `screenshot-storyboard` 生成的 capture handoff。
- `manual_navigation`：调用方显式声明设备已导航到 shot route 的证据。
- `capture_file`：真实写入磁盘的 raw PNG 文件。
- `png_analysis`：从 PNG IHDR / IDAT 解析出的尺寸、颜色类型、alpha 和空白风险。
- `blocked_reason`：缺少设备、目标 app、shot plan、foreground 或 route 证明。

## Claim 规则

- 每个 claim 必须有 `evidence_refs`。
- `C3`、`C4`、`C5` 必须 `human_review_required=true`。
- 需要人工确认的字段必须写 `review_status=NEED_HUMAN`。
- `not_observed` 只能表示扫描/命令范围内未发现，不能写成不存在。

## 阻塞规则

- 没有 adb：`adb_missing`。
- 没有在线 Android device/emulator：`device_missing`。
- 没有目标 app package 候选或未安装：`target_app_missing`。
- 没有 shot-list 且未显式允许当前屏幕：`shot_plan_missing`。
- 上游 shot-list 有多个 shot 但未指定 `--shot-id` 或导航证明：`multi_shot_navigation_unverified`。
- 目标 package 未处于前台：`target_app_not_foreground`。
- 目标 package 是 HBuilderX debug 容器：`debug_container_needs_human`。
- 截图命令失败或 PNG 解析失败：`capture_failed`。
- 多个 shot 得到相同 PNG hash：`duplicate_screenshot_hash`。
- PNG 疑似空白或非 app 画面：`image_quality_blocked` 或 `NEED_HUMAN`。

## 报告措辞

- 使用“真实捕获”“候选”“需要人工确认”。
- 不写“可提交”“已通过 Google 审核”“最终素材”。
- 没有截图文件时不要列 screenshot path。
- 有截图文件但 route 未证明时，不要写成 route 已确认。
- `planned_route_from_storyboard=true` 只表示上游规划，不表示设备导航已证明。
