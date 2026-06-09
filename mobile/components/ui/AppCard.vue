<template>
  <view class="app-card" :style="cardStyle">
    <slot />
  </view>
</template>

<script>
import { componentTokens } from "../../theme/component-tokens.js";
import { mergeStyles } from "../../theme/index.js";

export default {
  props: {
    tone: {
      type: String,
      default: "base"
    }
  },
  computed: {
    cardStyle() {
      return mergeStyles(componentTokens.card.base, componentTokens.card[this.tone]);
    }
  }
};
</script>

<style>
.app-card {
  width: 100%;
  box-sizing: border-box;
}
</style>
