import { assertProductKey } from "../guards/request-guards.mjs";

export function createSearchContentSurface({ repository, runtimeConfig }) {
  return function searchContent(request) {
    const productKey = assertProductKey(request, runtimeConfig);
    const result = repository.searchContent(
      productKey,
      request.query || "",
      request.filters || {},
      Number(request.limit || 20)
    );

    return {
      items: result.items,
      facets: result.facets,
      cursor: null,
      has_more: false
    };
  };
}
