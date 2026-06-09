import { colorRoles, elevationScale, radiusScale, spacingScale } from "./tokens.js";

export const componentTokens = {
  card: {
    base: {
      background: colorRoles.surfaceRaised,
      borderRadius: radiusScale.lg,
      padding: spacingScale.lg,
      boxShadow: elevationScale.card,
      borderWidth: "1rpx",
      borderStyle: "solid",
      borderColor: colorRoles.borderSubtle
    },
    muted: {
      background: colorRoles.surfaceMuted
    },
    info: {
      background: colorRoles.infoSurface,
      borderColor: colorRoles.borderStrong
    },
    warning: {
      background: colorRoles.warningSurface,
      borderColor: "#e7d5a3"
    },
    error: {
      background: colorRoles.errorSurface,
      borderColor: "#e8bcbc"
    },
    success: {
      background: colorRoles.successSurface,
      borderColor: "#bfd7c3"
    }
  },
  chip: {
    base: {
      borderRadius: radiusScale.pill,
      paddingTop: "10rpx",
      paddingBottom: "10rpx",
      paddingLeft: spacingScale.sm,
      paddingRight: spacingScale.sm,
      borderWidth: "1rpx",
      borderStyle: "solid",
      borderColor: colorRoles.borderSubtle,
      background: colorRoles.surfaceRaised
    }
  },
  button: {
    minHeight: "76rpx",
    borderRadius: radiusScale.pill,
    paddingLeft: spacingScale.md,
    paddingRight: spacingScale.md,
    fontSize: "24rpx",
    fontWeight: "600"
  },
  statePanel: {
    iconWrap: {
      width: "72rpx",
      height: "72rpx",
      borderRadius: radiusScale.pill,
      alignItems: "center",
      justifyContent: "center"
    }
  }
};
