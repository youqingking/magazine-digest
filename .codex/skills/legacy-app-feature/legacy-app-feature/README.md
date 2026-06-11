# legacy-app-feature skill

## 用途

这是一个面向 Codex 桌面版 / 旧项目 App 功能开发的轻量路由 skill。

它解决的问题是：

```text
人类不想每次写长提示词，只想说：新增/修改/删除什么 App 功能。
```

安装后，人类可以只输入：

```text
新增 App 功能：文章收藏
```

或：

```text
删除 App 功能：会员推广弹窗
```

Codex 应该自动判断：

- 是否先使用 `codemap` 建图。
- 是新增、修改、删除、修复还是验证。
- 风险等级是 Low / Medium / High。
- 使用 `sdd-riper-one-light` 还是升级到 `sdd-riper-one`。
- 是否需要 `new-chat-ready` 做交接。
- 改代码前是否需要 checkpoint。
- 完成后如何验证和回写。

## 安装方式

把整个目录放到项目的 skills 目录中，例如：

```text
.codex/skills/legacy-app-feature/SKILL.md
```

或：

```text
skills/legacy-app-feature/SKILL.md
```

实际路径取决于你的 Codex / skill 安装规范。

## 推荐配套 skill

建议同时安装：

```text
codemap
sdd-riper-one-light
sdd-riper-one
new-chat-ready
```

`legacy-app-feature` 不是替代它们，而是负责路由。

## 最小使用方式

人类输入：

```text
新增 App 功能：xxx
修改 App 功能：xxx，从 A 改成 B
删除 App 功能：xxx
修复 App 问题：xxx
验证上一轮
继续
按推荐下一步继续
```

不要再每次复制长提示词。

## 适用项目

适合这些场景：

- 旧 App 项目很乱。
- 新旧技术栈并存。
- App、后台、API、数据库、mock、fixture 混在一起。
- 人类只想给目标，不想拆工程步骤。
- 需要通过 Codex 增删改 App 功能，但希望控制风险。

## 重要原则

```text
人类只说做什么。
Codex 负责判断怎么做。
```

但如果涉及高风险项，例如支付、订阅、认证、推送、权限、数据库迁移、生产配置、不可逆删除，必须暂停并升级流程。

## 版本

当前版本：`0.1.0`
