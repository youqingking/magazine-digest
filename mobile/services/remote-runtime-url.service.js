function stripRemoteRuntimeSuffix(pathname) {
  return String(pathname || "")
    .replace(/\/channels\/[^/]+\/manifest\.json$/i, "")
    .replace(/\/releases\/[^/]+\/manifest\.json$/i, "")
    .replace(/\/releases\/[^/]+\/bundle\.json$/i, "")
    .replace(/\/releases\/[^/]+\/provenance\.json$/i, "")
    .replace(/\/index\.json$/i, "");
}

export function normalizeRemoteRuntimeBaseUrl(rawUrl) {
  const fallbackValue = String(rawUrl || "").trim();
  if (!fallbackValue) {
    return "";
  }
  if (!/^https?:\/\//i.test(fallbackValue)) {
    return fallbackValue.replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
  try {
    const parsedUrl = new URL(fallbackValue);
    parsedUrl.hash = "";
    parsedUrl.search = "";
    const normalizedPathname = stripRemoteRuntimeSuffix(parsedUrl.pathname).replace(/\/+$/, "");
    parsedUrl.pathname = normalizedPathname || "/";
    return parsedUrl.toString().replace(/\/+$/, "");
  } catch (error) {
    return fallbackValue.replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
}

export function isLoopbackRemoteRuntimeBaseUrl(rawUrl) {
  const normalizedBaseUrl = normalizeRemoteRuntimeBaseUrl(rawUrl);
  if (!normalizedBaseUrl || !/^https?:\/\//i.test(normalizedBaseUrl)) {
    return false;
  }
  try {
    const parsedUrl = new URL(normalizedBaseUrl);
    return ["127.0.0.1", "localhost"].includes(String(parsedUrl.hostname || "").toLowerCase());
  } catch (error) {
    return /^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?(?:\/|$)/i.test(normalizedBaseUrl);
  }
}
