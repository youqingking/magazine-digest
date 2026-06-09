<template>
  <view v-if="digest.isMeaningful" class="digest-block">
    <view class="digest-label-row">
      <text class="digest-label">{{ label }}</text>
      <text v-if="showModeHint" class="digest-mode-hint">流内读完</text>
    </view>

    <text v-if="digest.lead" class="digest-lead">{{ digest.lead }}</text>

    <view v-if="digest.bullets.length" class="digest-points">
      <view v-for="(point, index) in digest.bullets" :key="point + '-' + index" class="digest-point">
        <text class="digest-dot">•</text>
        <text class="digest-point-text">{{ point }}</text>
      </view>
    </view>

    <view v-if="digest.whyItMatters || digest.keyFact" class="digest-notes">
      <view v-if="digest.keyFact" class="digest-note">
        <text class="digest-note-label">关键信息</text>
        <text class="digest-note-text">{{ digest.keyFact }}</text>
      </view>
      <view v-if="digest.whyItMatters" class="digest-note">
        <text class="digest-note-label">为什么重要</text>
        <text class="digest-note-text">{{ digest.whyItMatters }}</text>
      </view>
    </view>

    <view v-else-if="!digest.bullets.length && fallbackParagraphs.length" class="digest-fallback">
      <text v-for="(paragraph, index) in fallbackParagraphs" :key="paragraph + '-' + index" class="digest-fallback-text">
        {{ paragraph }}
      </text>
    </view>
  </view>
</template>

<script>
import { buildSummaryDigest } from "../../services/content-normalizer.service.js";

export default {
  props: {
    source: {
      type: Object,
      default: () => ({})
    },
    label: {
      type: String,
      default: "30 秒摘要"
    },
    showModeHint: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    digest() {
      if (this.source && this.source.reading_digest) {
        return this.source.reading_digest;
      }
      return buildSummaryDigest(this.source || {});
    },
    fallbackParagraphs() {
      const lead = String(this.digest.lead || "").trim();
      return (this.digest.paragraphs || []).filter((paragraph, index) => {
        const normalized = String(paragraph || "").trim();
        if (!normalized) {
          return false;
        }
        if (!lead) {
          return true;
        }
        if (normalized === lead) {
          return false;
        }
        if (index === 0 && normalized.startsWith(lead)) {
          return false;
        }
        return true;
      });
    }
  }
};
</script>

<style>
.digest-block {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 18rpx;
  padding: 22rpx 24rpx;
  border-radius: 24rpx;
  background: #f2f3ef;
}

.digest-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.digest-label,
.digest-note-label,
.digest-mode-hint {
  font-size: 22rpx;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #52606d;
}

.digest-mode-hint {
  color: #7b8794;
}

.digest-lead,
.digest-note-text,
.digest-fallback-text {
  display: block;
  font-size: 29rpx;
  line-height: 1.88;
  color: #1f2933;
}

.digest-points,
.digest-notes,
.digest-fallback {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.digest-point {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.digest-dot {
  font-size: 27rpx;
  line-height: 1.78;
  color: #7b8794;
}

.digest-point-text {
  flex: 1;
  font-size: 28rpx;
  line-height: 1.84;
  color: #334155;
}

.digest-note {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  padding-top: 8rpx;
}
</style>
