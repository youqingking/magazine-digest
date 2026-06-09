<template>
  <AppCard :tone="tone">
    <view class="state-panel">
      <view :style="iconWrapStyle">
        <text :style="iconTextStyle">{{ stateLabel }}</text>
      </view>
      <view class="state-copy">
        <text :style="titleStyle">{{ title }}</text>
        <text v-if="message" :style="messageStyle">{{ message }}</text>
        <text v-if="hint" :style="hintStyle">{{ hint }}</text>
      </view>
    </view>
    <view v-if="actionText" class="state-action">
      <AppButton :label="actionText" tone="secondary" @click="$emit('action')" />
    </view>
  </AppCard>
</template>

<script>
import AppButton from "./AppButton.vue";
import AppCard from "./AppCard.vue";
import { componentTokens } from "../../theme/component-tokens.js";
import { colorRoles } from "../../theme/tokens.js";
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

const stateConfig = {
  loading: { tone: "info", badge: "..." },
  empty: { tone: "muted", badge: "0" },
  error: { tone: "error", badge: "!" },
  unavailable: { tone: "warning", badge: "--" },
  cached: { tone: "success", badge: "C" },
  locked: { tone: "info", badge: "P" },
  placeholder: { tone: "muted", badge: "+" }
};

export default {
  components: {
    AppButton,
    AppCard
  },
  props: {
    state: {
      type: String,
      default: "placeholder"
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      default: ""
    },
    hint: {
      type: String,
      default: ""
    },
    actionText: {
      type: String,
      default: ""
    }
  },
  computed: {
    config() {
      return stateConfig[this.state] || stateConfig.placeholder;
    },
    tone() {
      return this.config.tone;
    },
    stateLabel() {
      return this.config.badge;
    },
    iconWrapStyle() {
      return mergeStyles(componentTokens.statePanel.iconWrap, {
        background: colorRoles.surfaceRaised,
        borderWidth: "1rpx",
        borderStyle: "solid",
        borderColor: colorRoles.borderSubtle
      });
    },
    iconTextStyle() {
      return mergeStyles(typography.sectionTitle, {
        fontSize: "24rpx"
      });
    },
    titleStyle() {
      return typography.cardTitle;
    },
    messageStyle() {
      return mergeStyles(typography.bodyMuted, {
        display: "block",
        marginTop: "8rpx"
      });
    },
    hintStyle() {
      return mergeStyles(typography.caption, {
        display: "block",
        marginTop: "8rpx"
      });
    }
  }
};
</script>

<style>
.state-panel {
  display: flex;
  align-items: flex-start;
}

.state-copy {
  flex: 1;
  margin-left: 16rpx;
}

.state-action {
  margin-top: 16rpx;
}
</style>
