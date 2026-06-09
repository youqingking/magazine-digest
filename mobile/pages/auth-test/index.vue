<template>
  <view :style="$theme.pageShell">
    <text class="auth-test-sentinel">AUTH_TEST_PAGE_READY</text>
    <SectionHeader
      title="Auth test entry"
      description="smoke_only not_production_path. Dev-safe auth and device verification entry, not a production account or payment path."
    />

    <view :style="$theme.pageSection">
      <view :style="$theme.sectionStack">
        <AppCard tone="muted">
          <SectionHeader title="Boundary" description="Keep this route available for smoke and manual verification only." />
          <MetaRow :items="boundaryMeta" />
          <text class="boundary-note">smoke_only not_production_path. Success here does not mean H1 payment, create order, webhook, or entitlement activation is complete.</text>
        </AppCard>

        <AppCard>
          <SectionHeader title="Primary actions" description="AUTH_TEST_PRIMARY_ACTIONS. Keep the first-screen flow minimal on mobile." />
          <view class="field-stack">
            <input v-model="username" class="auth-input" placeholder="Test username" />
            <input v-model="password" class="auth-input" password placeholder="Test password" />
          </view>
          <MetaRow :items="primaryActionMeta" />
          <view class="settings-actions">
            <AppButton label="Auto login" tone="secondary" @click="autoLogin" />
            <AppButton label="Open password login" tone="secondary" @click="openPasswordLogin" />
            <AppButton label="Verify device records" tone="secondary" @click="verifyDeviceRecordsNow" />
            <AppButton label="Prepare test input" tone="secondary" @click="preparePasswordTest" />
          </view>
        </AppCard>

        <AppCard tone="muted">
          <SectionHeader title="Summary" description="AUTH_TEST_SUMMARY. First-screen result for smoke and manual validation." />
          <MetaRow :items="summaryMeta" />
          <text class="automation-summary">{{ automationSummary }}</text>
          <view class="settings-actions">
            <AppButton label="Refresh current user" tone="secondary" @click="refreshCurrentUserInfo" />
            <AppButton label="Refresh session" tone="secondary" @click="refreshSession" />
            <AppButton :label="showSecondaryStatus ? 'Hide secondary status' : 'Show secondary status'" tone="secondary" @click="toggleSecondaryStatus" />
          </view>
        </AppCard>

        <view v-if="showSecondaryStatus" class="status-stack">
          <AppCard tone="muted">
            <SectionHeader title="Basic status" description="Core runtime, auth, device, and push state without long debug dumps." />
            <MetaRow :items="basicStatusMeta" />
            <view class="settings-actions">
              <AppButton label="Get push clientid" tone="secondary" @click="refreshPushClientId" />
              <AppButton label="Register device" tone="secondary" @click="registerDeviceOnly" />
              <AppButton label="Register device / setPushCid" tone="secondary" @click="registerDeviceWithCid" />
              <AppButton label="Sign out" tone="secondary" @click="signOutSession" />
            </view>
          </AppCard>

          <AuthStateCard :session="auth.session" :current-user-info="auth.currentUserInfo" />
          <DeviceStateCard :device="deviceState" />
          <PushStateCard :capability="pushCapability" :preview="pushPreview" />
        </view>

        <AppCard tone="muted">
          <SectionHeader title="Advanced debug" description="AUTH_TEST_ADVANCED_DEBUG. Expanded only when deeper H0.5 diagnostics are needed." />
          <MetaRow :items="advancedDebugMeta" />
          <view class="settings-actions">
            <AppButton :label="showAdvancedDebug ? 'Hide advanced debug' : 'Show advanced debug'" tone="secondary" @click="toggleAdvancedDebug" />
          </view>
        </AppCard>

        <view v-if="showAdvancedDebug" class="status-stack">
          <AppCard tone="muted">
            <SectionHeader title="Current user info" description="Uses uniCloud.getCurrentUserInfo() when the runtime supports it." />
            <MetaRow :items="currentUserMeta" />
          </AppCard>

          <AppCard tone="muted">
            <SectionHeader title="Push and device hooks" description="Read-only push cid inspection plus register-device hook." />
            <MetaRow :items="pushHookMeta" />
          </AppCard>

          <DeviceDiagnosticCard :diagnostics="auth.deviceDiagnostics" />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import AuthStateCard from "../../components/account/AuthStateCard.vue";
import DeviceDiagnosticCard from "../../components/account/DeviceDiagnosticCard.vue";
import DeviceStateCard from "../../components/account/DeviceStateCard.vue";
import PushStateCard from "../../components/account/PushStateCard.vue";
import AppButton from "../../components/ui/AppButton.vue";
import AppCard from "../../components/ui/AppCard.vue";
import MetaRow from "../../components/ui/MetaRow.vue";
import SectionHeader from "../../components/ui/SectionHeader.vue";
import {
  loginWithPassword,
  loadAuthSession,
  loadCurrentUserInfo,
  preparePasswordAuthTest,
  refreshAuthSession,
  runWebPasswordAutomation,
  signOutAuthSession
} from "../../services/auth.service.js";
import { registerCurrentDevice, setPushCidForCurrentDevice, verifyCurrentDeviceRecords } from "../../services/device.service.js";
import { ingestRuntimeEvent } from "../../services/event-ingest.service.js";
import { loadNotificationDeliveryPreview, loadPushCapability, loadPushClientId } from "../../services/push.service.js";
import { getAuthState } from "../../stores/auth.store.js";
import { getRuntimeState } from "../../stores/runtime.store.js";

export default {
  components: {
    AuthStateCard,
    DeviceDiagnosticCard,
    DeviceStateCard,
    PushStateCard,
    AppButton,
    AppCard,
    MetaRow,
    SectionHeader
  },
  data() {
    return {
      auth: getAuthState(),
      runtime: getRuntimeState(),
      username: "",
      password: "",
      automationRequest: {
        autoRun: false,
        hasRun: false,
        inProgress: false
      },
      showSecondaryStatus: false,
      showAdvancedDebug: false,
      autoLoginState: null,
      deviceState: null,
      dbVerificationState: null,
      pushCapability: null,
      pushPreview: null,
      pushClientIdState: null
    };
  },
  computed: {
    boundaryMeta() {
      return [
        "Boundary smoke_only",
        "Path not_production_path",
        "Page /pages/auth-test/index",
        "Cloud h0_5-web-auth-smoke"
      ];
    },
    primaryActionMeta() {
      return [
        "Prep " + (this.auth.passwordPrep?.status || "idle"),
        "Username " + (this.auth.passwordPrep?.username || "missing"),
        "Password " + (this.auth.passwordPrep?.password_present ? "present" : "missing"),
        "Route " + (this.auth.passwordPrep?.uni_id_pages_path || "/uni_modules/uni-id-pages/pages/login/login-withpwd")
      ];
    },
    currentUserMeta() {
      return [
        "State " + (this.auth.currentUserInfo?.state || "unknown"),
        "UID " + (this.auth.currentUserInfo?.uid || "none"),
        "Roles " + (this.auth.currentUserInfo?.role_count ?? 0),
        "Permissions " + (this.auth.currentUserInfo?.permission_count ?? 0),
        "TokenExpired " + (this.auth.currentUserInfo?.token_expired ? "yes" : "no")
      ];
    },
    pushHookMeta() {
      return [
        "Push support " + (this.pushClientIdState?.supported ? "yes" : "no"),
        "Push cid " + (this.pushClientIdState?.push_clientid || "missing"),
        "Register " + (this.deviceState?.registration_state || "pending"),
        "Push capability " + (this.pushCapability?.capability_state || "unknown"),
        "Device source " + (this.deviceState?.source || "unknown"),
        "Last error " + (this.auth.deviceDiagnostics?.last_remote_error || "none")
      ];
    },
    summaryMeta() {
      return [
        "Login " + (this.autoLoginState?.login_state || "idle"),
        "UID " + (this.autoLoginState?.uid || this.auth.currentUserInfo?.uid || "none"),
        "DB " + (this.dbVerificationState?.status || "idle"),
        "opendb-device " + (this.dbVerificationState?.device_found ? "yes" : "no"),
        "uni-id-device " + (this.dbVerificationState?.user_device_found ? "yes" : "no")
      ];
    },
    basicStatusMeta() {
      return [
        "Session " + (this.auth.session?.session_state || "unknown"),
        "Token " + (this.auth.session?.token_state || "unknown"),
        "Register " + (this.deviceState?.registration_state || "pending"),
        "Push capability " + (this.pushCapability?.capability_state || "unknown"),
        "Preview " + (this.pushPreview?.transport_decision || "idle"),
        "Source " + (this.deviceState?.source || "unknown")
      ];
    },
    advancedDebugMeta() {
      return [
        "Debug " + (this.showAdvancedDebug ? "expanded" : "collapsed"),
        "Login error " + (this.autoLoginState?.error_message || "none"),
        "DB error " + (this.dbVerificationState?.blocking_reason || "none"),
        "Diag source " + (this.auth.deviceDiagnostics?.device_sync_source || "unknown"),
        "Diag error " + (this.auth.deviceDiagnostics?.last_remote_error || "none"),
        "Push cid " + (this.pushClientIdState?.push_clientid || "missing")
      ];
    },
    automationSummary() {
      return [
        "AUTOMATION_SUMMARY",
        "login=" + (this.autoLoginState?.login_state || "idle"),
        "uid=" + (this.autoLoginState?.uid || this.auth.currentUserInfo?.uid || "none"),
        "login_error=" + (this.autoLoginState?.error_message || "none"),
        "session=" + (this.auth.session?.session_state || "unknown"),
        "token=" + (this.auth.session?.token_state || "unknown"),
        "device=" + (this.deviceState?.registration_state || "pending"),
        "db=" + (this.dbVerificationState?.status || "idle"),
        "device_found=" + (this.dbVerificationState?.device_found ? "yes" : "no"),
        "user_device_found=" + (this.dbVerificationState?.user_device_found ? "yes" : "no"),
        "db_error=" + (this.dbVerificationState?.blocking_reason || "none")
      ].join(" ");
    }
  },
  onLoad(options) {
    const automationUsername = options?.automation_username || options?.username || "";
    const automationPassword = options?.automation_password || options?.password || "";
    const automationMode = options?.automation_mode || options?.mode || "";

    this.username = automationUsername;
    this.password = automationPassword;
    this.automationRequest = {
      autoRun: automationMode === "full",
      hasRun: false,
      inProgress: false
    };

    if (automationUsername || automationPassword) {
      preparePasswordAuthTest({
        username: automationUsername,
        password: automationPassword
      });
    }
  },
  async onShow() {
    try {
      await this.refreshFoundation();
    } catch (error) {
      this.autoLoginState = {
        login_state: "idle",
        uid: null,
        error_message: error?.message || error?.errMsg || "FOUNDATION_REFRESH_FAILED"
      };
    }
    await this.runAutomationIfNeeded();
  },
  methods: {
    async refreshFoundation() {
      await loadAuthSession();
      await loadCurrentUserInfo();
      this.pushClientIdState = await loadPushClientId();
      this.deviceState = await registerCurrentDevice({
        push_clientid: this.pushClientIdState?.push_clientid || null,
        appid: this.runtime.remoteAppId || null
      });
      this.pushCapability = await loadPushCapability({
        push_clientid: this.pushClientIdState?.push_clientid || null,
        permission_state: this.pushClientIdState?.push_clientid ? "granted" : "prompt",
        appid: this.runtime.pushAppId || this.runtime.remoteAppId || null
      });
      this.pushPreview = await loadNotificationDeliveryPreview({
        notification_inbox_id: "auth_test_preview"
      });
    },
    preparePasswordTest() {
      const prep = preparePasswordAuthTest({
        username: this.username,
        password: this.password
      });
      if (prep.status !== "ready_for_manual_login") {
        uni.showToast({
          title: "AUTH_INPUT_MISSING",
          icon: "none"
        });
      }
    },
    toggleSecondaryStatus() {
      this.showSecondaryStatus = !this.showSecondaryStatus;
    },
    toggleAdvancedDebug() {
      this.showAdvancedDebug = !this.showAdvancedDebug;
    },
    async runAutomationIfNeeded() {
      if (!this.automationRequest.autoRun || this.automationRequest.hasRun || this.automationRequest.inProgress) {
        return;
      }

      this.automationRequest.inProgress = true;

      try {
        if (typeof window !== "undefined") {
          const webAutomation = await runWebPasswordAutomation({
            username: this.username,
            password: this.password,
            installation_id: this.deviceState?.installation_id || null,
            device_id: this.deviceState?.device_id || null,
            push_clientid: this.pushClientIdState?.push_clientid || null,
            appid: this.runtime.remoteAppId || null
          });

          this.autoLoginState = {
            login_state: webAutomation.login_state,
            uid: webAutomation.uid,
            session_state: webAutomation.session_state,
            token_state: webAutomation.token_state,
            error_message: ""
          };
          this.deviceState = {
            ...(this.deviceState || {}),
            ...(webAutomation.device_record || {})
          };
          this.dbVerificationState = webAutomation.db_verification || null;
          await loadAuthSession();
          await loadCurrentUserInfo();
          return;
        }

        if (this.username && this.password) {
          this.autoLoginState = await loginWithPassword({
            username: this.username,
            password: this.password
          });
        }

        await this.refreshFoundation();
        await loadCurrentUserInfo();
        this.pushClientIdState = await loadPushClientId();
        this.pushCapability = await loadPushCapability({
          push_clientid: this.pushClientIdState?.push_clientid || null,
          permission_state: this.pushClientIdState?.push_clientid ? "granted" : "prompt",
          appid: this.runtime.pushAppId || this.runtime.remoteAppId || null
        });
        this.deviceState = await setPushCidForCurrentDevice(this.pushClientIdState?.push_clientid || null, {
          appid: this.runtime.remoteAppId || null
        });
        this.dbVerificationState = await verifyCurrentDeviceRecords();
      } catch (error) {
        this.autoLoginState = {
          login_state: "failed",
          uid: null,
          error_message: error?.message || error?.errMsg || "AUTOMATION_RUN_FAILED"
        };
      } finally {
        this.automationRequest.hasRun = true;
        this.automationRequest.inProgress = false;
      }
    },
    async autoLogin() {
      uni.showLoading({
        title: "Signing in"
      });
      try {
        this.autoLoginState = await loginWithPassword({
          username: this.username,
          password: this.password
        });
        await this.refreshFoundation();
        uni.showToast({
          title: this.autoLoginState?.uid ? "LOGIN_OK" : "LOGIN_UID_MISSING",
          icon: "none"
        });
      } catch (error) {
        this.autoLoginState = {
          login_state: error?.errCode === "uni-id-captcha-required" ? "captcha_required" : "failed",
          uid: null,
          error_message: error?.message || error?.errMsg || "LOGIN_FAILED"
        };
        uni.showToast({
          title: this.autoLoginState.error_message,
          icon: "none"
        });
      } finally {
        uni.hideLoading();
      }
    },
    async openPasswordLogin() {
      const prep = preparePasswordAuthTest({
        username: this.username,
        password: this.password
      });
      await ingestRuntimeEvent("auth_signin_placeholder", {
        auth_path: prep.auth_path,
        username_present: prep.username_present,
        password_present: prep.password_present,
        target_route: prep.uni_id_pages_path
      });
      uni.navigateTo({
        url: prep.uni_id_pages_path,
        fail: () => {
          uni.showToast({
            title: "UNI_ID_PAGES_MISSING",
            icon: "none"
          });
        }
      });
    },
    async refreshCurrentUserInfo() {
      await loadCurrentUserInfo();
      uni.showToast({
        title: "CURRENT_USER_REFRESHED",
        icon: "none"
      });
    },
    async refreshSession() {
      try {
        await refreshAuthSession();
        await loadCurrentUserInfo();
        uni.showToast({
          title: "SESSION_REFRESHED",
          icon: "none"
        });
      } catch (error) {
        uni.showToast({
          title: error?.message || "AUTH_EXPIRED_RELOGIN_REQUIRED",
          icon: "none"
        });
      }
    },
    async signOutSession() {
      await signOutAuthSession();
      await loadCurrentUserInfo();
      await ingestRuntimeEvent("auth_signout", {
        runtime_mode: this.runtime.runtimeMode
      });
      uni.showToast({
        title: "SIGNED_OUT",
        icon: "none"
      });
    },
    async refreshPushClientId() {
      this.pushClientIdState = await loadPushClientId();
      this.pushCapability = await loadPushCapability({
        push_clientid: this.pushClientIdState?.push_clientid || null,
        permission_state: this.pushClientIdState?.push_clientid ? "granted" : "prompt",
        appid: this.runtime.pushAppId || this.runtime.remoteAppId || null
      });
      uni.showToast({
        title: this.pushClientIdState?.push_clientid ? "PUSH_CID_READY" : "PUSH_CID_MISSING",
        icon: "none"
      });
    },
    async registerDeviceOnly() {
      uni.showLoading({
        title: "Registering"
      });
      try {
        this.deviceState = await registerCurrentDevice({
          appid: this.runtime.remoteAppId || null
        });
        await ingestRuntimeEvent("device_register", {
          installation_id: this.deviceState?.installation_id || null,
          push_clientid: this.deviceState?.push_clientid || null
        });
        uni.showToast({
          title:
            this.deviceState?.registration_state === "precheck_blocked"
              ? this.deviceState?.remote_error_message || "AUTH_EXPIRED_RELOGIN_REQUIRED"
              : this.deviceState?.source === "uni-id-co.setPushCid"
                ? "DEVICE_SYNC_OK"
                : "DEVICE_SYNC_REMOTE_FAILED",
          icon: "none"
        });
      } catch (error) {
        uni.showToast({
          title: error?.message || "DEVICE_SYNC_REMOTE_FAILED",
          icon: "none"
        });
      } finally {
        uni.hideLoading();
      }
    },
    async registerDeviceWithCid() {
      uni.showLoading({
        title: "Registering"
      });
      try {
        this.deviceState = await setPushCidForCurrentDevice(this.pushClientIdState?.push_clientid || null, {
          appid: this.runtime.remoteAppId || null
        });
        await ingestRuntimeEvent("device_register", {
          installation_id: this.deviceState?.installation_id || null,
          push_clientid: this.deviceState?.push_clientid || null
        });
        uni.showToast({
          title:
            this.deviceState?.registration_state === "precheck_blocked"
              ? this.deviceState?.remote_error_message || "AUTH_EXPIRED_RELOGIN_REQUIRED"
              : this.deviceState?.source === "uni-id-co.setPushCid"
                ? "DEVICE_SYNC_OK"
                : "DEVICE_SYNC_REMOTE_FAILED",
          icon: "none"
        });
      } catch (error) {
        uni.showToast({
          title: error?.message || "DEVICE_SYNC_REMOTE_FAILED",
          icon: "none"
        });
      } finally {
        uni.hideLoading();
      }
    },
    async verifyDeviceRecordsNow() {
      this.dbVerificationState = await verifyCurrentDeviceRecords();
      uni.showToast({
        title:
          this.dbVerificationState?.status === "ok" &&
          this.dbVerificationState?.device_found &&
          this.dbVerificationState?.user_device_found
            ? "DEVICE_DB_OK"
            : this.dbVerificationState?.blocking_reason || "DEVICE_DB_MISSING",
        icon: "none"
      });
    }
  }
};
</script>

<style>
.auth-test-sentinel {
  display: block;
  margin-bottom: 12rpx;
  color: #2f6b3b;
  font-size: 24rpx;
  font-weight: 700;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  margin-top: 16rpx;
}

.status-stack {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.auth-input {
  width: 100%;
  box-sizing: border-box;
  padding: 20rpx 24rpx;
  border: 2rpx solid #d7deea;
  border-radius: 20rpx;
  background: #f7f9fc;
  color: #1d2736;
  font-size: 28rpx;
}

.settings-actions {
  margin-top: 20rpx;
}

.boundary-note {
  display: block;
  margin-top: 16rpx;
  color: #5d6675;
  font-size: 24rpx;
  line-height: 1.55;
}

.automation-summary {
  display: block;
  margin-top: 16rpx;
  color: #2c3a4b;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
