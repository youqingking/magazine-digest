export const colorRoles = {
  bgCanvas: "#f6f5f0",
  bgMuted: "#f0eee8",
  surfaceBase: "#f6f5f0",
  surfaceMuted: "#f4f2ec",
  surfaceRaised: "#fcfcfa",
  surfaceTint: "#eef1ea",
  textPrimary: "#1f2933",
  textSecondary: "#52606d",
  textMuted: "#7b8794",
  textInverse: "#ffffff",
  borderSubtle: "#e3e6df",
  borderStrong: "#cbd2c5",
  borderAccent: "#788896",
  accentPrimary: "#52606d",
  accentPrimaryStrong: "#415161",
  accentSoft: "#e7ece4",
  successSurface: "#edf5ee",
  successText: "#44624d",
  warningSurface: "#f8f1df",
  warningText: "#8a6a2f",
  errorSurface: "#f7ebea",
  errorText: "#9b4d4d",
  infoSurface: "#eef1ea",
  infoText: "#52606d"
};

export const spacingScale = {
  none: "0rpx",
  xxs: "8rpx",
  xs: "12rpx",
  sm: "16rpx",
  md: "24rpx",
  lg: "32rpx",
  xl: "40rpx",
  xxl: "56rpx"
};

export const radiusScale = {
  sm: "14rpx",
  md: "22rpx",
  lg: "28rpx",
  pill: "999rpx"
};

export const elevationScale = {
  flat: "none",
  card: "0 12rpx 28rpx rgba(15, 23, 42, 0.035)",
  raised: "0 18rpx 42rpx rgba(15, 23, 42, 0.05)"
};

export const typographyScale = {
  display: "48rpx",
  h1: "42rpx",
  h2: "34rpx",
  h3: "30rpx",
  title: "32rpx",
  bodyLg: "32rpx",
  body: "28rpx",
  bodySm: "24rpx",
  caption: "22rpx",
  overline: "20rpx"
};

export const lineHeightRules = {
  compact: 1.2,
  heading: 1.3,
  title: 1.35,
  body: 1.75,
  bodyDense: 1.6,
  caption: 1.45
};

export const sectionGaps = {
  page: spacingScale.lg,
  section: spacingScale.md,
  content: spacingScale.sm
};

export const darkTokensPlaceholder = {
  bgCanvas: "#14171b",
  surfaceBase: "#1d232b",
  textPrimary: "#f5f1e8"
};

export const tokens = {
  colors: colorRoles,
  spacing: spacingScale,
  radius: radiusScale,
  elevation: elevationScale,
  typography: typographyScale,
  lineHeight: lineHeightRules,
  gaps: sectionGaps,
  dark: darkTokensPlaceholder
};
