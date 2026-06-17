# NEED_HUMAN

Run id: `play-store-l3-20260612-162313`

本文件列出解除 Play Store 发布 blocker 需要人工补齐的事项。所有条目都不代表 approval；它们是 owner / Pro / dev 的下一步清单。

### release
- blocker 是什么：缺 signed Android build / EAS / signing
  - 当前 status：`blocked`
  - claim_class：`C4/C5`
  - human_review_required：`true`
  - evidence_refs：`docs/release/ANDROID_BUILD_READINESS.md`
  - 下一步动作：dev + owner 补齐 EAS 和签名 evidence。

### privacy
- blocker 是什么：Privacy policy URL 与 Developer contact 缺失
  - 当前 status：`needs_human`
  - claim_class：`C3`
  - human_review_required：`true`
  - evidence_refs：`docs/privacy/DATA_INVENTORY.md`
  - 下一步动作：owner/Pro 提供并审核 privacy source-of-truth。

### Data Safety
- blocker 是什么：Data Safety 仍是 evidence draft
  - 当前 status：`needs_human`
  - claim_class：`C3/C4`
  - human_review_required：`true`
  - evidence_refs：`docs/launch/google-play/data-safety-evidence.md`
  - 下一步动作：owner/Pro 回答 Play Console Data Safety 问题。

### listing
- blocker 是什么：listing copy 是 draft，不能当 not final approval
  - 当前 status：`needs_human`
  - claim_class：`C2/C4`
  - human_review_required：`true`
  - evidence_refs：`docs/launch/google-play/listing-validation-report.md`
  - 下一步动作：owner/Pro 审核商店文案和 category。

### screenshot
- blocker 是什么：真实截图 capture_status=blocked，screenshots 未 captured
  - 当前 status：`blocked`
  - claim_class：`C2/C4`
  - human_review_required：`true`
  - evidence_refs：`docs/launch/screenshots/capture-blockers.md`
  - 下一步动作：dev 接入 device/emulator 后重新 capture。

### Play Console
- blocker 是什么：Play Console API、credentials、submission 都禁止在本 workflow 执行
  - 当前 status：`blocked`
  - claim_class：`C5`
  - human_review_required：`true`
  - evidence_refs：`docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
  - 下一步动作：owner 在外部审批 C5 action。

## Owner / Pro / dev actions

1. signed Android build / EAS / signing
   - 要做什么：补齐并确认 signed Android build / EAS / signing。
   - 输入是什么：EAS owner/projectId/build profile、Android signing policy、release build 命令或 CI evidence。
   - 产出是什么：signed Android build evidence 与更新后的 release gate。
   - 负责人类型：dev + owner
   - 解除哪个 blocker：`rba.c4.android_release_build_blocked`
2. Play Console app/account
   - 要做什么：补齐并确认 Play Console app/account。
   - 输入是什么：Play Console app id、package name、account ownership、发布权限边界。
   - 产出是什么：Play Console source-of-truth 记录。
   - 负责人类型：owner
   - 解除哪个 blocker：`lic.c5.play_console_action_blocked / lpa.c5.play_console_action_blocked`
3. Privacy policy URL
   - 要做什么：补齐并确认 Privacy policy URL。
   - 输入是什么：正式 privacy policy URL 与适用区域。
   - 产出是什么：privacy disclosure draft 更新并解除 privacy URL blocker。
   - 负责人类型：owner / Pro
   - 解除哪个 blocker：`pdp.c3.privacy_policy_url_missing`
4. Developer contact
   - 要做什么：补齐并确认 Developer contact。
   - 输入是什么：开发者邮箱、网站或支持联系渠道。
   - 产出是什么：store-fields/source-of-truth.json 更新。
   - 负责人类型：owner
   - 解除哪个 blocker：`Play Console app/account needs owner input`
5. Data Safety owner answers
   - 要做什么：补齐并确认 Data Safety owner answers。
   - 输入是什么：数据收集、共享、加密、删除请求、SDK 行为确认。
   - 产出是什么：reviewed Data Safety answers 与更新后的 evidence draft。
   - 负责人类型：owner / Pro
   - 解除哪个 blocker：`gdsa.c4.play_console_answers_need_human`
6. content rating
   - 要做什么：补齐并确认 content rating。
   - 输入是什么：内容分级问卷答案和目标国家/地区。
   - 产出是什么：content rating source-of-truth。
   - 负责人类型：owner / Pro
   - 解除哪个 blocker：`content rating and target audience needs_human`
7. target audience
   - 要做什么：补齐并确认 target audience。
   - 输入是什么：目标年龄层、区域、受众限制和政策判断。
   - 产出是什么：target audience source-of-truth。
   - 负责人类型：owner / Pro
   - 解除哪个 blocker：`content rating and target audience needs_human`
8. real screenshot capture
   - 要做什么：补齐并确认 real screenshot capture。
   - 输入是什么：Android device/emulator、Expo tooling、可渲染 route、locale 和 fixture。
   - 产出是什么：真实 screenshot files 与 capture report。
   - 负责人类型：dev
   - 解除哪个 blocker：`sca.c4.capture_blocked_no_device`
9. public asset selection
   - 要做什么：补齐并确认 public asset selection。
   - 输入是什么：截图候选、文案、品牌和政策审查意见。
   - 产出是什么：public asset approval record。
   - 负责人类型：owner / Pro
   - 解除哪个 blocker：`sca.c2.public_asset_selection_needs_review / ss.c4.play_screenshot_use_needs_review`
