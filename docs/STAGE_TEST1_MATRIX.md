# Stage TEST1 Matrix

## Parser / Importer

- `readers_digest_v1`
  - 输入：Reader's Digest baseline raw/normalized
  - 断言：四块内容提取、merged 不误导入
  - 失败级别：blocker
  - 前置：DATA1A 样本存在
- `split_audience_release_v1`
  - 输入：最小 split fixture + Three-release 实样
  - 断言：adult/youth 配对、缺边 warning
  - 失败级别：blocker
  - 前置：parser 可用
- `barrons_release_v1`
  - 输入：Barron's normalized/scenario
  - 断言：publication id/display name 稳定
  - 失败级别：blocker
  - 前置：DATA1C 导入已完成
- `the_atlantic_release_v1`
  - 输入：Atlantic normalized/scenario
  - 断言：H1 优先于截断文件名
  - 失败级别：blocker
  - 前置：DATA1C/D 导入已完成
- `the_economist_release_v1`
  - 输入：Economist normalized/scenario
  - 断言：section 恢复、anomaly 保留 warning
  - 失败级别：blocker
  - 前置：DATA1C/D 导入已完成

## Content Contract

- baseline Reader's Digest
- Barron's single scenario
- Atlantic single scenario
- Economist single scenario
- mixed preview scenario

断言：

- required 字段完整
- optional 字段允许为空
- best-effort 字段按 publication policy 判断
- override 合成结果稳定

失败级别：

- required 缺失：blocker
- best-effort 缺失：warning

## Lifecycle

- list
- select
- publish
- rollback
- retire

断言：

- select 不更新 current
- publish 才更新 current
- rollback 恢复 baseline
- retire 不删除 bundle

失败级别：blocker

## App Consumption

- baseline scenario: feed / search / detail / paywall / profile
- mixed scenario: 多 publication feed、publication search、detail general/teen、profile/paywall foundation
- detail 返回 feed 状态恢复

失败级别：blocker
