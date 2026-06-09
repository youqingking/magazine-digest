<template>
  <AppCard :tone="recommended ? 'info' : 'base'">
    <view class="plan-head">
      <view>
        <text :style="titleStyle">{{ cadence }}</text>
        <text :style="captionStyle">{{ plan.pricing_plan_id }}</text>
      </view>
      <AppChip v-if="recommended" label="推荐方案" tone="accent" />
    </view>
    <view class="plan-price">
      <text :style="priceStyle">{{ finalPrice }}</text>
      <text v-if="hasDiscount" :style="originalStyle">{{ originalPrice }}</text>
    </view>
    <MetaRow :items="metaItems" />
    <view class="plan-tags">
      <AppChip v-if="hasDiscount" :label="discountLabel" tone="accent" />
      <AppChip :label="'Floor ' + floorPrice" tone="neutral" />
      <AppChip v-if="plan.campaign_id" :label="plan.campaign_id" tone="info" />
    </view>
    <view class="plan-action">
      <AppButton :label="ctaLabel" @click="$emit('select', plan)" />
    </view>
  </AppCard>
</template>

<script>
import AppButton from "./AppButton.vue";
import AppCard from "./AppCard.vue";
import AppChip from "./AppChip.vue";
import MetaRow from "./MetaRow.vue";
import { formatDiscountBasisPoints, formatMoneyFromFen, formatPlanCadence } from "../../utils/format-money.js";
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

export default {
  components: {
    AppButton,
    AppCard,
    AppChip,
    MetaRow
  },
  props: {
    plan: {
      type: Object,
      required: true
    },
    recommended: {
      type: Boolean,
      default: false
    },
    ctaLabel: {
      type: String,
      default: "Preview plan"
    }
  },
  computed: {
    cadence() {
      return formatPlanCadence(this.plan.pricing_plan_id);
    },
    finalPrice() {
      return formatMoneyFromFen(this.plan.final_amount_fen);
    },
    originalPrice() {
      return formatMoneyFromFen(this.plan.original_amount_fen);
    },
    floorPrice() {
      return formatMoneyFromFen(this.plan.price_floor_fen);
    },
    hasDiscount() {
      return Number(this.plan.final_amount_fen) < Number(this.plan.original_amount_fen);
    },
    discountLabel() {
      return formatDiscountBasisPoints(this.plan.applied_price_multiplier_basis_points);
    },
    metaItems() {
      return [
        this.hasDiscount ? "Original " + this.originalPrice : "Standard pricing",
        "Canonical discount field",
        "Fen display only"
      ];
    },
    titleStyle() {
      return typography.cardTitle;
    },
    captionStyle() {
      return mergeStyles(typography.caption, {
        marginTop: "4rpx",
        display: "block"
      });
    },
    priceStyle() {
      return mergeStyles(typography.pageTitle, {
        fontSize: "48rpx"
      });
    },
    originalStyle() {
      return mergeStyles(typography.meta, {
        textDecoration: "line-through",
        marginLeft: "12rpx"
      });
    }
  }
};
</script>

<style>
.plan-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.plan-price {
  display: flex;
  align-items: baseline;
  margin-top: 18rpx;
}

.plan-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.plan-action {
  margin-top: 20rpx;
}
</style>
