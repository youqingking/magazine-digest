import {
  normalizeOfficialStructuredSources,
  normalizeTranscriptFirstLongform,
  officialStructuredSourcesNormalizerName,
  transcriptFirstLongformNormalizerName
} from "./normalizers/index.js";
import { assertFamilyNormalizedShape, getExpectedNormalizedShapeName } from "./normalized-shape-guards.js";

export function runFamilyNormalizer({ family_kind, raw_input = {} }) {
  let normalized_shape;
  let normalizer_name;

  if (family_kind === "transcript_first_longform") {
    normalized_shape = normalizeTranscriptFirstLongform(raw_input);
    normalizer_name = transcriptFirstLongformNormalizerName;
  } else if (family_kind === "official_structured_sources") {
    normalized_shape = normalizeOfficialStructuredSources(raw_input);
    normalizer_name = officialStructuredSourcesNormalizerName;
  } else {
    throw new Error(`unsupported_family_normalizer:${family_kind}`);
  }

  assertFamilyNormalizedShape(family_kind, normalized_shape);

  return Object.freeze({
    family_kind,
    normalizer_name,
    normalized_shape_name: getExpectedNormalizedShapeName(family_kind),
    normalized_shape
  });
}
