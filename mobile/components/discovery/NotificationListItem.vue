<template>
  <view class="item" @click="$emit('open', item)">
    <view class="item-top">
      <UpdateBadge :update-type="item.type === 'digest' ? 'highlight_refresh' : item.reason === 'follow match' ? 'new_publish' : item.type" />
      <text class="title">{{ item.title }}</text>
    </view>
    <text class="body">{{ item.body }}</text>
    <text class="meta">{{ item.is_read ? "Read" : "Unread" }} · {{ item.reason }}</text>
  </view>
</template>

<script>
import UpdateBadge from "./UpdateBadge.vue";

export default {
  components: {
    UpdateBadge
  },
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
.item {
  padding: 20rpx;
  border-radius: 24rpx;
  background: #f4eee3;
}
.item-top {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.title {
  flex: 1;
  font-size: 28rpx;
  font-weight: 700;
  color: #2e3531;
}
.body,
.meta {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #5f665f;
}
</style>
