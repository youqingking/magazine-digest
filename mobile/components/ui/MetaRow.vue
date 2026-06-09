<template>
  <view class="meta-row">
    <text v-for="(item, index) in normalizedItems" :key="item + '-' + index" :style="metaStyle">
      {{ index === 0 ? item : " · " + item }}
    </text>
  </view>
</template>

<script>
import { typography } from "../../theme/typography.js";

export default {
  props: {
    items: {
      type: Array,
      default: () => []
    }
  },
  computed: {
    normalizedItems() {
      return this.items.filter(Boolean);
    },
    metaStyle() {
      return typography.meta;
    }
  }
};
</script>

<style>
.meta-row {
  display: flex;
  flex-wrap: wrap;
  row-gap: 4rpx;
}
</style>
