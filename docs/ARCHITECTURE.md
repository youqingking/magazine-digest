# 架构说明

## 1. 架构原则

- 只建设应用治理层，不建设内容生产流水线。
- 优先复用 `uni-starter v2`、`uni-admin`、`uniCloud` 官方能力与 `schema2code`。
- 配置中心化，参数动态化，禁止把活动和风控阈值写死在代码里。
- 所有租户化/产品矩阵复用点统一以 `product_key` 建模。

## 2. 系统边界

### In Scope

- App 客户端壳层
- Web 管理后台
- uniCloud 云对象 / 云函数 / 数据集合
- schema2code 生成的数据结构和管理端基础能力
- 配置、实验、券码、裂变、防刷、Push、埋点、缓存

### Out of Scope

- PDF 解析
- 网页抓取
- Prompt 构造
- Markdown 生成
- 内容生产调度

## 3. 逻辑分层

### 3.1 Client Shell

- `阅读容器层`：承载 30 秒 / 3 分钟模式切换。
- `内容适配层`：按 `audience_segment` 选择 adult / teen 版本。
- `配置消费层`：拉取动态配置、实验分桶、Push 落地路由。
- `缓存层`：本地缓存最近阅读内容、配置快照、实验结果。
- `埋点层`：统一事件上报，离线队列补发。

### 3.2 Admin

- 内容元数据管理
- 配置发布与回滚
- 实验编排与结果查看
- 券码/代金券/兑换码运营
- 裂变任务与风控规则管理
- 审计日志

### 3.3 Cloud

- `content_catalog`：内容索引，不存生产逻辑。
- `content_variant`：双模式、双人群内容变体。
- `runtime_config`：动态运营配置。
- `ab_experiment` / `ab_bucket_assignment`
- `coupon_template` / `coupon_instance` / `redeem_code`
- `referral_task` / `risk_rule` / `risk_event`
- `analytics_event`
- `push_campaign`

## 4. 关键设计

### 4.1 product_key

- 所有业务主表、索引表、事件表必须有 `product_key`。
- 管理后台查询默认带 `product_key` 过滤。
- 配置下发优先级：`product_key + environment + channel`。

### 4.2 内容模型

- 内容由外部流水线产出后进入仓库外系统。
- 本仓库只接收标准化内容元数据和正文。
- 每篇内容至少支持四个变体：
  - `adult_short`
  - `adult_long`
  - `teen_short`
  - `teen_long`

### 4.3 动态配置

- 采用服务端配置下发，本地只保留默认兜底占位。
- 配置变更要求版本号、灰度范围、审计记录。
- 配置项包括：
  - 阅读模式默认值
  - 首页运营位
  - 活动入口开关
  - Push 节流参数
  - 风控阈值
  - 实验开关

### 4.4 埋点与 A/B

- 埋点事件必须包含：
  - `product_key`
  - `user_id/device_id`
  - `session_id`
  - `content_id`
  - `variant_key`
  - `experiment_bucket`
  - `network_state`
- A/B 分桶结果可缓存，需支持刷新策略与失效时间。

### 4.5 防刷与券码

- 裂变、兑换、领券链路统一走风险评估。
- 风控规则动态化，不写死阈值。
- 关键动作记录设备、账号、IP、指纹摘要、时间窗。

### 4.6 Push 与离线

- Push 只负责唤起，不承载业务状态。
- 最近内容和关键配置支持断网可读。
- 离线状态下优先展示缓存快照，并标记时间戳。

## 5. 推荐仓库结构

```text
docs/
fixtures/
scripts/harness/
src/                # 后续客户端
admin/              # 后续后台
uniCloud/           # 后续云端
schema/             # 后续 schema2code
```

## 6. 交付阶段建议

1. Stage A: 治理文档、Harness、夹具。
2. Stage B: schema 定义与 codegen 基础。
3. Stage C: uniCloud 数据层与后台模板集成。
4. Stage D: 客户端壳层、缓存、埋点、Push 接线。
5. Stage E: 裂变、券码、风控联调。
