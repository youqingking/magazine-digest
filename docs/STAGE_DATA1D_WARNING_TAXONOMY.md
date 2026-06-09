# Stage DATA1D Warning Taxonomy

## Parser Warnings

- `atlantic_filename_truncated`
  说明文件名不足以稳定表达标题或 section，优先依赖 H1 和 merged 辅助。
- `economist_section_context_fallback`
  说明 section 不是从当前文件名直接恢复，而是从前序 section context 兜底。
- `economist_filename_anomaly`
  说明文件名本身语义异常，需要保留人工关注。

## Warning States

- `import_warnings`
  parser 原始输出，不因 override 消失。
- `display_warning_suppression`
  editorial override 层允许抑制某些 warning 在运营/UI 质量判断中的显性显示。
- `effective_warnings`
  `import_warnings` 去掉 suppression 后的未解决 warning。

## Policy

- suppression 只能降低显示噪音，不能伪装 parser 没产生 warning。
- unresolved warning 仍需进入质量报告与 issue 统计。
