# Stage TEST1 Decisions

## Scope

- 为现有多 parser、多 scenario、override 合成后的真实内容系统建立确定性回归护栏。
- 测试覆盖 contract、parser golden、scenario lifecycle、app consumption 四层。
- 所有 TEST1 脚本串行执行，避免 Windows 文件锁导致的假失败。

## Guardrail Priorities

1. normalized article contract 不回退
2. parser profile 结构行为不回退
3. selected / publish / rollback / retire 生命周期不回退
4. baseline 与 mixed scenario 的 app 消费链路不回退

## Non-goals

- 不做 GUI-first 自动化
- 不做截图快照平台
- 不重写现有 smoke
- 不新增后台或 admin
