# screenshot-capture-agent 边界

## Skill 自有职责

- 发现 adb、Android 设备或模拟器。
- 发现目标 app package 候选和前台 app 状态。
- 消费 `screenshot-storyboard` 输出的 handoff/shot-list。
- 尝试真实 `adb exec-out screencap -p` 捕获。
- 解析 raw PNG 的尺寸、hash、alpha、比例和空白风险。
- 生成中文报告、机器报告、证据 JSONL 和截图 manifest。
- 缺少证明时 fail closed，输出 blocker 和 `NEED_HUMAN`。

## 非职责

- 不设计 storyboard。
- 不修改或补全 storyboard；缺少 shot-list 时应阻塞并要求先运行上游。
- 不制作最终商店截图设计图。
- 不添加背景、标题、设备框或营销文案。
- 不调用 Play Console 或上传截图。
- 不修改 app 源码、运行时 fixture、生产配置或账号数据。
- 不读取或委托其他 agent、Agno workflow、`play-store-launch/validators/**` 或 shared runtime。

## 证据边界

- 设备截图只有在命令证据、目标 package/foreground 证据和 PNG 文件证据同时存在时，才可写入 `screenshots`。
- 不能把任意桌面、启动器、系统设置、错误页、HBuilderX 容器页直接写成目标 app route。
- route 不能由脚本静态猜测；没有 route 证明时必须写 `NEED_HUMAN`。
- shot-list 中的 route 只是上游规划，不等于设备已经导航到该 route。
- 一次多 shot 捕获如果没有 `--shot-id`、自动导航证据或 `--navigation-verified`，必须阻塞，避免重复当前屏幕。
- 所有公开上架使用必须保留人工审核门禁。
