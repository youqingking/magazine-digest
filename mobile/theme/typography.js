import { colorRoles, lineHeightRules, typographyScale } from "./tokens.js";

export const typography = {
  pageTitle: {
    fontSize: typographyScale.h1,
    fontWeight: "700",
    lineHeight: lineHeightRules.heading,
    color: colorRoles.textPrimary
  },
  sectionTitle: {
    fontSize: typographyScale.h3,
    fontWeight: "700",
    lineHeight: lineHeightRules.heading,
    color: colorRoles.textPrimary
  },
  cardTitle: {
    fontSize: typographyScale.title,
    fontWeight: "700",
    lineHeight: lineHeightRules.title,
    color: colorRoles.textPrimary
  },
  bodyLead: {
    fontSize: typographyScale.bodyLg,
    fontWeight: "500",
    lineHeight: lineHeightRules.body,
    color: colorRoles.textPrimary
  },
  body: {
    fontSize: typographyScale.body,
    fontWeight: "400",
    lineHeight: lineHeightRules.body,
    color: colorRoles.textPrimary
  },
  bodyMuted: {
    fontSize: typographyScale.bodySm,
    fontWeight: "400",
    lineHeight: lineHeightRules.bodyDense,
    color: colorRoles.textSecondary
  },
  meta: {
    fontSize: typographyScale.caption,
    fontWeight: "500",
    lineHeight: lineHeightRules.caption,
    color: colorRoles.textSecondary
  },
  caption: {
    fontSize: typographyScale.caption,
    fontWeight: "400",
    lineHeight: lineHeightRules.caption,
    color: colorRoles.textMuted
  },
  label: {
    fontSize: typographyScale.overline,
    fontWeight: "600",
    lineHeight: lineHeightRules.caption,
    color: colorRoles.textSecondary,
    textTransform: "none"
  },
  eyebrow: {
    fontSize: typographyScale.caption,
    fontWeight: "600",
    lineHeight: lineHeightRules.caption,
    color: colorRoles.accentPrimary,
    textTransform: "none"
  }
};
