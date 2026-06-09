export function isDevVisibilityEnabled() {
  return String(process.env.VUE_APP_DEV_VISIBILITY || "").trim().toLowerCase() === "true";
}
