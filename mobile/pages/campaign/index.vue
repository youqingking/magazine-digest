<template>
  <view :style="$theme.pageShell">
    <SectionHeader title="Campaign Alias" description="旧 campaign route 仅保留为内部兼容 alias，将跳转到订阅页商业区块。" />
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
    writeRouteAliasState("campaign", "/pages/paywall/index?focus=campaign");
    uni.redirectTo({
      url: "/pages/paywall/index?focus=campaign"
    });
  }
};
</script>
