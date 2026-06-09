<template>
  <view class="section">
    <view class="section-head">
      <text class="title">{{ title }}</text>
      <text v-if="description" class="description">{{ description }}</text>
    </view>
    <view v-if="items.length" class="stack">
      <view v-for="item in items" :key="item.article_id || item._id || item.title" class="card" @click="$emit('open', item)">
        <view class="kicker-row">
          <text v-if="discoveryKicker(item)" class="kicker">{{ discoveryKicker(item) }}</text>
          <UpdateBadge v-if="item.update_type" :update-type="item.update_type" />
        </view>
        <text class="card-title">{{ item.title }}</text>
        <ArticleDigestBlock :source="item" />
        <view class="card-footer">
          <text v-if="item.saved_at || item.last_opened_at" class="meta">
            {{ item.saved_at ? "保存于 " + item.saved_at.slice(0, 10) : "上次打开 " + item.last_opened_at.slice(0, 10) }}
          </text>
        </view>
      </view>
    </view>
    <text v-else class="empty">{{ emptyText }}</text>
  </view>
</template>

<script>
import ArticleDigestBlock from "./ArticleDigestBlock.vue";
import UpdateBadge from "./UpdateBadge.vue";
import { discoveryKicker } from "../../services/taxonomy-meta.service.js";

export default {
  components: {
    ArticleDigestBlock,
    UpdateBadge
  },
  emits: ["open"],
  props: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ""
    },
    items: {
      type: Array,
      default: () => []
    },
    emptyText: {
      type: String,
      default: "暂无内容"
    }
  },
  methods: {
    discoveryKicker
  }
};
</script>

<style>
.section {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
.title {
  font-size: 30rpx;
  font-weight: 700;
  color: #191c1e;
  letter-spacing: 0.01em;
}
.description {
  display: block;
  margin-top: 10rpx;
  font-size: 24rpx;
  line-height: 1.72;
  color: #52606d;
}
.stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.card {
  padding: 32rpx;
  border-radius: 30rpx;
  background: #fcfcfa;
  border: 1rpx solid #e8ebe4;
  box-shadow: 0 12rpx 28rpx rgba(15, 23, 42, 0.035);
}
.kicker-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.kicker {
  font-size: 20rpx;
  font-weight: 700;
  color: #005bbf;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.card-title {
  display: block;
  margin-top: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.42;
  color: #1f2933;
}
.summary,
.empty,
.meta {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.68;
  color: #52606d;
}
.card-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-start;
  gap: 12rpx;
  margin-top: 16rpx;
}
</style>
