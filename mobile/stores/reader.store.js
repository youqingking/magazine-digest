import {
  buildSettingsCacheKey,
  getCachedValue,
  setCachedValue
} from "../services/cache.service.js";

const cachedSettings = getCachedValue(buildSettingsCacheKey()) || {};

const readerState = {
  currentArticleId: null,
  currentVariantId: null,
  readingMode: cachedSettings.reading_mode || "deep_3m",
  audienceMode: cachedSettings.audience_mode || "general",
  entrySource: "feed",
  status: "idle",
  errorMessage: null,
  unavailableReason: null
};

function persistReaderSettings() {
  const currentSettings = getCachedValue(buildSettingsCacheKey()) || {};
  setCachedValue(buildSettingsCacheKey(), {
    ...currentSettings,
    audience_mode: readerState.audienceMode,
    reading_mode: readerState.readingMode
  });
}

export function getReaderState() {
  return readerState;
}

export function setCurrentArticle(articleId) {
  readerState.currentArticleId = articleId;
}

export function setResolvedVariant(variantId) {
  readerState.currentVariantId = variantId;
}

export function setEntrySource(entrySource) {
  readerState.entrySource = entrySource || "feed";
}

export function setReadingMode(readingMode) {
  readerState.readingMode = readingMode;
  persistReaderSettings();
}

export function setAudienceMode(audienceMode) {
  readerState.audienceMode = audienceMode;
  persistReaderSettings();
}

export function setReaderStatus(status, errorMessage = null, unavailableReason = null) {
  readerState.status = status;
  readerState.errorMessage = errorMessage;
  readerState.unavailableReason = unavailableReason;
}
