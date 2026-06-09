# Operator Console Guide

## 目标

这份说明书面向本地 operator / editor，帮助你通过仓库内置的 operator console 完成：

- 内容与来源状态查看
- release / channel / runtime source 操作
- observability / incident triage 查看
- 轻量 editorial CRUD

本后台是本地 file-backed 管理台，不是线上 CMS，也不是面向普通用户的页面。

## 导入形态提示

当前仓库已经支持两类内容导入来源：

- 单个 zip 对应单本杂志 / 单个 issue
- 单个 zip 内含多个 release 目录，每个目录对应一本杂志 / 一个 issue

无论是哪种输入形态，最终都要先落到：

- `publication registry`
- `issue registry`
- `scenario registry`

之后再通过 `Scenario Membership`、`Release`、`Runtime Source` 等后台入口管理多刊物 runtime，不直接把 zip 结构暴露给 mobile 端。

当前默认本地运行目标也应是四刊 current mirror。三刊 mixed preview 仍保留，但只作为显式 QA / comparison source。

## intake 不是“只要传上去就落库”

现在 `ZIP Intake` 已接上内容门禁。

导入会先检查：

- 标题是否存在
- 摘要是否存在
- 成人版 / 青少年版是否成对
- 长版 / 短版是否齐全
- adult / youth / merged 标题是否一致
- `summary` 与 `quick_30s` 是否疑似串位

如果不达标，后台会直接返回：

- `status = blocked`
- `validation_report`

而不是继续把问题内容放进 registry / candidate / current。

规则说明见：

- [CONTENT_PACKAGE_GATE_POLICY.md](/D:/ws/Playground/docs/CONTENT_PACKAGE_GATE_POLICY.md)

## 正确的内部发布观念

如果目标是让“已安装客户端自动拿到新内容”，不要再把内容发布理解成“重新打一个 app 包”。

正确链路应是：

1. 安装一次支持 remote bridge 的内部包
2. 在手机 `设置 -> 内容自动更新` 里保存 `remote base url + channel`
3. 后台导入 / 纳入 candidate / publish channel
4. runtime dist 自动刷新
5. 手机下次启动或回前台时自动拉到新内容

只有当包内代码本身缺少 remote bridge 配置入口时，才允许做最后一次内部包补丁；之后内容更新应主要通过后台发布完成。
当前设置页在首次保存远端桥接时，会自动把 app 切到 `hybrid`，减少运营或测试同学漏切运行模式。

阿里云 ECS 子目录部署推荐使用：

- operator console: `http://8.136.215.40/magazine-admin/`
- runtime base url: `http://8.136.215.40/magazine-runtime`

## 启动方式

在仓库根目录运行：

```powershell
node scripts/ops/start-operator-console.mjs
```

默认访问地址：

- `http://127.0.0.1:4174`

如需模拟 ECS 子目录挂载：

```powershell
node scripts/ops/start-operator-console.mjs --base-path /magazine-admin --runtime-base-path /magazine-runtime --default-remote-base-url same-origin
```

如需指定端口：

```powershell
node scripts/ops/start-operator-console.mjs --port 4178
```

## 页面总览

后台首页当前包含这些区块：

- `Overview`
- `Actions`
- `ZIP Intake`
- `Content`
- `Quality`
- `Scenarios`
- `Release`
- `Observability`
- `Incidents`
- `Editorial`
- `OPS5 Audit`
- `Publications`
- `Issues`
- `Article Metadata`
- `Taxonomy`
- `Scenario Membership`

其中：

- `Overview` 到 `Incidents` 以查看状态为主
- `Publications` 到 `Scenario Membership` 是可写 CRUD 区
- 所有可写操作都会弹确认框

## 最常用入口：新增杂志

如果你的目标是“新增一本文杂志”，现在推荐直接用：

- `ZIP Intake`

而不是先手改 registry 或 json。

完整操作手册见：

- [ADD_NEW_MAGAZINE_RUNBOOK.md](/D:/ws/Playground/docs/ADD_NEW_MAGAZINE_RUNBOOK.md)

## 使用原则

- 不要在这里编辑正文内容块。
- 不要把已发布 immutable release artifact 当作可编辑对象。
- 不要试图绕过脚本层直接改页面表单之外的写入逻辑。
- 有状态写操作都应通过后台或对应脚本完成，以保留锁、原子写入、审计日志和联动刷新。
- 普通用户端 mobile 页面不承载这些管理能力。

## 各区块说明

### Overview

用于快速确认当前运行态：

- `baseline`
- `selected`
- `current`
- `candidate`
- `decision`
- `last_publish`
- `last_rollback`
- `runtime_source`
- `runtime_target`

适合先回答两个问题：

- 当前 app 正在读什么 source
- 当前 candidate 是否接近可发布

### Actions

这是脚本动作入口，不是内容编辑区。常见动作包括：

- `compare`
- `evaluate`
- `dry_run_publish`
- `apply_publish`
- `rollback`
- `retire`
- `build_release_candidate`
- `intake`
- `export_runtime_dist`
- `serve_runtime_dist`

字段说明：

- `Scenario`: 目标 scenario
- `Baseline`: 基线 scenario
- `Channel`: 目标 channel
- `Mode`: runtime source mode
- `Remote Base URL`: remote-like runtime dist 地址

注意：

- `apply_publish`、`rollback`、`retire`、`intake` 属于高风险动作
- 执行前先看 `Overview`、`Release`、`Observability`
- 对 remote-connected 内部客户端，真正影响已安装 app 的不是 `apply_publish` 到 local current，而是 `publish_channel` / `promote_channel` / `rollback_channel`
- 现在这些 channel 动作一旦 `apply` 成功，会自动补一次 `export_runtime_dist`，减少漏操作

### Content

用于查看：

- publication 列表
- issue 列表
- parser profile
- taxonomy coverage

适合做内容盘点和来源核对，不负责写入。

### ZIP Intake

这是新增杂志 / 新 issue 最方便的入口。

支持：

- 上传单刊 zip
- 上传一个 zip 内含多个 release 目录的 pack
- 上传 `public_release/adult+youth+merged` 形态的单刊 split-audience zip
- 自动识别或手动指定导入 route

关键字段：

- `ZIP File`
- `Route Hint`
- `Publication ID`
- `Display Name`
- `Issue Label`
- `Parser Profile`
- `Free Quota Limit`
- `导入后归档原始 zip`
- `替代现有期次`
- `导入后纳入当前 release candidate`
- `导入后直接发布五刊 current`

推荐用法：

1. 先用 `auto`
2. auto 失败时再改成：
   - `single_issue_batch`
   - `multi_release_pack`
   - `generic_split_release`

上传后后台会：

- 先把文件落到 `ops/intake/inbox/`
- 调用 `scripts/ops/intake-pack.mjs`
- 生成 intake manifest
- 更新 publication / issue / scenario registry
- 可选归档原始 zip
- 如勾选替代，则先备份旧 issue / scenario bundle，再替换；失败自动回滚
- 如后续要让已安装客户端自动看到这批新内容，下一步应继续做 `publish_channel`，而不是停在 local current

如果你是在修旧上传：

1. 填 `publication_id`
2. 填 `issue_label`
3. 勾 `替代现有期次`

不要先去手删旧 issue。现在后台已经把“备份后替代”做成正式入口，默认不允许无提示覆盖。

如果门禁失败，返回里会带：

- `package_level_blockers`
- `blocked_records`
- `blocked_record_count`

这时应该回到内容包本身修正，而不是继续尝试发布。

### Quality

用于查看：

- release candidate readiness
- mixed preview readiness
- taxonomy regression
- accepted warning 数量

如果你刚改过 taxonomy、override 或 scenario membership，这里是第一批要回看的地方。

### Scenarios

用于查看：

- scenario catalog
- 当前 dashboard candidate
- promotion decision

适合判断某个 scenario 当前是 preview、candidate 还是已退役。

### Release

用于查看：

- 当前 manifest 对应的 scenario
- dev / staging / production channel 当前 release
- 当前 runtime source
- `remote_base_url`
- runtime dist verify 状态
- dev dist 当前导出的 release
- publish history

这里也要重点确认两件事：

- `current_mirror` 是否已经指到四刊 `data2_multi_publication_release_candidate`
- 三刊 `data1c_three_release_mixed_preview` 是否只在需要对照时才被显式切换

如果你正在排查“app 到底读的是本地还是 remote-like source”，优先看这里。

### 让已安装客户端看到新内容

当 app 已经配置成 `hybrid` 或 `remote` 且远端地址可达后，运营的最短路径应是：

1. `ZIP Intake` 导入新刊 / 新 issue
2. `Scenario Membership` 确认它已进入 candidate
3. `Actions -> publish_channel`，目标 channel 设为 app 当前所读 channel，并勾 `apply`
4. 查看 `Release` / `Runtime Dist` / `Observability`
5. 让客户端回前台或重开 app

这时不应该再要求用户重装 app；首页消息摘要应展示最新 publish batch / 更新内容。
即使 explicit inbox 为空，只要 release 里有新的 publish batch，内部发布版也应自动生成“哪本刊物更新了、同步了多少篇”的消息摘要。

### Observability

用于查看运行健康：

- source health
- 当前 runtime source
- recent runtime failures
- recent incidents
- taxonomy gap events

这里是日常排查入口，不需要先翻日志文件。

### Incidents

用于看近期事故摘要：

- incident 总数
- 最新 incident
- top content failure
- latest publish health
- recent incidents 列表

如果发布后发现内容异常，先看这个区块，再决定是否回滚。

### Editorial

这是 CRUD 结果总览，不是具体编辑表单。这里会显示：

- publication 数量
- issue 数量
- canonical sections 数量
- discovery bucket 数量
- 审计条目数
- recent CRUD changes

适合确认最近谁改了什么，或者某个修改是否真的写入成功。

### OPS5 Audit

用于看 CRUD 审计与联动刷新结果：

- 审计日志条数
- rebuild trigger 总数
- 最近涉及的 entity type

如果你改完 taxonomy / membership / override 后想确认有没有触发后续刷新，就看这里。

## CRUD 区说明

### Publications

支持：

- `create`
- `edit`
- `archive`
- `unarchive`
- `delete`

常用字段：

- `publication_id`
- `display_name`
- `status`
- `locale`
- `notes`

适用场景：

- 新增刊物元数据
- 更新展示名
- 将不再参与运营的刊物 archive
- 删除误导入或确认废弃且不再保留 source-of-truth 的刊物

不适用：

- 导入正文
- 批量导入外部内容

删除说明：

- `delete` 默认只允许删除没有关联 issue 的空刊物
- 若该刊物仍有关联 issue，必须显式勾选级联删除
- 级联删除会同时清理关联 `issue registry`、warning budget、accepted warning、override、taxonomy map 与刊物源目录
- `runtime/releases/` 下已生成的 immutable artifact 不会被直接改写

### Issues

支持：

- `create`
- `edit`
- `archive`
- `unarchive`

常用字段：

- `issue_id`
- `publication_id`
- `issue_label`
- `source_pack`
- `parser_profile`
- `notes`

适用场景：

- 新增期次记录
- 修正 parser profile 或 source pack
- 停用某个 issue

### Article Metadata

这里只改 metadata override，不改正文。

支持：

- `create`
- `edit`
- `delete`

常用字段：

- `publication_id`
- `issue_label`
- `article_id`
- `title`
- `section_label`
- `author`
- `canonical_url`
- `display_warning_suppression`
- `notes`

适用场景：

- 修标题
- 修栏目标签
- 修作者
- 暂时压制已接受 warning

不适用：

- 修改 article body
- 修改文章段落结构

### Taxonomy

支持：

- `create`
- `edit`
- `disable`

常用字段：

- `publication_id`
- `raw_label`
- `canonical_section_key`
- `canonical_section_label`
- `discovery_bucket_key`
- `discovery_bucket_label`
- `mapping_kind`

适用场景：

- 将 raw section 映射到 canonical section
- 修 discovery bucket
- 关闭错误映射

改完后通常要回看：

- `Quality`
- `Observability`
- `OPS5 Audit`

### Scenario Membership

支持：

- `edit`
- `include`
- `exclude`
- `rebuild`

适用场景：

- 调整 issue 是否进入 candidate
- 标记 preview-only
- 标记 release-candidate eligible
- 手动触发 candidate rebuild

注意：

- 这里管理的是 scenario 构成，不是 release artifact 本身
- 不要把 preview-only 内容误当 production 可发布内容

## 推荐操作流程

### 新增刊物

1. 进入 `Publications`
2. 选择 `create`
3. 填写 `publication_id`、`display_name`、`status`、`locale`
4. 提交后查看 `Editorial` 与 `OPS5 Audit`

### 新增期次

1. 进入 `Issues`
2. 选择 `create`
3. 填写 `issue_id`、`publication_id`、`issue_label`
4. 如已知，补充 `source_pack` 与 `parser_profile`
5. 提交后查看 `Content` 与 `Editorial`

### 修文章元数据

1. 进入 `Article Metadata`
2. 输入 `publication_id`、`issue_label`、`article_id`
3. 选择 `edit` 或 `create`
4. 仅修改 metadata 字段
5. 提交后查看 `Quality`、`Editorial`、`OPS5 Audit`

### 修 taxonomy 映射

1. 进入 `Taxonomy`
2. 定位 `publication_id` 和 `raw_label`
3. 填写 canonical section 与 discovery bucket
4. 提交后回看 `Quality` 与 `Observability`

### 调整 candidate 构成

1. 进入 `Scenario Membership`
2. 执行 `include` 或 `exclude`
3. 如需要，点击 `rebuild`
4. 回看 `Scenarios`、`Quality`、`Release`

## 风险提示

- `apply_publish`、`rollback`、`retire` 属于高风险动作。
- CRUD 成功不等于 candidate 一定仍可发布，改完后仍要看 readiness / quality。
- `remote_channel_head` 相关动作只影响 runtime source 读取方式，不等于重新发布内容。
- baseline scenario 必须保留，不应被静默覆盖。

## 排查建议

遇到问题时，建议按这个顺序看：

1. `Overview`
2. `Release`
3. `Observability`
4. `Incidents`
5. `Editorial`
6. `OPS5 Audit`

常见判断方式：

- 内容没出来：先看 `runtime_source`、`runtime_target`、`Incidents`
- 改了 taxonomy 没生效：看 `OPS5 Audit` 和 `Quality`
- 改了 membership 后 candidate 状态异常：看 `Scenarios` 和 `Release`
- remote-like source 读取异常：看 `Release` 里的 `dist_verify` 与 `remote_base_url`
- 刊物来源顺序不符合预期：先看当前 runtime 是否已切到四刊，再看 feed 是否按 runtime 可见刊物和当前阅读/更新信号排序

## 相关文件

- [start-operator-console.mjs](/D:/ws/Playground/scripts/ops/start-operator-console.mjs)
- [intake-pack.mjs](/D:/ws/Playground/scripts/ops/intake-pack.mjs)
- [index.html](/D:/ws/Playground/ops/console/index.html)
- [app.js](/D:/ws/Playground/ops/console/app.js)
- [ADD_NEW_MAGAZINE_RUNBOOK.md](/D:/ws/Playground/docs/ADD_NEW_MAGAZINE_RUNBOOK.md)
- [STAGE_OPS4_CONSOLE_SCOPE.md](/D:/ws/Playground/docs/STAGE_OPS4_CONSOLE_SCOPE.md)
- [STAGE_OPS4_UI_MAP.md](/D:/ws/Playground/docs/STAGE_OPS4_UI_MAP.md)
- [STAGE_OPS5_DECISIONS.md](/D:/ws/Playground/docs/STAGE_OPS5_DECISIONS.md)
- [STAGE_OPS5_CRUD_SCOPE.md](/D:/ws/Playground/docs/STAGE_OPS5_CRUD_SCOPE.md)
- [STAGE_REL2_RUNTIME_FETCH_MODEL.md](/D:/ws/Playground/docs/STAGE_REL2_RUNTIME_FETCH_MODEL.md)
