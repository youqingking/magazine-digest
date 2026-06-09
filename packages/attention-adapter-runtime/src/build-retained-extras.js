function unique(list = []) {
  return [...new Set((Array.isArray(list) ? list : []).filter(Boolean))];
}

export function buildRetainedExtras({ adapter_only_extras = [], domain_only_extras = [] } = {}) {
  const adapter_only = unique(adapter_only_extras);
  const domain_only = unique(domain_only_extras);

  return Object.freeze({
    adapter_only: Object.freeze(adapter_only),
    domain_only: Object.freeze(domain_only),
    all_keys: Object.freeze(unique([...adapter_only, ...domain_only]))
  });
}
