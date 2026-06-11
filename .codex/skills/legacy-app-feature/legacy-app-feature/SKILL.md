---
name: legacy-app-feature
description: 面向旧项目 App 功能增删改的一句话入口路由 skill。根据用户的简单需求自动判断任务类型、风险等级，并路由到 codemap、sdd-riper-one-light、sdd-riper-one 或 new-chat-ready。
version: 0.1.0
---

# legacy-app-feature

## 定位

`legacy-app-feature` 是一个**轻量路由 skill**，用于让人类只输入“要做什么 App 功能”，由 Codex 自动决定“怎么做”。

它不替代 `codemap`、`sdd-riper-one-light`、`sdd-riper-one`、`new-chat-ready`，而是在旧项目 App 功能开发中负责把一句话需求路由到正确流程。

核心原则：

```text
人类只说 WHAT：新增/修改/删除/修复/验证什么 App 功能
Codex 负责 HOW：是否建图、怎么拆、改哪里、怎么验证、何时暂停
```

## 触发场景

当用户输入类似下面内容时，使用本 skill：

- 新增 App 功能：xxx
- 修改 App 功能：xxx，从 A 改成 B
- 删除 App 功能：xxx
- 修复 App 问题：xxx
- 验证上一轮 App 功能
- 继续
- 按推荐下一步继续
- 旧项目中增加/修改/删除某个移动端、小程序、React Native、Expo、uni-app、H5、后台联动 App 功能

不要要求用户每次复制长提示词。用户只需要说明要做什么。

## 依赖关系

推荐与以下 skill 配合使用：

- `codemap`：用于旧项目理解、入口定位、影响面地图、删除影响图。
- `sdd-riper-one-light`：用于日常增删改任务的 micro-spec、Done Contract、checkpoint、验证和回写。
- `sdd-riper-one`：用于高风险任务的严格流程。
- `new-chat-ready`：用于长任务交接、换 chat、恢复上下文。

如果这些 skill 未安装，则按本文件中的降级规则执行：先只读分析，再产出最小计划和验证方案，不要贸然改代码。

## 总体流程

```text
一句话需求
  ↓
识别任务类型
  ↓
判断风险等级
  ↓
决定是否先 codemap
  ↓
选择 sdd-riper-one-light 或 sdd-riper-one
  ↓
产出 checkpoint / micro-spec / Done Contract
  ↓
按批准或项目规则执行
  ↓
验证
  ↓
回写结果和推荐下一步
```

## 任务分类

先把用户请求分类为以下一种：

- `add_feature`：新增 App 功能。
- `modify_feature`：修改已有 App 功能或行为。
- `delete_feature`：删除 App 功能、入口、页面、弹窗、菜单或业务流程。
- `bugfix`：修复 App 问题、报错、交互异常、数据异常。
- `validation`：验证上一轮或已有功能。
- `continue_previous`：继续上一轮或按推荐下一步继续。
- `unclear`：目标不清，无法判断要改什么。

仅当无法确定“要做什么功能”时才向用户提一个必要问题。不要因为缺少实现细节就反复追问；实现细节应由 Codex 读项目和建图后补全。

## 风险等级

### Low / 低风险

典型情况：

- 文案、样式、简单展示逻辑。
- 单页面局部调整。
- 不涉及 API、数据库、登录、支付、推送、权限、后台。
- 不删除功能。

处理方式：可使用 `sdd-riper-one-light`，必要时可跳过 codemap，但仍需给出最小验证。

### Medium / 中风险

典型情况：

- 新增普通 App 页面或功能。
- 修改已有交互行为。
- 涉及状态、缓存、fixture、mock、service、路由。
- 影响多个 App 文件，但不碰生产配置和不可逆数据。

处理方式：通常先使用 `codemap` 生成 feature-level map，再使用 `sdd-riper-one-light`。

### High / 高风险

只要涉及以下任一项，即视为高风险：

- 登录、认证、权限、RLS、安全策略。
- 支付、订阅、RevenueCat、会员权益。
- 推送、消息、通知 topic、设备 token。
- 数据库 schema、迁移、历史数据兼容。
- 后台管理、API 契约、跨项目协议。
- 生产环境配置、密钥、证书、发布配置。
- 删除核心功能或不可逆删除。
- 大范围重构或跨技术栈迁移。

处理方式：先只读建图；然后升级到 `sdd-riper-one`；执行前必须有明确 checkpoint 和人类确认。

## codemap 路由规则

以下情况必须优先使用 `codemap` 或按 codemap 思路进行只读建图：

- 旧项目、陌生项目、目录结构混乱。
- App 入口不清楚。
- 新旧 App 技术栈并存，例如 Expo / React Native / uni-app / H5 / 小程序 / 后台同时存在。
- 修改已有功能。
- 删除任何用户可见功能。
- 功能可能涉及 API、后台、数据库、权限、支付、推送、埋点、缓存、fixture、mock。
- 上一份 CodeMap 可能过期，需要 drift-check 或 update-existing。

### 新增功能时

生成 feature-level CodeMap，重点找：

- 目标 App 目录和真实入口。
- 是否已有相似功能或旧实现。
- 页面、路由、组件、状态、service、API、fixture、mock。
- 后台/API/数据库/权限/支付/推送是否相关。
- 最小实现切片。
- 验证入口。

### 修改功能时

先映射现有行为链路：

- 用户入口。
- UI → 状态 → service/API → 数据 → 后台/配置。
- 旧行为在哪里实现。
- 哪些引用是真依赖，哪些可能是历史残留。
- 修改最小范围和回归风险。

### 删除功能时

删除必须先做 deletion impact map，至少检查：

- 路由、菜单、tab、按钮、弹窗、页面入口。
- 组件、hooks、store、service、API。
- backend/admin/config/database/fixture/mock。
- 权限、支付、订阅、推送、埋点、缓存。
- 测试、文档、构建配置。
- 必须保留的兼容层和回滚方式。

## 执行路由规则

### 使用 sdd-riper-one-light

适用：普通 App 功能新增、修改、小范围 bugfix、验证任务。

要求输出：

- 任务理解。
- 本轮核心目标。
- micro-spec。
- Done Contract。
- 计划修改区域。
- 非目标。
- 风险。
- 验证方式。

### 使用 sdd-riper-one

适用：高风险任务。

触发后要明确说明升级原因，例如：

```text
需要升级到 sdd-riper-one，原因：该任务涉及支付/订阅权益和后台 API 契约，属于高风险跨模块变更。
```

### 使用 new-chat-ready

适用：

- 当前上下文过长。
- 任务跨多轮、需要换 chat。
- 用户要求继续上一个任务，但当前上下文不足。
- 已有长任务需要交接。

## 旧项目 App 默认边界

除非项目证据证明不是这样，否则默认遵守：

- 旧 App 目录默认是迁移参考，不是新增功能的默认实现目标。
- 新功能默认落在当前目标 App 目录。
- 不重构无关模块。
- 不修改生产密钥、证书、支付生产配置、发布配置。
- 不接真实支付、真实推送、真实后端，除非用户明确要求或项目 spec 已说明。
- 后端未准备好时，第一阶段可以采用 fixture/local/mock seam，但必须标明限制。
- 任何涉及线上数据、权限、支付、推送、发布的操作，都必须进入高风险流程。

如果仓库中存在明确的 `AGENTS.md`、项目 profile、validation matrix 或 README 规则，以项目规则优先；本 skill 只提供默认路由。

## 第一响应格式

当用户输入一句功能需求后，第一响应应简短，不要展开全部协议。

推荐格式：

```text
我将按 legacy-app-feature 流程处理。

任务理解：...
任务类型：add_feature / modify_feature / delete_feature / bugfix / validation / continue_previous
风险等级：Low / Medium / High
选择路线：...
本轮动作：只读建图 / 生成 micro-spec / 直接小改并验证 / 升级高风险流程
下一检查点：...
```

如果需要先建图，明确写：

```text
本轮先只读建图，不修改业务代码。
```

如果可以进入执行，也要写清：

```text
我会先形成最小 Done Contract，再按项目规则执行并给出验证证据。
```

## checkpoint 输出格式

执行前，至少输出：

```text
## Micro-spec
- 目标：
- 用户可见行为：
- 数据/状态行为：
- 边界：
- 非目标：

## Done Contract
- [ ] ...
- [ ] ...
- [ ] 验证通过或明确 manual gate

## 计划修改区域
- ...

## 验证计划
- 自动验证：...
- 手动验证：...

## 风险与暂停条件
- ...
```

## 什么时候暂停

出现以下情况必须暂停并说明原因：

- 不知道真实目标 App 目录。
- 发现同名功能在多个技术栈中并存，且无法判断当前目标。
- 需要生产密钥、证书、支付、推送、云环境权限。
- 需要数据库迁移或 RLS 策略。
- 删除影响面超出 App 前端。
- 验证命令缺失或无法运行。
- 用户需求和项目边界冲突。

暂停时只问一个最必要的问题，或者给出推荐默认选择。

## 完成报告格式

完成后输出：

```text
## 完成情况
- 已完成：
- 未完成/限制：

## 修改文件
- ...

## 验证证据
- 命令：...
- 结果：通过/失败/未运行
- 失败原因或 manual gate：...

## 风险残留
- ...

## 推荐下一步
1. 最稳妥下一步：...
2. 风险最高但必要的下一步：...
3. 可延后的下一步：...

建议选择：...
```

用户之后可以只输入：

```text
继续 1
```

或：

```text
按建议继续
```

## 输出风格

- 中文为主，必要英文术语保留，例如 `codemap`、`micro-spec`、`Done Contract`、`fixture`、`mock`。
- 不要向用户倾倒完整协议，除非用户要求。
- 不要让用户反复写长提示词。
- 不要在没有证据时宣称完成。
- 不要因为信息不完整就停止；优先读项目、建图、做最佳努力。
- 只在真正阻塞时问一个问题。

## 示例

用户：

```text
新增 App 功能：文章收藏
```

期望响应：

```text
我将按 legacy-app-feature 流程处理。

任务理解：为 App 增加文章收藏/取消收藏能力，并让用户能看到收藏结果。
任务类型：add_feature
风险等级：Medium
选择路线：先使用 codemap 做 feature-level 功能地图，再用 sdd-riper-one-light 产出 micro-spec 和 Done Contract。
本轮动作：只读建图，不修改业务代码。
下一检查点：输出收藏功能入口、影响面、最小实现切片和验证入口。
```
