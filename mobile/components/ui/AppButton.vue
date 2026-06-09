<template>
  <button class="app-button" :style="buttonStyle" @click="$emit('click')">
    {{ label }}
  </button>
</template>

<script>
import { componentTokens } from "../../theme/component-tokens.js";
import { colorRoles } from "../../theme/tokens.js";
import { mergeStyles } from "../../theme/index.js";

const toneMap = {
  primary: {
    background: colorRoles.accentPrimary,
    color: colorRoles.textInverse,
    borderColor: colorRoles.accentPrimary
  },
  secondary: {
    background: colorRoles.surfaceRaised,
    color: colorRoles.accentPrimaryStrong,
    borderColor: colorRoles.borderSubtle
  },
  subtle: {
    background: colorRoles.bgMuted,
    color: colorRoles.textSecondary,
    borderColor: colorRoles.bgMuted
  }
};

export default {
  props: {
    label: {
      type: String,
      required: true
    },
    tone: {
      type: String,
      default: "primary"
    }
  },
  computed: {
    buttonStyle() {
      const tone = toneMap[this.tone] || toneMap.primary;
      return mergeStyles(componentTokens.button, {
        background: tone.background,
        color: tone.color,
        borderWidth: this.tone === "primary" ? "0rpx" : "1rpx",
        borderStyle: "solid",
        borderColor: tone.borderColor
      });
    }
  }
};
</script>

<style>
.app-button {
  margin: 0;
  line-height: 76rpx;
  letter-spacing: 0.02em;
}

.app-button::after {
  border: 0;
}
</style>
