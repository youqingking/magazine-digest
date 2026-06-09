<template>
  <StatePanel
    state="unavailable"
    title="当前阅读上下文暂无可展示版本"
    :message="message"
    :hint="hint"
  />
</template>

<script>
import StatePanel from "../ui/StatePanel.vue";
import { formatAudienceLabel } from "../../utils/format-reading-meta.js";

export default {
  components: {
    StatePanel
  },
  props: {
    audienceMode: {
      type: String,
      default: "general"
    },
    unavailableReason: {
      type: String,
      default: "CONTENT_UNAVAILABLE"
    }
  },
  computed: {
    message() {
      return "当前 audience 与阅读模式命中了可用性边界。原因：" + this.unavailableReason;
    },
    hint() {
      return formatAudienceLabel(this.audienceMode) + " 请求命中了业务安全边界。这是受控 unavailable 状态，不是系统崩溃。";
    }
  }
};
</script>
