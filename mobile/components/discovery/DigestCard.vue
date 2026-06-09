<template>
  <view class="digest-card" @click="$emit('open', item)">
    <text class="title">{{ item.title }}</text>
    <text class="body">{{ item.body || item.body_preview }}</text>
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
  }
};
</script>

<style>
.digest-card {
  padding: 20rpx;
  border-radius: 24rpx;
  background: #efe6d9;
}
.title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #433a31;
}
.body {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: #63574a;
}
</style>
