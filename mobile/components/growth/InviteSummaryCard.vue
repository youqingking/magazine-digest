<template>
  <AppCard>
    <SectionHeader eyebrow="Growth" title="邀请摘要" description="邀请、返奖与兑换仍是预览态，不做真实闭环。" compact />
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
        "Invite code " + (this.summary.invite_code || "none"),
        this.summary.inviter_summary || "No inviter summary",
        this.summary.invitee_summary || "No invitee summary"
      ];
    }
  }
};
</script>
