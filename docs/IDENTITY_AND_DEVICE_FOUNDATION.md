# Identity And Device Foundation

- H0 adds `auth-session`, `auth-refresh`, and `auth-signout` surfaces as stable seams
- H0 adds `register-device` as the installation/device registration seam
- auth remains local-first and remote-ready; real sign-in policy is deferred
- `device_installations` is reused with additive fields for `device_id`, push capability, and remote runtime metadata
- `user_profiles` and `user_product_profiles` receive additive auth/device/push linkage fields only

## Mobile scope

- settings shows runtime, auth, device, and push placeholder state
- profile shows auth/session/device summary without becoming a full account center
- H0.5 adds a dev-safe `Auth test entry` for username/password-only validation prep
- H0.5 surfaces `uniCloud.getCurrentUserInfo()` summary and signout entry without turning settings/profile into a full account center
- H0.5 keeps `register-device` and `setPushCid` as additive hook points only
- `passwordSecret` and `tokenSecret` must be provided manually in local `uni-id` config before real auth checks
