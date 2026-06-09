<template>
  <view :style="$theme.pageShell">
    <SectionHeader title="Follows Alias" description="旧 follows route 仅保留为内部兼容 alias，将跳转到搜索页关注目录。" />
  </view>
</template>

<script>
import SectionHeader from "../../components/ui/SectionHeader.vue";
import { writeRouteAliasState } from "../../services/navigation-state.service.js";

export default {
  components: {
    SectionHeader
  },
  onLoad() {
    writeRouteAliasState("follows", "/pages/search/index?focus=follows");
    uni.switchTab({
      url: "/pages/search/index"
    });
  }
};
</script>
