<template>
  <view class="article-title-block">
    <text v-if="eyebrow" :style="eyebrowStyle">{{ eyebrow }}</text>
    <text :style="titleStyle">{{ displayTitle }}</text>
  </view>
</template>

<script>
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

export default {
  props: {
    eyebrow: {
      type: String,
      default: "Reading detail"
    },
    title: {
      type: String,
      default: ""
    }
  },
  computed: {
    displayTitle() {
      return this.title || "Untitled article";
    },
    eyebrowStyle() {
      return mergeStyles(typography.eyebrow, {
        display: "block",
        letterSpacing: "0.5rpx"
      });
    },
    titleStyle() {
      return mergeStyles(typography.pageTitle, {
        display: "block",
        marginTop: this.eyebrow ? "12rpx" : "0",
        lineHeight: 1.24
      });
    }
  }
};
</script>

<style>
.article-title-block {
  display: flex;
  flex-direction: column;
}
</style>
