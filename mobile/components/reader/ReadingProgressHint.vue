<template>
  <AppCard tone="muted">
    <text :style="titleStyle">Reading controls</text>
    <text :style="bodyStyle">{{ message }}</text>
    <view class="hint-actions">
      <AppButton label="Mark 30%" tone="secondary" @click="$emit('progress', 30)" />
      <AppButton label="Mark 80%" tone="secondary" @click="$emit('progress', 80)" />
      <AppButton label="View paywall" tone="subtle" @click="$emit('paywall')" />
    </view>
  </AppCard>
</template>

<script>
import AppButton from "../ui/AppButton.vue";
import AppCard from "../ui/AppCard.vue";
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

export default {
  components: {
    AppButton,
    AppCard
  },
  props: {
    message: {
      type: String,
      default: "Progress events remain local-fixture backed in this stage."
    }
  },
  computed: {
    titleStyle() {
      return typography.cardTitle;
    },
    bodyStyle() {
      return mergeStyles(typography.bodyMuted, {
        display: "block",
        marginTop: "8rpx"
      });
    }
  }
};
</script>

<style>
.hint-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}
</style>
