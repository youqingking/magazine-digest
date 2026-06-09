# Stage DATA1B Audience Policy

## Current Rule

- `general_quick_30s <- adult quick_30s`
- `general_deep_3m <- adult deep_3m`

## Why

- 当前 detail 默认 audience 仍是 `general`
- Reader's Digest 源 md 只有 adult/teen 四块，没有独立 `general`
- 为避免 detail 默认进入即 unavailable，维持 DATA1A 的兼容派生

## Scope

- 这是受控的 runtime compatibility policy
- 当前 policy key：`adult_to_general_compat_v1`
- 这是过渡策略，不代表最终多刊物 audience 体系

## Future Override Direction

- 后续可按 publication policy 覆盖
- 本阶段不重做 teen/general/adult 边界
