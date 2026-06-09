# Stage UI3 Route Map

## Final Official Pages

| Page | Route | In tabBar | Primary entry |
| --- | --- | --- | --- |
| 首页 | `pages/feed/index` | Yes | tabBar |
| 搜索 / 来源 | `pages/search/index` | Yes | tabBar |
| 文章详情 | `pages/detail/index` | No | article click |
| 订阅 | `pages/paywall/index` | No | feed CTA, profile CTA, detail CTA, campaign alias |
| 邀请 / 兑换 | `pages/invite/index` | No | profile CTA, paywall CTA |
| 我的 | `pages/profile/index` | Yes | tabBar |
| 设置 | `pages/settings/index` | No | profile CTA |

## Alias / Internal Routes

| Alias | Route | Handling |
| --- | --- | --- |
| inbox | `pages/inbox/index` | internal capability page plus feed handoff |
| follows | `pages/follows/index` | redirect / handoff to `pages/search/index` |
| campaign | `pages/campaign/index` | redirect / handoff to `pages/paywall/index?focus=campaign` |

## Tab-only Navigation

- `switchTab("/pages/feed/index")`
- `switchTab("/pages/search/index")`
- `switchTab("/pages/profile/index")`

## Non-Tab Navigation

- `navigateTo("/pages/detail/index?...")`
- `navigateTo("/pages/paywall/index?...")`
- `navigateTo("/pages/invite/index?...")`
- `navigateTo("/pages/settings/index")`
- `redirectTo("/pages/paywall/index?focus=campaign")`
