<script>
import { refreshReleaseUpdateSummary, isRemoteBridgeReady } from "./services/release-update.service.js";

export default {
  onLaunch() {
    if (isRemoteBridgeReady()) {
      refreshReleaseUpdateSummary().catch(() => null);
    }
  },
  onShow() {
    if (isRemoteBridgeReady()) {
      refreshReleaseUpdateSummary().catch(() => null);
    }
  },
  onHide() {}
};
</script>

<style>
page {
  background: #f4f1ea;
  min-height: 100%;
}
</style>
