# Stage OBS1 Sink Strategy

## Sink Types

OBS1 v1 采用三类 sink：

1. `file_event_sink`
2. `rolling_bounded_sink`
3. `summary_report_sink`

## Canonical Layout

- `runtime/observability/events/`
- `runtime/observability/incidents/`
- `runtime/observability/summaries/`
- `output/stage-obs1/`

## v1 Storage Rules

### file_event_sink

- 每个 event 独立写入一个 json 文件。
- 文件名包含 `occurred_at + event_type + short_event_id`。
- 优点：
  - 不依赖 append
  - 更适合并发 report-only 写入
  - 更容易做 retention/prune

### rolling_bounded_sink

- 保留 capped recent view：
  - recent events
  - recent incidents
- retention 默认按数量和天数双重约束。
- 旧 event file 可被 prune，但 triage report 永远只看 bounded window。

### summary_report_sink

- 从 canonical event files + current runtime/channel/release state 重建。
- 输出固定写到 `output/stage-obs1/`，供 smoke、console、operator triage 使用。

## TEST2 Compatibility

- 不通过 append 修改共享 canonical log。
- 事件文件写入使用 atomic write。
- stateful ops 脚本继续遵守既有 `runtime-state` lock。
- report-only 脚本允许写唯一事件文件，并通过 summary rebuild 汇总，不额外破坏 TEST2 并行策略。

## Remote-ready Interface

后续远程平台接入只新增 sink adapter，不重写 event schema：

- `file_event_sink`
- `summary_report_sink`
- `remote_sink` future

remote sink 适配时只允许：

- 复用同一 schema
- 复用同一 severity / taxonomy
- 保留本地 file sink 作为 fallback
