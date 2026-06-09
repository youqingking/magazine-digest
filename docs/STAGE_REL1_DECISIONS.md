# Stage REL1 Decisions

- REL1 在 OPS2/OPS3/TEST2 之上增加可移植发布层，不替换现有 scenario publish/current mirror 语义。
- scenario publish 继续服务本地开发与已有 OPS 流程；release channel 负责不可变 artifact、channel head、history、rollback。
- immutable release artifact 以 `runtime/releases/<release-id>/` 为 canonical 存放位置，channel 只持有 manifest 指针。
- channel 首版采用本地文件系统实现：`dev`、`staging`、`production`。
- production channel 只接受 `promotable` scenario 构建出的 release artifact，preview-only scenario 一律拒绝。
- H5/HBuilderX 看不到三本新刊的根因按 runtime source 明确化处理，不再依赖隐式 current mirror 猜测。
- runtime source 首版支持三种模式：
  - `current_mirror`
  - `scenario_preview`
  - `channel_head`
- user-facing app 继续是阅读产品，不承载 operator console；channel/runtime/source 诊断只出现在 settings 的 dev-only 低强调区域。
- copy polish 以“去内部术语、保留必要专有名词、主流程中文化”为原则，不重做视觉。
