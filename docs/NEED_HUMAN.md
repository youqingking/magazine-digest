# NEED_HUMAN

本线程没有被人工信息阻塞；以下事项会阻塞后续实现线程。

| Item | Why it matters | Blocks |
| --- | --- | --- |
| Expo / EAS 组织名、slug、`ios.bundleIdentifier`、`android.package` | 第二线程真正 scaffold Expo app 时需要稳定命名，避免后续重命名成本。 | `feat/expo-shell-foundation` |
| Supabase org / project / secret 管理方案 | 第三线程以前需要确定环境来源与密钥注入方式，但本线程不创建 project。 | `feat/supabase-auth-data` |
| RevenueCat project / app mapping | 订阅 seam 可以先占位，但真实接入前必须明确产品映射。 | 后续订阅实现线程 |
| Push credential owner 与策略 | 需确认是否长期只走 Expo Push，还是尽快补齐直连 `FCM/APNs`。 | `feat/notifications-growth` |
| Legacy 保留周期 | 需决定 `mobile/`、`uniCloud/`、`admin/` 是长期 reference 还是未来拆仓归档。 | 后续清理线程 |
| 独立 harness 分支合并策略 | 当前线程已按 Step 0 运行在 `harness/bootstrap-existing-project`，后续需要人工决定是合并回治理分支、继续拆 Worktree，还是作为 bootstrap harness 长期分支保留。 | 治理/合并策略 |
| Expo / EAS owner 与 projectId 复核 | 本线程按 GitHub 目标组织把 Expo `owner` 暂改为 `daowei2026`，但 `projectId` 仍来自既有配置；需要人工确认 Expo 侧是否已有同名组织/项目，避免后续 EAS build 归属错误。 | EAS build / submit |
| 本地 harness 环境变量未配置 | `scripts/harness/report.ps1` 当前报告缺少 `ALICLOUD_SPACE_ID`、`ALICLOUD_CLIENT_SECRET`、`UNI_ADMIN_BASE_URL`、`PUSH_APP_KEY`、`PRODUCT_KEY_DEFAULT`；这些只能作为占位检查，不应在仓库内写真实值。 | 需要真实云服务、推送或默认产品上下文的实现/验收线程 |
| HBuilderX 桌面工具未发现 | 当前 harness preflight 未找到 HBuilderX；legacy uni-app/H5 参考链路若需要桌面编译或设备验证，需要人工安装或显式声明不再依赖该工具。 | legacy reference 复核、HBuilderX/uni-app 设备烟测 |

## Supabase Runtime Contract Blocker

Draft schema and RLS contracts exist, but no Supabase org/project, auth policy, migration application path, service-role secret owner, or environment injection owner has been approved. Do not apply `infra/supabase/drafts/*.sql` or connect the mobile seam until this is resolved.
