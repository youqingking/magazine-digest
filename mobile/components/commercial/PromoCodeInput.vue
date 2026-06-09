<template>
  <AppCard tone="muted">
    <SectionHeader eyebrow="Commercial" title="优惠码预览" description="仅做 preview，不触发真实 redeem 或 entitlement grant。" compact />
    <input class="promo-input" :value="modelValue" placeholder="输入优惠码" @input="handleInput" />
    <view class="promo-actions">
      <AppButton label="预览优惠码" tone="secondary" @click="$emit('submit')" />
    </view>
    <MetaRow v-if="preview && preview.status" :items="previewItems" />
  </AppCard>
</template>

<script>
import AppButton from "../ui/AppButton.vue";
import AppCard from "../ui/AppCard.vue";
import MetaRow from "../ui/MetaRow.vue";
import SectionHeader from "../ui/SectionHeader.vue";
import { formatMoneyFromFen } from "../../utils/format-money.js";

export default {
  components: {
    AppButton,
    AppCard,
    MetaRow,
    SectionHeader
  },
  props: {
    modelValue: {
      type: String,
      default: ""
    },
    preview: {
      type: Object,
      default: null
    }
  },
  emits: ["update:modelValue", "submit"],
  computed: {
    previewItems() {
      return [
        "Status " + this.preview.status,
        "Final " + formatMoneyFromFen(this.preview.final_amount_fen),
        this.preview.message || "Preview ready"
      ];
    }
  },
  methods: {
    handleInput(event) {
      this.$emit("update:modelValue", event.detail.value);
    }
  }
};
</script>

<style>
.promo-input {
  width: 100%;
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  box-sizing: border-box;
  border-radius: 18rpx;
  background: #ffffff;
  border: 1rpx solid #e0e3e6;
}

.promo-actions {
  margin-top: 16rpx;
}
</style>
