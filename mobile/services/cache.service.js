const memoryCache = new Map();
const CACHE_PREFIX = "stage_e0_mobile";
const CACHE_INDEX_KEY = [CACHE_PREFIX, "cache-index"].join(":");

function getUniStorage() {
  if (typeof uni !== "undefined" && uni && typeof uni.getStorageSync === "function") {
    return {
      get(key) {
        return uni.getStorageSync(key);
      },
      set(key, value) {
        uni.setStorageSync(key, value);
      },
      remove(key) {
        uni.removeStorageSync(key);
      }
    };
  }

  return {
    get(key) {
      return memoryCache.get(key);
    },
    set(key, value) {
      memoryCache.set(key, value);
    },
    remove(key) {
      memoryCache.delete(key);
    }
  };
}

function readValue(key) {
  const storage = getUniStorage();
  const rawValue = storage.get(key);

  if (!rawValue) {
    return null;
  }

  if (typeof rawValue === "string") {
    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return null;
    }
  }

  return rawValue;
}

function writeValue(key, value) {
  const storage = getUniStorage();
  storage.set(key, JSON.stringify(value));
}

function readCacheIndex() {
  return readValue(CACHE_INDEX_KEY) || [];
}

function writeCacheIndex(keys) {
  writeValue(CACHE_INDEX_KEY, keys);
}

function registerKey(key) {
  const keys = readCacheIndex();

  if (keys.indexOf(key) === -1) {
    keys.push(key);
    writeCacheIndex(keys);
  }
}

export function buildBootstrapCacheKey(productKey) {
  return [CACHE_PREFIX, productKey, "bootstrap-config"].join(":");
}

export function buildFeedCacheKey(productKey) {
  return [CACHE_PREFIX, productKey, "feed"].join(":");
}

export function buildDetailCacheKey(productKey, articleId, audienceMode, readingMode) {
  return [CACHE_PREFIX, productKey, "detail", articleId, audienceMode, readingMode].join(":");
}

export function buildPricingCacheKey(productKey) {
  return [CACHE_PREFIX, productKey, "pricing-preview"].join(":");
}

export function buildEntitlementCacheKey(productKey, subjectId) {
  return [CACHE_PREFIX, productKey, "entitlement", subjectId].join(":");
}

export function buildSettingsCacheKey() {
  return [CACHE_PREFIX, "settings"].join(":");
}

export function buildSessionCacheKey() {
  return [CACHE_PREFIX, "session"].join(":");
}

export function buildUiStateCacheKey(scope) {
  return [CACHE_PREFIX, "ui", scope].join(":");
}

export function getCachedValue(key) {
  return readValue(key);
}

export function setCachedValue(key, value) {
  registerKey(key);
  writeValue(key, value);
}

export function listCachedKeys() {
  return readCacheIndex();
}

export function getCacheDebugSummary() {
  const keys = readCacheIndex();

  return {
    tracked_key_count: keys.length,
    tracked_keys: keys
  };
}

export function resetRuntimeCache() {
  const keys = readCacheIndex().concat([buildSettingsCacheKey(), buildSessionCacheKey(), CACHE_INDEX_KEY]);

  keys.forEach((key) => {
    getUniStorage().remove(key);
    memoryCache.delete(key);
  });
}
