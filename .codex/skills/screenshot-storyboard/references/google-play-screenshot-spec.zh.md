# Google Play Screenshot Spec Notes

来源：Google Play 官方 preview asset 说明  
https://support.google.com/googleplay/android-developer/answer/9866151?hl=en

## 基础规格

- Google Play 需要至少 2 张截图，按设备类型最多 8 张。
- 截图格式为 JPEG 或 24-bit PNG，不能带 alpha。
- 最小边至少 320px，最大边不超过 3840px。
- 最大边不能超过最小边的 2 倍。
- 截图应展示真实 app 体验。

## Storyboard 阶段要处理的事

- 每个 shot 必须绑定真实 route 与 scenario。
- 截图上的 app 内容必须来自真实 app UI 或可证明的 demo/runtime fixture。
- 可写简短标题或 tagline，但文案必须与真实 app 能力一致。
- 所有公开上架用途都需要人工审核：内容授权、商标、裁切、安全区、设备类型、最终视觉包装。

## 禁止或需要人工确认

- 不展示不存在的功能。
- 不展示内部 debug、开发诊断、构建信息、远端桥接配置、生产密钥、账号隐私、真实支付凭据。
- 不使用排名、评分、下载量、价格促销、限时优惠、CTA 或 Play Store 表现暗示。
- 第三方出版物名称、文章标题、内容摘要、商标、封面或品牌露出必须人工确认授权。
