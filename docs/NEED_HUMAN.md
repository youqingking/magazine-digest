# NEED_HUMAN

本线程没有被人工信息阻塞；以下事项会阻塞后续实现线程。

| Item | Why it matters | Blocks |
| --- | --- | --- |
| Expo / EAS 组织名、slug、`ios.bundleIdentifier`、`android.package` | 第二线程真正 scaffold Expo app 时需要稳定命名，避免后续重命名成本。 | `feat/expo-shell-foundation` |
| Supabase org / project / secret 管理方案 | 第三线程以前需要确定环境来源与密钥注入方式，但本线程不创建 project。 | `feat/supabase-auth-data` |
| RevenueCat project / app mapping | 订阅 seam 可以先占位，但真实接入前必须明确产品映射。 | 后续订阅实现线程 |
| Push credential owner 与策略 | 需确认是否长期只走 Expo Push，还是尽快补齐直连 `FCM/APNs`。 | `feat/notifications-growth` |
| Legacy 保留周期 | 需决定 `mobile/`、`uniCloud/`、`admin/` 是长期 reference 还是未来拆仓归档。 | 后续清理线程 |
| 独立 bootstrap 分支策略 | 当前线程运行在既有分支 `codex/step07-domain-manifest-adoption`，若需要单独隔离，应由后续人工决定是否新开治理分支或 Worktree。 | 治理/合并策略 |
| Expo / EAS owner 与 projectId 复核 | 本线程按 GitHub 目标组织把 Expo `owner` 暂改为 `daowei2026`，但 `projectId` 仍来自既有配置；需要人工确认 Expo 侧是否已有同名组织/项目，避免后续 EAS build 归属错误。 | EAS build / submit |
