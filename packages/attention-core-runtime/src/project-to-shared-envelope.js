function normalizeTags(tags, fallbackTags = []) {
  if (Array.isArray(tags) && tags.length > 0) {
    return tags;
  }
  return fallbackTags;
}

function projectDirectMagazineSummary(raw_input = {}) {
  return Object.freeze({
    content_ref: {
      product_key: raw_input.product_key || "demo_cn_content",
      source_id: raw_input.publication_id || "unknown_publication",
      source_key: raw_input.publication_key || "unknown_publication",
      content_item_id: raw_input.article_id || "unknown_article",
      content_key: raw_input.article_key || "unknown_article",
      language: raw_input.language || "und"
    },
    content_variant_key: {
      product_key: raw_input.product_key || "demo_cn_content",
      content_item_id: raw_input.article_id || "unknown_article",
      language: raw_input.language || "und",
      audience_segment: raw_input.audience_segment || "general",
      reading_mode: raw_input.reading_mode || "quick_30s",
      revision: raw_input.revision || 1
    },
    content_list_item: {
      content_ref: "content_ref",
      primary_variant_key: "content_variant_key",
      title: raw_input.title || "",
      summary: raw_input.summary || "",
      tags: normalizeTags(raw_input.tags, Array.isArray(raw_input.print_taxonomy_path) ? raw_input.print_taxonomy_path : []),
      publish_status: raw_input.publish_status || "published",
      available_from: raw_input.available_from || null,
      available_until: raw_input.available_until || null,
      update_type: raw_input.update_type || "new_publish",
      update_priority: raw_input.update_priority || 100
    },
    content_detail_envelope: {
      content_ref: "content_ref",
      resolved_variant_key: "content_variant_key",
      title: raw_input.title || "",
      body: raw_input.body || raw_input.summary || "",
      body_format: raw_input.body_format || "markdown",
      tags: normalizeTags(raw_input.tags, Array.isArray(raw_input.print_taxonomy_path) ? raw_input.print_taxonomy_path : []),
      entitlement_snapshot: null,
      quota_snapshot: null,
      runtime_mode: "local",
      source: "direct_magazine_summary_adoption",
      fetched_at: raw_input.fetched_at || "2026-03-24T00:00:00+08:00"
    }
  });
}

function projectDirectYoutubeSummary(raw_input = {}) {
  return Object.freeze({
    content_ref: {
      product_key: raw_input.product_key || "demo_cn_content",
      source_id: raw_input.channel_id || "unknown_channel",
      source_key: raw_input.channel_key || "unknown_channel",
      content_item_id: raw_input.video_id || "unknown_video",
      content_key: raw_input.video_key || "unknown_video",
      language: raw_input.language || "und"
    },
    content_variant_key: {
      product_key: raw_input.product_key || "demo_cn_content",
      content_item_id: raw_input.video_id || "unknown_video",
      language: raw_input.language || "und",
      audience_segment: raw_input.audience_segment || "general",
      reading_mode: raw_input.reading_mode || "quick_30s",
      revision: raw_input.revision || 1
    },
    content_list_item: {
      content_ref: "content_ref",
      primary_variant_key: "content_variant_key",
      title: raw_input.title || "",
      summary: raw_input.summary || "",
      tags: normalizeTags(raw_input.tags, ["ai", "video_summary"]),
      publish_status: raw_input.publish_status || "published",
      available_from: raw_input.available_from || null,
      available_until: raw_input.available_until || null,
      update_type: raw_input.update_type || "revision",
      update_priority: raw_input.update_priority || 80
    },
    content_detail_envelope: {
      content_ref: "content_ref",
      resolved_variant_key: "content_variant_key",
      title: raw_input.title || "",
      body: raw_input.body || raw_input.summary || "",
      body_format: raw_input.body_format || "markdown",
      tags: normalizeTags(raw_input.tags, ["ai", "video_summary"]),
      entitlement_snapshot: null,
      quota_snapshot: null,
      runtime_mode: "local",
      source: "direct_youtube_summary_adoption",
      fetched_at: raw_input.fetched_at || "2026-03-24T00:00:00+08:00"
    }
  });
}

function projectFamilyPodcastTranscript(raw_input = {}, family_normalized_shape = {}) {
  const inferredBody =
    raw_input.summary_body ||
    (Array.isArray(family_normalized_shape.transcript_segments) && family_normalized_shape.transcript_segments.length > 0
      ? family_normalized_shape.transcript_segments.map((segment) => segment.text).join(" ").trim()
      : "") ||
    "Transcript-derived longform summary";

  return Object.freeze({
    content_ref: {
      product_key: raw_input.product_key || "demo_audio_digest",
      source_id: raw_input.show_id || "show_unknown",
      source_key: raw_input.podcast_show_key || "unknown_show",
      content_item_id: raw_input.podcast_episode_id || "unknown_episode",
      content_key:
        raw_input.episode_key ||
        (raw_input.podcast_show_key && raw_input.podcast_episode_id
          ? `${raw_input.podcast_show_key}_${String(raw_input.podcast_episode_id).replace(/^pod_ep_/, "")}`
          : "unknown_episode_key"),
      language: raw_input.language || "und"
    },
    content_detail_envelope: {
      content_ref: "content_ref",
      resolved_variant_key: null,
      title: raw_input.episode_title || "Untitled episode",
      body: inferredBody,
      body_format: raw_input.body_format || "markdown",
      tags: normalizeTags(raw_input.tags, ["podcast", "transcript_first_longform"]),
      entitlement_snapshot: null,
      quota_snapshot: null,
      runtime_mode: "local",
      source: "family_podcast_transcript_adoption",
      fetched_at: raw_input.fetched_at || "2026-03-24T00:00:00+08:00"
    }
  });
}

function projectFamilySecFiling(raw_input = {}, family_normalized_shape = {}) {
  const recordRef = family_normalized_shape.structured_record_ref || {};
  return Object.freeze({
    content_ref: {
      product_key: raw_input.product_key || "demo_official_records",
      source_id: raw_input.source_id || "sec_edgar",
      source_key: raw_input.source_key || "sec_edgar",
      content_item_id: recordRef.record_id || "sec_unknown",
      content_key: recordRef.record_key || "unknown_record_key",
      language: raw_input.language || "en"
    },
    content_list_item: {
      content_ref: "content_ref",
      primary_variant_key: null,
      title: raw_input.title || `${raw_input.issuer_name || "Unknown issuer"} ${raw_input.form_type || "record"}`,
      summary: raw_input.summary || "Structured filing summary",
      tags: normalizeTags(raw_input.tags, ["official_record", "filing"]),
      publish_status: raw_input.publish_status || "published",
      available_from: raw_input.available_from || raw_input.filed_at || null,
      available_until: null,
      update_type: raw_input.update_type || "new_publish",
      update_priority: raw_input.update_priority || 80
    },
    content_detail_envelope: {
      content_ref: "content_ref",
      resolved_variant_key: null,
      title: raw_input.title || `${raw_input.issuer_name || "Unknown issuer"} ${raw_input.form_type || "record"}`,
      body: raw_input.body || raw_input.summary || "Structured filing summary",
      body_format: raw_input.body_format || "markdown",
      tags: normalizeTags(raw_input.tags, ["official_record", "filing"]),
      entitlement_snapshot: null,
      quota_snapshot: null,
      runtime_mode: "local",
      source: "family_sec_filing_adoption",
      fetched_at: raw_input.fetched_at || "2026-03-24T00:00:00+08:00"
    }
  });
}

export function projectToSharedEnvelope({ adapter_id, raw_input = {}, family_normalized_shape = null }) {
  switch (adapter_id) {
    case "direct-magazine-summary":
      return projectDirectMagazineSummary(raw_input);
    case "direct-youtube-summary":
      return projectDirectYoutubeSummary(raw_input);
    case "family-podcast-transcript":
      return projectFamilyPodcastTranscript(raw_input, family_normalized_shape || {});
    case "family-sec-filing":
      return projectFamilySecFiling(raw_input, family_normalized_shape || {});
    default:
      throw new Error(`unsupported_shared_projection:${adapter_id}`);
  }
}
