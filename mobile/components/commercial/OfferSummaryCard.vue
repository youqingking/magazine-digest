<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="订阅" title="订阅摘要" :description="description" compact />
    <MetaRow :items="metaItems" />
  </AppCard>
</template>

<script>
import AppCard from "../ui/AppCard.vue";
import MetaRow from "../ui/MetaRow.vue";
import SectionHeader from "../ui/SectionHeader.vue";
import { formatMoneyFromFen } from "../../utils/format-money.js";

export default {
  components: {
    AppCard,
    MetaRow,
    SectionHeader
  },
  props: {
    offer: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    description() {
      return this.offer.active_campaign_adjustment?.headline || "价格展示来自本地预览，不触发真实下单。";
    },
    metaItems() {
      const plans = (this.offer.available_plans || []).slice(0, 2).map((plan) => {
        return plan.display_name + " " + formatMoneyFromFen(plan.display_amount_fen);
      });

      return [
        ...plans,
        "优惠码 " + ((this.offer.promo_input_capability?.enabled && this.offer.promo_input_capability?.preview_only) ? "可预览" : "未开启"),
        "底价保护 " + (this.offer.floor_guard_explanation || "已开启")
      ];
    }
  }
};
</script>
