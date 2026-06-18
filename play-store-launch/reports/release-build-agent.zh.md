# release-build-agent 工程门禁证明报告

生成时间：`2026-06-18T09:28:45Z`

## 总状态
- overall_status: `pass`
- 证明模式：`executed`

## 本地工具准备
- `hbuilderx`：`ready`；cli=`D:\HBuilderX\cli.exe`
- `android_emulator`：`ready`；adb=`C:\Users\Administrator\AppData\Local\Android\Sdk\platform-tools\adb.EXE`；emulator=`C:\Users\Administrator\AppData\Local\Android\Sdk\emulator\emulator.EXE`；serial=`emulator-5556`

## 工程门禁矩阵
| Gate | Status | 证明结论 |
| --- | --- | --- |
| `build` | `pass` | 已由真实执行的项目命令证明通过。 |
| `typecheck` | `pass` | 已由真实执行的项目命令证明通过。 |
| `preflight` | `pass` | 已由真实执行的项目命令证明通过。 |
| `smoke` | `pass` | 已由真实执行的项目命令证明通过。 |

## 命令执行证据
### `build`
- `build:mobile` / `pass` / exit=0 / 结构化输出 status=ok。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/bootstrap/build-mobile.ps1`；实际命令：`npm.cmd run build:mobile`
  - parsed: `{"classification": "real_compile_passed", "compile_success": true, "compile_readiness_passed": true, "real_compile_attempted": true}`
### `typecheck`
- `typecheck` / `pass` / exit=0 / 结构化输出 passed=true。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/validate/typecheck.ps1`；实际命令：`npm.cmd run typecheck`
  - parsed: `{"status": "ok", "passed": true}`
### `preflight`
- `preflight` / `pass` / exit=0 / 退出码和结构化输出未发现失败信号。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/harness/preflight.ps1`；实际命令：`npm.cmd run preflight`
- `validate:preflight` / `pass` / exit=0 / 结构化输出 passed=true。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/validate/preflight.ps1`；实际命令：`npm.cmd run validate:preflight`
  - parsed: `{"result": {"missing_count": 0, "passed": true}}`
### `smoke`
- `smoke:h0_5-hbuilderx` / `pass` / exit=0 / 结构化输出 status=ok。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-h0_5-hbuilderx.ps1`；实际命令：`npm.cmd run smoke:h0_5-hbuilderx`
  - parsed: `{"status": "ok", "blocking_reason": "", "layer": "hbuilderx_android_compile", "compile_succeeded": true}`
- `smoke:h0_5-android` / `pass` / exit=0 / 结构化输出 status=ok。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-h0_5-android.ps1`；实际命令：`npm.cmd run smoke:h0_5-android`
  - parsed: `{"status": "ok", "blocking_reason": "", "layer": "android_device_smoke", "connected_devices": ["emulator-5556"], "detected_packages": ["io.dcloud.HBuilder"], "package_name": "io.dcloud.HBuilder"}`
- `smoke:h0_5-android-ui` / `pass` / exit=0 / 结构化输出 status=ok。
  - 来源：`package.json`；脚本内容：`powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-h0_5-android-ui.ps1`；实际命令：`npm.cmd run smoke:h0_5-android-ui`
  - parsed: `{"status": "ok", "blocking_reason": "", "layer": "android_device_ui_smoke", "connected_devices": ["emulator-5556"], "detected_packages": ["io.dcloud.HBuilder"], "package_name": "io.dcloud.HBuilder", "automation_summary": "AUTOMATION_SUMMARY login=idle uid=none login_error=none session=signed_out token=token_missing device=precheck_blocked db=idle device_found=no user_device_found=no db_error=none", "ui_summary": {"has_auth_test_ready": true, "has_auto_login": true, "has_verify_device_records": true, "has_automation_summary": true, "automation_summary_matched": false, "ui_smoke_passed": true, "login_success": false, "db_verification_ok": false, "device_found": false, "user_device_found": false}, "diagnostic_summary": {"login_success": false, "db_verification_ok": false, "device_found": false, "user_device_found": false, "note": "auth_or_device_diagnostics_not_part_of_core_ui_smoke"}, "final_screenshot": "03-final-ui.png", "hbuilderx_stdout_tail": ["17:28:06.166 HBuilderX Version: 5.07", "17:28:06.789 项目 mobile 开始编译", "17:28:08.411 当前项目的uniCloud使用的默认服务空间spaceId为：mp-748a182a-e5ab-47e4-bec5-e1e93cc56732", "17:28:08.484 5.07", "17:28:08.487 请注意运行模式下，因日志输出、sourcemap以及未压缩源码等原因，性能和包体积，均不及发行模式。", "17:28:08.604 正在编译中...", "17:28:08.606 编译会生成大量临时文件，杀毒软件监控时会影响编译速度，并造成CPU升高。推荐把项目目录添加到杀毒软件的监控排除名单中。[添加] [帮助]", "17:28:09.208 \u001b[31m​Browserslist: caniuse-lite is outdated. Please run:\u001b[39m", "17:28:09.211 \u001b[31m  npx update-browserslist-db@latest\u001b[39m", "17:28:09.215 \u001b[31m  Why you should do it regularly: https://github.com/browserslist/update-db#readme​\u001b[39m", "17:28:20.889 [警告⚠] `fixtures\\runtime\\current\\index.js` 文件体积超过 500KB，已跳过压缩以及 ES6 转 ES5 的处理，手机端使用过大的js库影响性能。", "17:28:38.321 项目 mobile 编译成功。", {"truncated_items": 7}]}`
  - 诊断说明：核心 UI smoke 已通过：Android app 已由 HBuilderX 编译/启动，并进入目标 smoke 页面；深诊断说明为 `auth_or_device_diagnostics_not_part_of_core_ui_smoke`，auth/device DB 诊断用于后续账号与设备联调，不作为本次 build/typecheck/smoke/preflight 工程门禁的失败条件。

## 诊断与修复计划
- 无

## 阻塞项
- 无

## 总结
四个核心 gate 均已由真实命令证明通过：build 已完成真实移动端编译，typecheck 已完成项目脚本检查，preflight 已完成发布前检查，smoke 已证明 Android app 能在设备/模拟器启动并进入目标 UI 页面。
