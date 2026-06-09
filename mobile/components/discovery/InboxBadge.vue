<template>
  <view class="badge">
    <text class="badge-text">{{ badgeText }}</text>
  </view>
</template>

<script>
export default {
  props: {
    count: {
      type: Number,
      default: 0
    }
  },
  computed: {
    badgeText() {
      if (this.count > 0) {
        return `${this.count} 条未读更新`;
      }
      return "查看最新更新";
    }
  }
};
</script>

<style>
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 24rpx;
  border-radius: 24rpx;
  background: #efe6d7;
}
.badge-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #342d25;
}
</style>
