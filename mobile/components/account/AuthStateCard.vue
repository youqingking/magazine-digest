<template>
  <AppCard>
    <SectionHeader eyebrow="Foundation" title="账号状态" description="保留 uni-id 会话与当前用户摘要，不扩张为复杂账户中心。" compact />
    <MetaRow :items="metaItems" />
  </AppCard>
</template>

<script>
import AppCard from "../ui/AppCard.vue";
import MetaRow from "../ui/MetaRow.vue";
import SectionHeader from "../ui/SectionHeader.vue";

export default {
  components: {
    AppCard,
    MetaRow,
    SectionHeader
  },
  props: {
    session: {
      type: Object,
      default: () => null
    },
    currentUserInfo: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    metaItems() {
      return [
        "会话 " + (this.session?.session_state || "unknown"),
        "方式 " + (this.session?.auth_provider || "local_stub"),
        "凭证 " + (this.session?.token_state || "placeholder"),
        "当前用户 " + (this.currentUserInfo?.state || "hidden"),
        "账号标识 " + (this.currentUserInfo?.uid || "none"),
        "来源 " + (this.session?.source || "unknown")
      ];
    }
  }
};
</script>
