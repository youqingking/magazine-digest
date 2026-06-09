<template>
  <AppCard>
    <SectionHeader eyebrow="Foundation" title="推送状态" description="Inbox 继续是真相源；这里仅保留传输能力与 delivery preview 可见性。" compact />
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
    capability: {
      type: Object,
      default: () => null
    },
    preview: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    metaItems() {
      return [
        "通知权限 " + (this.capability?.permission_state || "prompt"),
        "推送能力 " + (this.capability?.capability_state || "missing"),
        "推送标识 " + (this.capability?.push_clientid || "missing"),
        "应用标识 " + (this.capability?.push_appid || "missing"),
        "投递预览 " + (this.preview?.transport_decision || "idle"),
        "来源 " + (this.capability?.source || "unknown")
      ];
    }
  }
};
</script>
