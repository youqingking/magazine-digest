<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="Growth" title="邀请规则" description="Projection only. No real bind or reward grant." compact />
    <view v-for="item in rules" :key="item" class="rule-row">
      <text>{{ item }}</text>
    </view>
  </AppCard>
</template>

<script>
import AppCard from "../ui/AppCard.vue";
import SectionHeader from "../ui/SectionHeader.vue";

export default {
  components: {
    AppCard,
    SectionHeader
  },
  props: {
    rules: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style>
.rule-row {
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: #414754;
}
</style>
