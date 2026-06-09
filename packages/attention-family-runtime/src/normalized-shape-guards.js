const expectedShapeByFamilyKind = Object.freeze({
  transcript_first_longform: "transcript_first_longform_normalized_shape",
  official_structured_sources: "official_structured_sources_normalized_shape"
});

const sharedProjectionKeys = ["content_ref", "content_variant_key", "content_list_item", "content_detail_envelope"];

export function getExpectedNormalizedShapeName(family_kind) {
  return expectedShapeByFamilyKind[family_kind] || null;
}

export function isFamilyNormalizedShape(family_kind, candidate = {}) {
  const expected = getExpectedNormalizedShapeName(family_kind);
  if (!expected) {
    return false;
  }

  if (candidate.normalized_shape_name !== expected) {
    return false;
  }

  return !sharedProjectionKeys.some((field) => field in candidate);
}

export function assertFamilyNormalizedShape(family_kind, candidate = {}) {
  if (!isFamilyNormalizedShape(family_kind, candidate)) {
    throw new Error(`invalid_family_normalized_shape:${family_kind}`);
  }

  return candidate;
}
