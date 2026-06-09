export function formatMoneyFromFen(fen, options = {}) {
  const amount = Number(fen || 0) / 100;
  const currency = options.currency || "CNY";
  return currency + " " + amount.toFixed(2);
}

export function formatDiscountBasisPoints(basisPoints) {
  const numeric = Number(basisPoints || 0);
  if (!numeric || numeric >= 10000) {
    return "Standard";
  }

  return (numeric / 1000).toFixed(numeric % 1000 === 0 ? 1 : 2).replace(/\.0$/, "") + " zhe";
}

export function formatPlanCadence(planId) {
  if (!planId) {
    return "Plan";
  }

  if (planId.indexOf("annual") >= 0 || planId.indexOf("year") >= 0) {
    return "Yearly";
  }

  if (planId.indexOf("month") >= 0) {
    return "Monthly";
  }

  return "Plan";
}
