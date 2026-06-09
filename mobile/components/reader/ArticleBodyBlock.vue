<template>
  <view class="article-body-block">
    <view v-for="(block, index) in blocks" :key="index" class="article-body-item">
      <text v-if="block.type === 'heading'" :style="headingStyle">{{ block.text }}</text>
      <text v-else-if="block.type === 'lead'" :style="leadStyle">{{ block.text }}</text>
      <view v-else-if="block.type === 'list'" class="body-list">
        <view v-for="(item, itemIndex) in block.items" :key="item + '-' + itemIndex" class="body-list-item">
          <text :style="bulletStyle">-</text>
          <text :style="bodyStyle">{{ item }}</text>
        </view>
      </view>
      <view v-else-if="block.type === 'callout'" :style="calloutStyle">
        <text :style="calloutLabelStyle">{{ block.label }}</text>
        <text :style="bodyStyle">{{ block.text }}</text>
      </view>
      <view v-else-if="block.type === 'quote'" :style="quoteStyle">
        <text :style="bodyStyle">{{ block.text }}</text>
      </view>
      <text v-else :style="bodyStyle">{{ block.text }}</text>
    </view>
  </view>
</template>

<script>
import { sanitizeMarkdownBody } from "../../services/content-normalizer.service.js";
import { colorRoles, radiusScale, spacingScale } from "../../theme/tokens.js";
import { mergeStyles } from "../../theme/index.js";
import { typography } from "../../theme/typography.js";

function normalizeParagraph(paragraph) {
  return paragraph
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildBlocks(body) {
  const paragraphs = sanitizeMarkdownBody(body || "")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return paragraphs.map((paragraph) => {
    const lines = normalizeParagraph(paragraph);

    if (!lines.length) {
      return { type: "paragraph", text: "" };
    }

    if (lines.every((line) => line.indexOf("- ") === 0)) {
      return {
        type: "list",
        items: lines.map((line) => line.replace(/^- /, ""))
      };
    }

    if (lines[0].indexOf("# ") === 0 || lines[0].indexOf("## ") === 0) {
      return {
        type: "heading",
        text: lines[0].replace(/^#+\s*/, "")
      };
    }

    if (lines[0].indexOf("> ") === 0) {
      return {
        type: "quote",
        text: lines.map((line) => line.replace(/^>\s*/, "")).join(" ")
      };
    }

    const labeledMatch = lines[0].match(/^([^:：]{2,18})[:：]\s*(.*)$/);
    if (labeledMatch) {
      const label = labeledMatch[1];
      const text = [labeledMatch[2]].concat(lines.slice(1)).filter(Boolean).join(" ");
      if (label === "一句话摘要") {
        return { type: "lead", text };
      }
      return { type: "callout", label, text };
    }

    if (lines.length === 1 && /；|;/.test(lines[0])) {
      const clauses = lines[0]
        .split(/[；;]/)
        .map((item) => item.trim())
        .filter(Boolean);

      if (clauses.length >= 3) {
        return {
          type: "list",
          items: clauses
        };
      }
    }

    return {
      type: "paragraph",
      text: lines.join(" ")
    };
  });
}

export default {
  props: {
    body: {
      type: String,
      default: ""
    },
    readingMode: {
      type: String,
      default: "deep_3m"
    }
  },
  computed: {
    blocks() {
      return buildBlocks(this.body);
    },
    leadStyle() {
      return mergeStyles(typography.bodyLead, {
        display: "block"
      });
    },
    headingStyle() {
      return mergeStyles(typography.sectionTitle, {
        display: "block"
      });
    },
    bodyStyle() {
      const comfortableBody = this.readingMode === "deep_3m"
        ? {
            fontSize: "32rpx",
            lineHeight: 1.88,
            letterSpacing: "0.02em",
            color: colorRoles.textPrimary
          }
        : {
            fontSize: "30rpx",
            lineHeight: 1.82,
            letterSpacing: "0.02em",
            color: colorRoles.textPrimary
          };
      return mergeStyles(
        this.readingMode === "deep_3m" ? typography.body : typography.bodyMuted,
        comfortableBody,
        {
          display: "block"
        }
      );
    },
    bulletStyle() {
      return mergeStyles(typography.body, {
        width: "28rpx",
        fontSize: this.readingMode === "deep_3m" ? "32rpx" : "30rpx",
        lineHeight: this.readingMode === "deep_3m" ? 1.88 : 1.82
      });
    },
    calloutStyle() {
      return {
        padding: "20rpx",
        borderRadius: radiusScale.md,
        background: colorRoles.bgMuted,
        borderWidth: "1rpx",
        borderStyle: "solid",
        borderColor: colorRoles.borderSubtle
      };
    },
    calloutLabelStyle() {
      return mergeStyles(typography.label, {
        display: "block",
        marginBottom: "8rpx",
        textTransform: "none"
      });
    },
    quoteStyle() {
      return {
        paddingLeft: "20rpx",
        paddingTop: spacingScale.xs,
        paddingBottom: spacingScale.xs,
        borderLeftWidth: "6rpx",
        borderLeftStyle: "solid",
        borderLeftColor: colorRoles.borderAccent
      };
    }
  }
};
</script>

<style>
.article-body-block {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.article-body-item {
  width: 100%;
}

.body-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.body-list-item {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}
</style>
