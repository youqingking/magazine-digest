import crypto from "node:crypto";
import { assertProductKey, assertRequiredString } from "../guards/request-guards.mjs";

function pickBucket(seed, buckets) {
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  const numeric = parseInt(hash.slice(0, 8), 16) % 100;
  let cursor = 0;

  for (const bucket of buckets) {
    cursor += bucket.weight;
    if (numeric < cursor) {
      return bucket.bucket_key;
    }
  }

  return buckets[0]?.bucket_key ?? "default";
}

export function createExperimentAssignSurface({ repository, runtimeConfig }) {
  return function experimentAssign(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const installationId = assertRequiredString(
      "installation_id",
      request.installation_id
    );
    const experiment = repository.listExperiments(productKey)[0];

    return {
      product_key: productKey,
      installation_id: installationId,
      experiment_id: experiment?._id ?? null,
      experiment_key: experiment?.experiment_key ?? null,
      assignment_version: experiment?.assignment_version ?? 0,
      bucket_key: experiment
        ? pickBucket(
            productKey + ":" + installationId + ":" + experiment._id,
            experiment.bucket_definitions
          )
        : null,
      assignment_source: "local_fixture_backed",
      cache_ttl_seconds: 3600
    };
  };
}
