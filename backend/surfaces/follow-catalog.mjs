import { assertProductKey } from "../guards/request-guards.mjs";

export function createFollowCatalogSurface({ repository, runtimeConfig }) {
  return function followCatalog(request) {
    assertProductKey(request, runtimeConfig);
    const catalog = repository.listFollowCatalog();
    const catalogType = request.catalog_type || "all";

    return {
      subjects:
        catalogType === "publication"
          ? catalog.publications
          : catalogType === "topic_tag"
            ? catalog.tags
            : [...catalog.publications, ...catalog.tags],
      cursor: null,
      has_more: false
    };
  };
}
