# Evidence 与 Claim 规则

## Evidence 强度

- `direct_config`：manifest、app config、package manifest、lockfile 等结构化配置。
- `direct_code`：源码 import、初始化、API 调用、事件名、payload key。
- `direct_log_sample`：人工提供的脱敏日志样本。
- `doc_claim`：README、隐私文档、listing 文档里的声明。
- `inferred`：多个弱信号组合产生的推断。

## 证据要求

- 每条实质 claim 必须至少有一个 `evidence_refs`。
- Evidence 必须包含 `source_ref`，能定位到 repo 内文件。
- 有行号时写 `line_start` / `line_end`。
- 对日志样本只保留字段名、endpoint 和 hash，不保留 PII 原值。
- 需要人工确认的 claim、Data safety 全局问题和逐数据类型字段必须写 `review_status: NEED_HUMAN`。
- 不要把 `NEED_HUMAN` 当作错误；它表示无法由静态证据最终证明，需要 owner/legal/privacy 确认。

## 阻塞规则

- 发现账号创建/登录，但未发现删除账号流程或 Data deletion URL：`C5 blocked`。
- 缺失隐私政策 URL：`C5 blocked`。
- 只发现第三方隐私条款或占位 URL，不算 app 自有隐私政策 URL，必须 `NEED_HUMAN` 并保留阻塞项。
- 发现 ads/attribution/advertising ID/identify/setUserId：`C4 needs_human`。
- 发现儿童/家庭/年龄或敏感数据风险：`C4 needs_human`。
- SDK 清单无法从任何 manifest 生成：`C5 blocked`。

## 报告措辞

- 使用“扫描范围内未发现”，不要写“没有”。
- 使用“候选”“需要人工确认”，不要写“合规”“通过”“可提交”。
- 报告里直接展示 `NEED_HUMAN`，尤其是隐私政策 URL、删除请求机制、传输加密、shared/tracking、ephemeral、required/optional 和用途。
- 机器输出中的 `overall_status=pass_with_human_review` 只表示证据收集完成且剩余人工项明确，不表示合规通过。
