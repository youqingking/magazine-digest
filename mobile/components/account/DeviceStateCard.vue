<template>
  <AppCard>
    <SectionHeader eyebrow="Foundation" title="设备状态" description="保留 installation / device / CID 可见性，作为 H0/H1a 基础能力视图。" compact />
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
    device: {
      type: Object,
      default: () => null
    }
  },
  computed: {
    metaItems() {
      return [
        "安装标识 " + (this.device?.installation_id || "missing"),
        "设备标识 " + (this.device?.device_id || "missing"),
        "登记状态 " + (this.device?.registration_state || "pending"),
        "推送标识 " + (this.device?.push_clientid || "missing"),
        "应用标识 " + (this.device?.appid || "missing"),
        "来源 " + (this.device?.source || "unknown")
      ];
    }
  }
};
</script>
