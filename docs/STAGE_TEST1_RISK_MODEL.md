# Stage TEST1 Risk Model

## Blockers

- normalized article required 字段缺失
- parser 误导入 merged 为文章
- split-audience pairing 失效
- scenario publish / rollback 破坏 baseline
- current mirror 与 selected scenario provenance 不一致
- baseline 或 mixed scenario 下 app content consumption 断裂

## Warnings

- Reader's Digest `ordinal` 仍缺失
- Economist 单篇 anomaly 仍保留
- best-effort metadata 未进一步精修

## Accepted Residual Risk

- UI3.5 的人工 runtime closeout 仍独立存在
- TEST1 不覆盖 HBuilderX GUI 编译与目视验收
