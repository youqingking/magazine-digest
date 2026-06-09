<template>
  <view class="badge" :class="'badge-' + tone">
    <text class="badge-text">{{ label }}</text>
  </view>
</template>

<script>
export default {
  props: {
    updateType: {
      type: String,
      default: ""
    }
  },
  computed: {
    label() {
      const mapping = {
        new_publish: "NEW",
        revision: "UPDATE",
        correction: "FIX",
        highlight_refresh: "DIGEST"
      };
      return mapping[this.updateType] || "INFO";
    },
    tone() {
      return this.updateType === "revision" ? "warm" : this.updateType === "new_publish" ? "fresh" : "calm";
    }
  }
};
</script>

<style>
.badge {
  display: inline-flex;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}
.badge-fresh {
  background: #dbe8d0;
}
.badge-warm {
  background: #ead9c5;
}
.badge-calm {
  background: #dbe4e8;
}
.badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #36413c;
}
</style>
