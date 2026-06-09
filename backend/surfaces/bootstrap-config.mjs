import { assertProductKey } from "../guards/request-guards.mjs";

export function createBootstrapConfigSurface({ repository, runtimeConfig }) {
  return function bootstrapConfig(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const product = repository.getProduct(productKey);

    return {
      product_key: productKey,
      config_source: runtimeConfig.runtimeMode,
      timezone: runtimeConfig.timezone,
      money_unit: runtimeConfig.moneyUnit,
      discount_canonical: runtimeConfig.discountCanonical,
      reward_canonical: runtimeConfig.rewardCanonical,
      product: {
        product_id: product?._id ?? null,
        display_name: product?.display_name ?? null,
        default_language: product?.default_language ?? "zh-CN",
        active_status: product?.active_status ?? "inactive"
      },
      feature_flags: [],
      experiments: repository.listExperiments(productKey).map((item) => ({
        experiment_id: item._id,
        experiment_key: item.experiment_key,
        assignment_unit: item.assignment_unit,
        assignment_version: item.assignment_version,
        status: item.status
      }))
    };
  };
}
