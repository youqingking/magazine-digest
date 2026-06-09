# Stage OPS5 Entity Model

## Editable Entities

### Publication

- Source of truth: `data/real-content/publications.json`
- Primary key: `publication_id` mapped to existing registry field `id`
- Editable fields:
  - `publication_id` on create only
  - `display_name`
  - `status`
  - `locale`
  - `description`
  - `notes`
  - `enabled`
- Derived / protected fields:
  - `parser_profiles` remain editable only as a bounded list passthrough, not freeform runtime config
  - generated timestamps and dependent reports are system-managed

### Issue

- Source of truth: `data/real-content/issues.json`
- Primary key: `issue_id`
- Editable fields:
  - `issue_id` on create only
  - `publication_id`
  - `issue_label`
  - `status`
  - `source_pack`
  - `parser_profile`
  - `notes`
  - `enabled`
- Compatibility note:
  - action layer keeps legacy fields such as `source_zip` / `import_status` if already present
  - CRUD normalizes `source_pack` and `status` for operator-facing edits without breaking old readers
- Derived / protected fields:
  - article counts and import-derived metrics

### Article Metadata Override

- Source of truth: `data/real-content/overrides/<publication>/<issue>/metadata-overrides.json`
- Primary key: `article_id` inside one publication/issue scope
- Editable fields:
  - `title`
  - `section_label`
  - `ordinal`
  - `author`
  - `canonical_url`
  - `display_warning_suppression`
  - `featured`
  - `notes`
- Protected:
  - body/content blocks
  - parser-produced normalized payload outside override fields

### Taxonomy Mapping

- Source of truth:
  - `data/real-content/taxonomy/canonical-sections.json`
  - `data/real-content/taxonomy/discovery-buckets.json`
  - `data/real-content/taxonomy/publication-section-maps/*.json`
- Editable surfaces:
  - raw section -> canonical section mapping
  - canonical section label
  - discovery bucket
  - publication-specific exception
  - enabled/disabled mapping state
- Protected:
  - normalized article outputs
  - runtime bundles generated from taxonomy-normalized records

### Scenario Membership

- Editable source of truth:
  - `data/real-content/quality/warning-budgets.json`
- Operator meaning:
  - include/exclude issue from release candidate by toggling `release_candidate_allowed`
  - mark preview-only vs release-candidate eligible through issue budget classification/note
- Rebuild target:
  - `data2_multi_publication_release_candidate` scenario bundle and reports via existing build/evaluate flows
- Protected:
  - immutable release artifacts
  - baseline scenario bundle contents

## Protected Boundaries

- Metadata edit means registry, override, taxonomy mapping, or candidate membership changes only.
- Import/parser rebuild is required for:
  - body/content text changes
  - parser profile logic changes
  - normalized payload regeneration beyond override/taxonomy refresh
  - release artifact regeneration
