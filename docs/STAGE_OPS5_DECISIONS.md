# Stage OPS5 Decisions

## Goal

OPS5 delivers a lightweight internal editorial CRUD console on top of the existing local operator console. It adds controlled management for publication, issue, article metadata override, taxonomy mapping, and scenario membership without reopening IA, rewriting existing release/promotion flows, or mutating immutable release artifacts.

## Guardrails

- Keep the 7-page IA frozen.
- Keep `detail` as the only reading page.
- Preserve Stage G and H0/H1a foundations.
- Preserve existing app/service/contract shapes.
- Do not edit immutable release artifacts under `runtime/releases/`.
- Do not expose admin editing on mobile user-facing pages.
- Route every stateful mutation through lock-protected file-backed actions.

## OPS5 Decisions

1. Operator CRUD will be file-backed and local-op only.
2. Source-of-truth files stay in `data/real-content/*` and existing scenario registries.
3. Frontend console does not write files directly. It calls a Node action layer.
4. All stateful CRUD actions acquire the TEST2 `runtime-state` lock.
5. All writes use existing atomic JSON/text write helpers.
6. Every successful or failed mutation writes an OPS5 audit entry.
7. Relevant mutations trigger only targeted refresh work:
   - publication / issue changes: refresh listings and dependent reports only when needed
   - article override changes: refresh override and quality reports
   - taxonomy changes: refresh taxonomy coverage/discovery reports
   - scenario membership changes: refresh candidate manifest/report and readiness inputs
8. OPS5 reuses OBS1 event recording for CRUD observability.
9. Baseline scenario must remain preserved and cannot be silently overwritten by OPS5 actions.
10. Intake may arrive as single-issue zip or one zip containing multiple release directories; once imported, OPS5 only manages the normalized publication / issue / scenario registries, not raw zip layout.
11. Operator console may expose a controlled ZIP intake form, but the upload still routes through `scripts/ops/intake-pack.mjs` rather than writing registries directly from the browser.
12. ZIP intake is now hard-gated: missing required metadata, missing audience/depth variants, title conflicts, or summary/body mismatches must block import rather than creating partially visible runtime content.
13. Re-uploading an existing issue should default to protective blocking, not silent overwrite and not operator-led delete-first. Explicit `replace_existing` must require `publication_id + issue_label`, create a backup, and restore automatically on failure.

## Non-goals

- Full CMS
- Rich text/body editing
- External ingestion
- Complex approval workflow
- Multi-user RBAC
- Direct release artifact editing
- User analytics platform
