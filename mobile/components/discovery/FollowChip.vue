<template>
  <view class="chip" :class="{ active }" @click="$emit('toggle')">
    <text class="chip-text">{{ active ? `已关注 ${label}` : `关注 ${label}` }}</text>
  </view>
</template>

<script>
export default {
  emits: ["toggle"],
  props: {
    label: {
      type: String,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    }
  }
};
</script>

<style>
.chip {
  padding: 12rpx 22rpx;
  border-radius: 999rpx;
  background: #ffffff;
  border: 1rpx solid #e0e3e6;
}
.chip.active {
  background: #eef4fb;
  border-color: #d8e2ff;
}
.chip-text {
  font-size: 22rpx;
  color: #414754;
  letter-spacing: 0.02em;
}
.chip.active .chip-text {
  color: #005bbf;
}
</style>
