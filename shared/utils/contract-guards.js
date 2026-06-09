export function assertAllowedValue(label, value, allowedValues) {
  if (!allowedValues.includes(value)) {
    throw new Error(
      "[contract] " + label + " must be one of: " + allowedValues.join(", ")
    );
  }
  return value;
}
