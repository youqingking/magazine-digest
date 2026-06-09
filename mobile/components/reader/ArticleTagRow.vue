<template>
  <view class="tag-row">
    <AppChip v-for="(tag, index) in tags" :key="tag.label + '-' + index" :label="tag.label" :tone="tag.tone" />
  </view>
</template>

<script>
import AppChip from "../ui/AppChip.vue";

export default {
  components: {
    AppChip
  },
  props: {
    tags: {
      type: Array,
      default: () => []
    }
  }
};
</script>

<style>
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
</style>
