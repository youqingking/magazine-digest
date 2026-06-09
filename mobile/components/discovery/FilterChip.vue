<template>
  <view class="chip" :class="{ active }" @click="$emit('click')">
    <text class="chip-text">{{ label }}</text>
  </view>
</template>

<script>
export default {
  emits: ["click"],
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 64rpx;
  max-width: 220rpx;
  padding: 10rpx 22rpx;
  border-radius: 999rpx;
  border: 1rpx solid #e0e3e6;
  background: #ffffff;
  box-sizing: border-box;
}
.chip.active {
  border-color: #d8e2ff;
  background: #d8e2ff;
}
.chip-text {
  display: block;
  max-width: 100%;
  font-size: 22rpx;
  font-weight: 600;
  color: #414754;
  letter-spacing: 0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chip.active .chip-text {
  color: #004493;
}
</style>
