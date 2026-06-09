<template>
  <view :style="wrapStyle">
    <text v-if="eyebrow" :style="eyebrowStyle">{{ eyebrow }}</text>
    <text :style="titleStyle">{{ title }}</text>
    <text v-if="description" :style="descriptionStyle">{{ description }}</text>
  </view>
</template>

<script>
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

export default {
  props: {
    title: {
      type: String,
      required: true
    },
    eyebrow: {
      type: String,
      default: ""
    },
    description: {
      type: String,
      default: ""
    },
    compact: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    wrapStyle() {
      return {
        display: "flex",
        flexDirection: "column"
      };
    },
    eyebrowStyle() {
      return mergeStyles(typography.eyebrow, {
        display: "block",
        letterSpacing: "1rpx",
        marginBottom: this.compact ? "4rpx" : "8rpx"
      });
    },
    titleStyle() {
      return mergeStyles(this.compact ? typography.cardTitle : typography.sectionTitle, {
        display: "block"
      });
    },
    descriptionStyle() {
      return mergeStyles(typography.bodyMuted, {
        display: "block",
        marginTop: this.compact ? "6rpx" : "10rpx"
      });
    }
  }
};
</script>
