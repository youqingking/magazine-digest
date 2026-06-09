<template>
  <view class="badge">{{ label }}</view>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: "Free Reader"
    }
  }
};
</script>

<style>
.badge {
  display: inline-block;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: #f1e8d8;
  color: #5e4a21;
  font-size: 22rpx;
  font-weight: 700;
}
</style>
