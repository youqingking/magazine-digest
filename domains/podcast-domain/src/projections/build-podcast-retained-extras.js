import { buildRetainedExtras } from "../../../../packages/attention-adapter-runtime/src/build-retained-extras.js";

const podcastDomainOnlySemantics = Object.freeze([
  "show_id",
  "show_title",
  "episode_title",
  "guest_names",
  "chapter_titles",
  "feed_url",
  "episode_number",
  "season_number",
  "audio_source_url",
  "source_platform",
  "podcast_network",
  "enclosure_url"
]);

export function buildPodcastRetainedExtras({ raw_input, mapping_execution } = {}) {
  return buildRetainedExtras({
    adapter_only_extras: mapping_execution?.retained_extras || [],
    domain_only_extras: podcastDomainOnlySemantics.filter((field) => field in (raw_input || {}))
  });
}
