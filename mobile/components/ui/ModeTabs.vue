<template>
  <view class="mode-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      class="mode-tab"
      :style="tabStyle(tab.value)"
      @click="$emit('change', tab.value)"
    >
      {{ tab.label }}
    </button>
  </view>
</template>

<script>
import { colorRoles, radiusScale, spacingScale } from "../../theme/tokens.js";
import { typography } from "../../theme/typography.js";
import { mergeStyles } from "../../theme/index.js";

export default {
  props: {
    tabs: {
      type: Array,
      default: () => []
    },
    value: {
      type: String,
      default: ""
    }
  },
  methods: {
    tabStyle(tabValue) {
      const isActive = tabValue === this.value;
      return mergeStyles(typography.meta, {
        minHeight: "68rpx",
        paddingLeft: "22rpx",
        paddingRight: "22rpx",
        borderRadius: radiusScale.pill,
        borderWidth: "1rpx",
        borderStyle: "solid",
        borderColor: isActive ? colorRoles.borderSubtle : "transparent",
        background: isActive ? colorRoles.surfaceRaised : "transparent",
        color: isActive ? colorRoles.accentPrimaryStrong : colorRoles.textSecondary
      });
    }
  }
};
</script>

<style>
.mode-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  padding: 8rpx;
  border-radius: 999rpx;
  background: #ece9e1;
}

.mode-tab {
  margin: 0;
}

.mode-tab::after {
  border: 0;
}
</style>
