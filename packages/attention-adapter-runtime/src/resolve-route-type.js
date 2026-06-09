export function resolveRouteType(input) {
  if (!input) {
    return null;
  }

  if (typeof input === "string") {
    return input === "direct" || input === "family" ? input : null;
  }

  if (input.route_type === "direct" || input.route_type === "family") {
    return input.route_type;
  }

  if (input.adapter_route_type === "direct" || input.adapter_route_type === "family") {
    return input.adapter_route_type;
  }

  return null;
}
