# Stage OPS5 CRUD Scope

## In Scope

OPS5 assumes intake has already been normalized into repo registries. Whether content arrived as one zip per issue or one zip containing multiple release directories, CRUD and runtime management both operate on the resulting publication / issue / scenario entities.

Console may still expose a lightweight ZIP intake entry for operator convenience, but that entry is treated as a hand-off into the existing import/intake action layer rather than CRUD on raw zip contents.

### Publications

- list / detail
- create
- edit
- archive / unarchive
- guarded delete with explicit cascade for linked issues

### Issues

- list / detail
- filter by publication
- create
- edit
- archive / unarchive

### Article Metadata

- search affected article ids within a publication/issue
- inspect current override
- create override
- edit override
- delete override

### Taxonomy

- inspect canonical sections and discovery buckets
- inspect publication-specific raw mappings
- inspect unmapped sections from existing reports
- create mapping
- edit mapping
- disable mapping

### Scenario Membership

- inspect candidate inclusion state by issue
- include issue
- exclude issue
- mark preview-only / release-candidate eligible
- rebuild candidate

## Follow-up Refresh Rules

- Publication change:
  - refresh console snapshot inputs
- Issue change:
  - refresh console snapshot inputs
- Article override change:
  - refresh override report and quality/readiness reports
- Taxonomy change:
  - refresh taxonomy coverage, discovery quality, and drift reports
- Scenario membership change:
  - refresh release candidate manifest/report and promotion readiness inputs

## Explicitly Out of Scope

- Rich text/body editing
- Media library management
- Auto-summary rewriting
- Payment/admin business configuration
- Complex review workflow
- Direct immutable artifact editing
- Bulk import pipeline replacement
- Raw zip directory manipulation inside the operator console
- Browser-side parsing of external pack contents
