<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="活动" :title="localizedTitle" :description="landing.subtitle || ''" compact />
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
    landing: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    localizedTitle() {
      return this.landing.title === "Campaign preview" ? "活动预览" : (this.landing.title || "活动信息");
    },
    metaItems() {
      return [
        "优惠说明 " + (this.landing.discount_label || "暂无"),
        "主按钮 " + ((this.landing.cta_primary === "View offer" ? "查看方案" : this.landing.cta_primary) || "暂无"),
        "当前仅展示说明"
      ];
    }
  }
};
</script>
