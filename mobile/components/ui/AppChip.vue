<template>
  <view class="chip-wrap" :style="chipStyle">
    <text :style="textStyle">{{ label }}</text>
  </view>
</template>

<script>
import { componentTokens } from "../../theme/component-tokens.js";
import { colorRoles } from "../../theme/tokens.js";
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

const toneMap = {
  neutral: {
    background: colorRoles.surfaceRaised,
    borderColor: colorRoles.borderSubtle,
    color: colorRoles.textSecondary
  },
  accent: {
    background: colorRoles.accentSoft,
    borderColor: colorRoles.borderAccent,
    color: colorRoles.accentPrimaryStrong
  },
  info: {
    background: colorRoles.infoSurface,
    borderColor: colorRoles.borderStrong,
    color: colorRoles.infoText
  },
  warning: {
    background: colorRoles.warningSurface,
    borderColor: "#e7d5a3",
    color: colorRoles.warningText
  },
  muted: {
    background: colorRoles.bgMuted,
    borderColor: colorRoles.borderSubtle,
    color: colorRoles.textMuted
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
      default: "neutral"
    }
  },
  computed: {
    chipStyle() {
      const tone = toneMap[this.tone] || toneMap.neutral;
      return mergeStyles(componentTokens.chip.base, {
        background: tone.background,
        borderColor: tone.borderColor
      });
    },
    textStyle() {
      const tone = toneMap[this.tone] || toneMap.neutral;
      return mergeStyles(typography.label, {
        color: tone.color,
        textTransform: "none"
      });
    }
  }
};
</script>

<style>
.chip-wrap {
  align-self: flex-start;
}
</style>
