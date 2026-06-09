# 新增杂志操作说明书

## 适用范围

这份说明书面向本地 operator / editor，说明如何在当前仓库里新增一本文杂志，目标是尽量接近：

- 打开后台
- 上传 zip
- 导入完成
- 在后台继续做 publication / issue / scenario 管理

它不是全文 CMS 操作说明，也不覆盖 parser 开发本身。

## 先说结论

当前最方便的路径已经支持：

1. 启动 operator console
2. 进入 `ZIP Intake`
3. 上传 zip
4. 等待 intake 完成
5. 去 `Publications` / `Issues` / `Scenario Membership` 检查并补充元数据

如果 zip 结构属于当前已支持的导入类型，这一步不需要手改 json。

## 旧上传有问题时怎么做

结论：

- 不建议先手删旧 issue
- 默认也不允许静默覆盖旧 issue
- 正确做法是勾选 `替代现有期次`

原因：

- 先删再传会带来短时间空窗，也更容易把 registry / scenario / 审计链弄断
- 直接盲覆盖又太危险，运营很容易把错包盖到旧期次上

现在后台的策略是：

1. 如果你上传的目标 `publication_id + issue_label` 已存在，且没有勾选 `替代现有期次`
2. 系统会直接阻断，并返回保护性错误
3. 如果你勾选了 `替代现有期次`
4. 系统会先备份旧 issue 与相关 scenario bundle，再做替换
5. 替换失败时自动回滚，不会把旧内容删坏

## 当前支持的 zip 形态

### 形态 A：单个 zip 对应单本杂志 / 单个 issue

常见特征：

- zip 内是单刊内容
- 通常能看到一组 markdown 文件
- 可能包含 audience 文件，例如 `_adult.md`

后台 route hint 对应：

- `single_issue_batch`

当前已知样例：

- `Reader's Digest-12112025.zip`

### 形态 B：单个 zip 内含多个 release 目录

常见特征：

- zip 内有多个 `*-release/` 目录
- 一个 zip 内可以同时带多本杂志

后台 route hint 对应：

- `multi_release_pack`

当前已知样例：

- `Three-release.zip`

### 形态 C：单个 zip 内含 `public_release/adult + youth + merged`

常见特征：

- `public_release/adult/*.md`
- `public_release/youth/*.md`
- `public_release/merged/adult_merged.md`
- `public_release/merged/youth_merged.md`

后台 route hint 对应：

- `generic_split_release`

当前已知样例：

- `Science.zip`

### auto 识别

后台默认先走 `auto`：

- 先看文件名
- 再看 zip 内目录结构
- 能识别时自动落到正确 importer

如果 `auto` 识别失败，再手动选择 route hint。

## 操作步骤

### 1. 启动后台

在仓库根目录运行：

```powershell
node scripts/ops/start-operator-console.mjs
```

默认地址：

- [http://127.0.0.1:4174](http://127.0.0.1:4174)

### 2. 进入 ZIP Intake

后台首页新增了 `ZIP Intake` 区块。

这里有 4 个关键输入：

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

建议默认值：

- `Route Hint = auto`
- metadata 字段先留空，除非你要强制指定
- `Free Quota Limit = 8`
- `归档原始 zip = 勾选`
- 如果是修旧上传，必须同时填写 `publication_id + issue_label`，再勾 `替代现有期次`
- 只有在你确认内容已经可以进入当前版本时，才勾选“纳入 current / 发布 current”

### 3. 上传 zip 并导入

点击：

- `Upload ZIP and Intake`

后台会做这些事：

1. 先把 zip 落到 `ops/intake/inbox/`
2. 调用 `scripts/ops/intake-pack.mjs`
3. 生成 intake manifest
4. 更新 publication / issue / scenario registry
5. 如勾选归档，则把原始 zip 归档到 `ops/intake/archive/`
6. 如勾选 post-action，则继续自动执行：
   - include 到 `data2_multi_publication_release_candidate`
   - promote apply 到 `current_mirror`

### 3A. intake 会先做内容门禁

现在上传 zip 后不会直接导入，而是先做硬门禁检查。

以下情况会直接阻止导入：

- 标题缺失或是占位值
- `summary` 缺失或明显过短
- 只有成人版或只有青少年版
- 只有短版或只有长版
- adult / youth 标题不一致
- merged 标题与正文标题不一致
- `article_id` 重复
- `summary` 与 `quick_30s` 前缀不一致，疑似摘要/正文串位

只要命中 blocker，就不会进入 registry，也不会被纳入 candidate。

详见：

- [CONTENT_PACKAGE_GATE_POLICY.md](/D:/ws/Playground/docs/CONTENT_PACKAGE_GATE_POLICY.md)

如果你没有手填 metadata，系统会尽量自动推导：

- `publication_id`：优先从原始文件名推导
- `display_name`：优先从原始文件名推导
- `issue_label`：优先取文件名里的日期，否则退回当天 `YYYYMMDD`

### 4. 检查导入结果

导入成功后，先看：

- `ZIP Intake` 返回结果
- `Editorial`
- `OPS5 Audit`
- `Content`
- `Scenarios`

重点确认：

- 是否新增了目标 `publication`
- 是否新增了目标 `issue`
- 是否生成了对应 `scenario`
- 是否有 warning / parser routing 异常

### 5. 补充运营层管理

导入完成后，通常还需要继续做这些事：

- 在 `Publications` 中补 `display_name / locale / status / notes`
- 在 `Issues` 中确认 `source_pack / parser_profile`
- 在 `Taxonomy` 中修正 raw section -> canonical section
- 在 `Article Metadata` 中补 override
- 在 `Scenario Membership` 中把新 issue 纳入或排除 candidate

## 成功后的 source of truth

新增杂志成功后，真正被后台管理的是这些规范化结果：

- `data/real-content/publications.json`
- `data/real-content/issues.json`
- `mobile/fixtures/runtime/scenarios/index.json`
- `ops/intake/manifests/*.json`

不是继续直接管理 zip 目录本身。

## 什么时候需要手动指定 Route Hint

在这些场景建议手动指定：

- zip 文件名不规范
- 同一个 zip 结构比较特殊，auto 无法稳定判断
- 你明确知道它是单刊包还是多刊包

推荐规则：

- 单刊 / 单 issue zip：`single_issue_batch`
- 多个 release 目录 zip：`multi_release_pack`
- `public_release/adult+youth+merged`：`generic_split_release`

## 导入失败时先看什么

### 常见失败 1：`OPS1_UNSUPPORTED_PACK`

说明：

- auto 无法判断导入路由
- 或这个 zip 不符合当前 importer 预期

先做：

1. 重新上传
2. 手动改 `Route Hint`
3. 再试一次

### 常见失败 2：导入成功，但没有新刊物/期次

先看：

- `ZIP Intake` 返回的 `generated_scenarios`
- `Content`
- `Editorial`
- `OPS5 Audit`

如果 registry 没有变化，说明 importer 可能没有真正识别到内容。

### 常见失败 2A：返回 `status=blocked`

这表示 zip 已上传，但内容门禁没有通过。

重点看返回里的：

- `package_level_blockers`
- `blocked_records`
- `blocker_count`

这不是后台故障，而是内容包本身不达标。

### 常见失败 3：导入后文章能进 registry，但首页看不到

先看：

- `Scenario Membership`
- `Quality`
- `Release`
- `Observability`

因为导入成功不等于已经进 current / candidate / channel。

## 让已安装客户端自动看到新杂志

如果你的内部客户端已经是支持 remote bridge 的版本，那么“导入成功”之后，不应该再靠重装 app 来让用户看到新内容。

正确步骤是：

1. 上传 zip 并完成 intake
2. 确认新 issue 已进入 candidate
3. 通过后台 `Actions -> publish_channel` 把 candidate 发布到客户端正在读取的 channel
4. 后台会自动刷新 `runtime dist`
5. 用户下次启动或回前台时，app 自动拉到新内容

这一步成立的前提是：

- 手机设置里已经保存了可达的 `remote base url`
- runtime mode 已切到 `hybrid` 或 `remote`
- 远端静态托管 / 对象存储 / 局域网 dist 地址当前可访问

如果用户手里的是老包，包里没有 remote bridge 配置入口，那么这一次允许补最后一次内部包；但之后新增杂志与内容发布都应尽量走上面的后台路径。

## 明确不做的事

这条链路不做：

- 直接编辑正文 rich text
- 直接编辑 immutable release artifact
- 在后台里重写 parser
- 绕过 TEST2 锁和原子写

## 何时需要 NEED_HUMAN

以下情况仍属于人工介入范围：

- 新杂志 zip 结构与当前 importer / parser profile 都不兼容
- 需要新增 parser profile
- 需要补 publication-specific taxonomy 规则
- 导入后 warning / quality 明显异常，需要内容侧判断

## 相关入口

- [scripts/ops/start-operator-console.mjs](/D:/ws/Playground/scripts/ops/start-operator-console.mjs)
- [scripts/ops/intake-pack.mjs](/D:/ws/Playground/scripts/ops/intake-pack.mjs)
- [ops/console/index.html](/D:/ws/Playground/ops/console/index.html)
- [ops/console/app.js](/D:/ws/Playground/ops/console/app.js)
- [OPERATOR_CONSOLE_GUIDE.md](/D:/ws/Playground/docs/OPERATOR_CONSOLE_GUIDE.md)
