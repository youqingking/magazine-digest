<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="奖励" title="奖励摘要" :description="summary.status_summary || '暂无奖励记录'" compact />
    <MetaRow :items="items" />
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
    summary: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    items() {
      return [
        "奖励天数 " + (this.summary.vip_days_total ?? 0),
        "生效中 " + (this.summary.active_vip_days ?? 0),
        "记录数 " + ((this.summary.ledger_preview || []).length)
      ];
    }
  }
};
</script>
