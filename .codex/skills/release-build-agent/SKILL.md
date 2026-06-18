---
name: release-build-agent
description: 证明 app 发布前核心工程门禁。Use when Codex needs to run existing project commands and prove whether build, typecheck, smoke, and preflight pass, with parsed command evidence and fail-closed blocking when proof is missing.
---

# release-build-agent

## 概览

这个 skill 用来证明 app 发布前核心工程门禁。它只回答一个问题：当前 app 项目能否用仓库已有命令真实证明 `build`、`typecheck`、`smoke`、`preflight` 通过。

核心原则：

- 只使用项目已经实现的命令，优先读取 `README.md`、根 `package.json`、移动端 `package.json` 等证据。
- 不新增、不猜测、不临时发明 npm scripts。
- 命令必须真实执行；不能把“发现了命令”写成通过。
- 解析命令输出里的 JSON / 结构化字段；不能只看 shell exit code。
- 没有真实通过证据时写 `blocked`、`fail`、`script_missing` 或 `not_run`。
- 如果本地 HBuilderX、ADB 或 Android 模拟器可用，先自动调用它们准备执行环境，再运行需要这些工具的 gate。

## 使用脚本

优先运行 skill 同目录脚本：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root .
```

默认输出到：

```text
play-store-launch/reports/release-build-agent.zh.md
play-store-launch/reports/release-build-agent-output.json
```

如果需要指定输出目录：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root . --output-dir play-store-launch/reports
```

只有在明确需要“只看计划、不执行命令”时才使用：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root . --no-execute
```

`--no-execute` 的结果不能作为发布证明。

如果需要禁用本地工具自动准备：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root . --no-tool-bootstrap
```

如果本机有多个 Android AVD，可指定：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root . --emulator-avd FactLock_API_35
```

长耗时 smoke 应设置整轮预算，预算耗尽也必须生成报告：

```powershell
python .codex/skills/release-build-agent/scripts/release_gate.py --root . --max-total-seconds 240
```

## 判定方式

脚本会发现并执行四个核心 gate：

- `build`：优先移动端 / Android / Expo / uni-app / HBuilderX 相关构建脚本，例如项目已有的 `build:mobile`。
- `typecheck`：只接受项目已有的 `typecheck`、`check:types`、`types:check`、`tsc` 等脚本。
- `smoke`：优先 README 中移动端、Android、H5、HBuilderX、Expo、React Native、uni-app 相关 smoke 脚本；没有移动端专用脚本时才回退到通用 `smoke`。
- `preflight`：执行项目已有的 `preflight`、`validate:preflight`、`release:preflight` 等脚本。

每条命令都要保留：

- 本地工具准备结果，限 HBuilderX / ADB / Android 模拟器等与 gate 执行直接相关的工具。
- 命令来源文件。
- 脚本名和脚本内容。
- 实际执行命令。
- exit code。
- stdout / stderr 摘要。
- 已解析的 JSON 输出。
- 语义判定原因。
- 失败后人类需要做什么、需要提供什么信息，以及修复后要重跑的命令。

如果脚本 exit code 为 0，但结构化输出包含 `status=blocked`、`passed=false`、`compile_success=false`、`compile_readiness_passed=false`、`real_compile_attempted=false`、`mobile_status=null` 等失败信号，必须判为未通过。

## 安全边界

- 不调用 Google Play API。
- 不运行 `eas submit`、track rollout、发布上传或任何提交动作。
- 不新增、读取或写入真实 keystore、service account、Play Console 凭据或其他生产密钥。
- 不修改 app 源码、生产配置、迁移文件或 fixture 数据。
- 不把缺失证据改写成 ready。

## 输出要求

中文报告必须包含：

- 总状态。
- 本地工具准备结果。
- 工程门禁矩阵。
- 命令执行证据。
- 诊断与修复计划，说明失败类型、直接原因、需要人类做什么、需要提供什么信息、修改位置和重跑命令。
- Gate 阻塞项和解除方式。
- 总结。

机器报告必须包含：

- `schema_version`
- `proof_mode`
- `overall_status`
- `environment_preparation`
- `command_gates`
- `gate_blockers`
