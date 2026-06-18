# Human Review

Run ID: `play-store-launch-20260617-091146`

以下项目需要 owner/Pro/dev 人工补充或确认。未解除前，workflow 保持 fail-closed，`can_submit_google_play=false`。

## release-build-agent / `release-build-agent.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：发布构建检查 仍需要人工确认。
- 影响：无法证明签名 Android 构建、EAS 配置或 Play Console 提交流程可用。
- 解除方式：owner/dev 提供 EAS project、签名策略、release build 和 dry-run 证据。
- evidence：`release-build-agent.evidence.01`, `release-build-agent.evidence.02`, `release-build-agent.evidence.03`
## privacy-disclosure-prep / `privacy-disclosure-prep.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：隐私披露准备 仍需要人工确认。
- 影响：隐私披露、隐私政策 URL 和法律措辞不能用于公开商店材料。
- 解除方式：owner/Pro 提供并审核隐私政策 URL、开发者联系人和适用法律披露。
- evidence：`privacy-disclosure-prep.evidence.01`, `privacy-disclosure-prep.evidence.02`, `privacy-disclosure-prep.evidence.03`
## google-play-listing / `google-play-listing.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：商店文案草稿 仍需要人工确认。
- 影响：商店文案只能保持草稿，类别、评级、受众和授权不能视为完成。
- 解除方式：owner/Pro 审核文案、类别、内容评级、目标受众、授权和商标风险。
- evidence：`google-play-listing.evidence.01`, `google-play-listing.evidence.02`, `google-play-listing.evidence.03`
## screenshot-storyboard / `screenshot-storyboard.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：截图分镜规划 仍需要人工确认。
- 影响：已有截图规划，但还不能作为可上传截图资产。
- 解除方式：owner/Pro 审核分镜表达，dev 后续用真实设备或模拟器捕获截图。
- evidence：`screenshot-storyboard.evidence.01`, `screenshot-storyboard.evidence.02`, `screenshot-storyboard.evidence.03`
## launch-info-collector / `launch-info-collector.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：上架信息收集 仍需要人工确认。
- 影响：Play Console、开发者联系人和公开商店字段仍缺 source-of-truth。
- 解除方式：owner 补齐 Play Console app/account、公开字段和开发者联系信息。
- evidence：`launch-info-collector.evidence.01`, `launch-info-collector.evidence.02`, `launch-info-collector.evidence.03`, `launch-info-collector.evidence.04`
## google-data-safety-agent / `google-data-safety-agent.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：Data Safety 草稿 仍需要人工确认。
- 影响：Data Safety 只能保持 evidence draft，不能视为商店答案。
- 解除方式：owner/Pro 按 Play Console 问题逐项确认 Data Safety、SDK、儿童家庭和广告追踪答案。
- evidence：`google-data-safety-agent.evidence.01`, `google-data-safety-agent.evidence.02`, `google-data-safety-agent.evidence.03`
## screenshot-capture-agent / `screenshot-capture-agent.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：真实截图捕获 仍需要人工确认。
- 影响：没有真实设备或模拟器截图证据，不能列出截图文件。
- 解除方式：dev 连接 Android 设备或模拟器，生成带 route、device、locale、commit 的真实截图证据。
- evidence：`screenshot-capture-agent.evidence.01`, `screenshot-capture-agent.evidence.02`, `screenshot-capture-agent.evidence.03`
## launch-package-agent / `launch-package-agent.fresh_run.fail_closed_status`
- 当前状态：blocked
- 原因：发布包汇总 仍需要人工确认。
- 影响：汇总包只能 fail-closed，不得把上游 blocker 改写为可提交。
- 解除方式：等待前 7 个代理 blocker 解除后重新运行 workflow。
- evidence：`launch-package-agent.evidence.01`, `launch-package-agent.evidence.02`, `launch-package-agent.evidence.03`, `launch-package-agent.evidence.04`, `launch-package-agent.evidence.05`, `launch-package-agent.evidence.06`, `launch-package-agent.evidence.07`
