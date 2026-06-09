import { componentTokens } from "./component-tokens.js";
import { tokens } from "./tokens.js";
import { typography } from "./typography.js";

export function mergeStyles(...styles) {
  return Object.assign({}, ...styles.filter(Boolean));
}

export const theme = {
  ...tokens,
  typography,
  components: componentTokens,
  pageShell: {
    minHeight: "100%",
    padding: tokens.spacing.md,
    background: tokens.colors.bgCanvas
  },
  pageSection: {
    marginTop: tokens.gaps.section
  },
  sectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.gaps.content
  },
  rowWrap: {
    display: "flex",
    flexWrap: "wrap",
    gap: tokens.spacing.sm
  },
  divider: {
    height: "1rpx",
    background: tokens.colors.borderSubtle,
    marginTop: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm
  }
};

export default theme;
