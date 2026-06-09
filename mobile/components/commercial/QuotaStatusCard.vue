<template>
  <AppCard :tone="tone">
    <SectionHeader eyebrow="Commercial" title="额度状态" :description="quota.reset_hint || '显示配额投影与 paywall 触发原因。'" compact />
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
    quota: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    tone() {
      return this.quota.paywall_triggered ? "muted" : "base";
    },
    metaItems() {
      return [
        "Remaining " + (this.quota.quota_remaining ?? 0),
        "Used " + (this.quota.free_quota_used ?? 0) + "/" + (this.quota.free_quota_total ?? 0),
        "Reason " + (this.quota.quota_reason || "none")
      ];
    }
  }
};
</script>
