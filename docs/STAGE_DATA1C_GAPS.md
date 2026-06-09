# Stage DATA1C Gaps

## Solved In This Stage

- split-audience adult/youth 配对导入
- 三个 publication / issue 的独立 registry entry
- single scenarios + mixed preview scenario
- Reader's Digest baseline 保留且不静默替换

## Remaining Gaps

- The Atlantic 的 section 元数据仍是 best effort，不是精确目录结构
- The Economist 的少量弱语义文件名需要依赖顺序上下文，而非完全自描述
- `start_page` 在本包中默认允许 `null`，本阶段不强行伪造

## Possible NEED_HUMAN Cases

- 若未来发现 adult/youth basename 不再严格一致，需要人工确认新的 pairing key
- 若后续刊物提供更可靠目录表，可再提升 Atlantic/Barron's section 精度
