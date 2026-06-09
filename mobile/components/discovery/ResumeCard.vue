<template>
  <view class="resume-card" @click="$emit('open')">
    <text class="title">{{ item.title }}</text>
    <text class="meta">Progress {{ progressLabel }}</text>
    <text v-if="item.change_summary" class="summary">{{ item.change_summary }}</text>
  </view>
</template>

<script>
export default {
  emits: ["open"],
  props: {
    item: {
      type: Object,
      required: true
    }
  },
  computed: {
    progressLabel() {
      return Math.round((Number(this.item.progress_hint || 0) / 10000) * 100) + "%";
    }
  }
};
</script>

<style>
.resume-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background: #f3efe7;
}
.title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #2f3531;
}
.meta,
.summary {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #606760;
}
</style>
