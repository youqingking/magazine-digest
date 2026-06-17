# Per-Agent Truth Table

## 总结

当前八个 Play Store 代理都不能被标记为 reality passed。它们有不同程度的 schema、guardrail、draft 和 blocker 价值，但仍缺少真实内容、跨 PRD、下游消费或 Agno model-backed 证据。

| Agent | 当前输出 | 通用输出 | 缺乏证据的主张 | 浅层验证点 | 缺少下游使用 | Agno 证据 | 当前 verdict | 强化前必须补齐 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `release-build-agent` | release gate、dry-run、machine output | EAS、签名、Play Console blocker | local command pass freshness、release readiness | schema/terms/blocked status | signed AAB/APK、EAS build、Play track dry-run | A2 wrapper step only | FAIL | fresh command ledger、release artifact evidence、owner package decision |
| `privacy-disclosure-prep` | data inventory、SDK inventory、privacy draft | privacy policy、developer contact、SDK review blocker | no live service collection、privacy readiness | claim shape、human gate、forbidden words | legal/privacy sign-off、release SDK tree | A2 wrapper step only | FAIL | release artifact SDK inventory、owner privacy answers、data flow proof |
| `google-play-listing` | listing JSON、validation report、submission readiness | field length、draft copy、store blocker | current app capability copy、content/publication authorization | JSON parse、length、draft flags | Play Console draft import、owner copy review | A2 wrapper step only | FAIL | real content proof、trademark review、cross-PRD no-leak output |
| `screenshot-storyboard` | storyboard、shot-list、validation notes | route list、capture plan、public use blocker | visual evidence is store-usable | shot-list shape、hardcoded allowed routes | screenshot capture job、public asset review | A2 wrapper step only | FAIL | rendered route proof、real screenshot capture、content authorization |
| `launch-info-collector` | LAUNCH_INFO、source-of-truth JSON | missing field collection | inferred listing name、store source-of-truth completeness | field status enum、required docs | owner-filled Play Console/app/package source | A2 wrapper step only | FAIL | owner input pack、decision refs、updated source-of-truth |
| `google-data-safety-agent` | Data Safety draft/evidence/human review | Data Safety answer blockers | local fixture content review, no live service collection | schema/claim class/human gate | Play Console answer mapping、privacy review | A2 wrapper step only | FAIL | owner/Pro answer mapping、release SDK tree、data handling evidence |
| `screenshot-capture-agent` | capture report、capture blockers、blocked output | device/emulator blocker | adb availability meaning, screenshot safety | capture_status shape、no screenshots when blocked | raw PNG、device metadata、viewport/locale proof | A2 wrapper step only | FAIL | real Android capture or explicit owner block artifact |
| `launch-package-agent` | readiness package、manifest、NEED_HUMAN | aggregated blockers、owner report | validators cover reality, owner-ready meaning | package manifest/readiness color/schema | owner sign-off、PR review、release gate consumption | A2 wrapper step only | FAIL | downstream signoff, cross-agent evidence trace, no generic template reuse |

## Agent-specific stop rules

### `release-build-agent`

不得把 local validator pass 写成 release readiness。没有 signed Android build、EAS owner/projectId、signing policy 和 Play Console source-of-truth 时，只能输出 blocked 或 needs_human。

### `privacy-disclosure-prep`

不得把 repo manifest 当成 release SDK inventory。没有真实 release artifact 和 owner/privacy decision 时，只能输出 draft evidence。

### `google-play-listing`

不得只因为字段长度合规就认为文案可用。必须证明文案对应真实已实现体验、真实杂志摘要样本和商标/内容授权边界。

### `screenshot-storyboard`

不得把 shot-list 当作截图。每个 shot 必须在真实 capture 前保持 planning / draft / human review required。

### `launch-info-collector`

不得把 inferred field 写成 observed fact。Play Console、Android package、EAS、privacy policy、developer contact、content rating、target audience 仍需 owner。

### `google-data-safety-agent`

不得把 Data Safety evidence draft 当作 Play Console answers。C3/C4 claim 必须 human gated。

### `screenshot-capture-agent`

不得伪造 raw PNG。`capture_status=blocked` 是诚实阻断，不是完成。

### `launch-package-agent`

不得把汇总报告包装为 approval、submission readiness 或 production readiness。报告只可作为 owner review input。

## 当前强化决策

当前不可以安全强化代理输出。允许强化 validator、harness、cross-PRD protocol、Agno standard 和 truth table；不允许把现有八代理输出升级为可靠完成状态。
