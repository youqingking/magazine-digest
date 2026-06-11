# legacy-app-feature 使用示例

## 示例 1：新增普通功能

人类输入：

```text
新增 App 功能：文章收藏
```

期望 Codex 行为：

```text
任务类型：add_feature
风险等级：Medium
路线：先 codemap，再 sdd-riper-one-light
本轮：只读建图，不修改代码
```

## 示例 2：修改已有功能

人类输入：

```text
修改 App 功能：阅读详情页字体大小设置，从固定字号改为用户可调
```

期望 Codex 行为：

```text
任务类型：modify_feature
风险等级：Medium
路线：先映射当前阅读详情链路，再产出 micro-spec
重点：不要重构无关阅读页逻辑
```

## 示例 3：删除功能

人类输入：

```text
删除 App 功能：首页会员推广弹窗
```

期望 Codex 行为：

```text
任务类型：delete_feature
风险等级：Medium 或 High
路线：必须先做 deletion impact map
检查：入口、组件、配置、后台、埋点、实验、测试
```

## 示例 4：高风险功能

人类输入：

```text
新增 App 功能：订阅会员购买页，接入真实支付
```

期望 Codex 行为：

```text
任务类型：add_feature
风险等级：High
路线：先 codemap，然后升级 sdd-riper-one
暂停原因：涉及支付/订阅/生产配置风险
```

## 示例 5：继续上一轮

人类输入：

```text
按建议继续
```

期望 Codex 行为：

```text
任务类型：continue_previous
路线：读取上一轮完成报告和推荐下一步
若上下文不足：使用 new-chat-ready 或要求恢复上下文
```
