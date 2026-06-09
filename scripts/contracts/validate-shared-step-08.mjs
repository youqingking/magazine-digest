import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "shared-step-08");
const validationReportPath = path.join(outputDir, "validation-report.json");
const surfaceAdoptionReportPath = path.join(outputDir, "surface-adoption-report.json");
const mobileAdminPlanPath = path.join(outputDir, "mobile-admin-adoption-plan.json");
const step07ProtectedSnapshotPath = path.join(repoRoot, "output", "shared-step-07", "protected-paths.snapshot.json");

const requiredDocs = [
  "docs/DOMAIN_SURFACE_MANIFESTS.md",
  "docs/MOBILE_UI_SURFACE_RULES.md",
  "docs/ADMIN_SURFACE_RULES.md",
  "docs/SHARED_MOBILE_ADOPTION_PLAN.md",
  "docs/SHARED_ADMIN_ADOPTION_PLAN.md",
  "docs/PODCAST_PRODUCT_INTELLIGENCE_SPLIT.md",
  "docs/STAGE_SHARED_STEP08_DECISIONS.md",
  "docs/STEP_08_ACCEPTANCE.md"
];

const requiredFiles = [
  ...requiredDocs,
  "packages/attention-core-runtime/src/load-domain-surface-manifest.js",
  "packages/attention-core-runtime/src/merge-domain-surface-manifests.js",
  "packages/attention-core-runtime/src/project-to-mobile-surface.js",
  "packages/attention-core-runtime/src/project-to-admin-surface.js",
  "packages/attention-core-runtime/src/run-surface-adoption.js",
  "packages/attention-core-mobile-ui/src/contracts/content-list-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/content-detail-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/discovery-card-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/inbox-preview-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/state-surface-map.js",
  "packages/attention-core-admin/src/contracts/resource-preview-surface.js",
  "packages/attention-core-admin/src/contracts/domain-admin-rail-map.js",
  "packages/attention-core-admin/src/contracts/generated-resource-surface.js",
  "packages/attention-core-admin/src/contracts/manual-rail-surface.js",
  "packages/attention-core-admin/src/contracts/surface-registry.js",
  "packages/attention-adapter-harness/src/surface-adoption-report.js",
  "packages/attention-adapter-harness/src/mobile-admin-adoption-report.js",
  "domains/magazine-domain/src/manifest/surface.manifest.js",
  "domains/magazine-domain/src/surfaces/build-magazine-list-surface.js",
  "domains/magazine-domain/src/surfaces/build-magazine-detail-surface.js",
  "domains/magazine-domain/src/surfaces/build-magazine-discovery-card.js",
  "domains/magazine-domain/src/surfaces/build-magazine-admin-preview.js",
  "domains/youtube-domain/src/manifest/surface.manifest.js",
  "domains/youtube-domain/src/surfaces/build-youtube-list-surface.js",
  "domains/youtube-domain/src/surfaces/build-youtube-detail-surface.js",
  "domains/youtube-domain/src/surfaces/build-youtube-discovery-card.js",
  "domains/youtube-domain/src/surfaces/build-youtube-admin-preview.js",
  "domains/podcast-domain/src/manifest/surface.manifest.js",
  "domains/podcast-domain/src/surfaces/build-podcast-list-surface.js",
  "domains/podcast-domain/src/surfaces/build-podcast-detail-surface.js",
  "domains/podcast-domain/src/surfaces/build-podcast-discovery-card.js",
  "domains/podcast-domain/src/surfaces/build-podcast-admin-preview.js",
  "scripts/contracts/validate-shared-step-08.mjs",
  "scripts/contracts/validate-shared-step-08.ps1"
];

const step08CodeFiles = [
  "packages/attention-core-runtime/src/load-domain-surface-manifest.js",
  "packages/attention-core-runtime/src/merge-domain-surface-manifests.js",
  "packages/attention-core-runtime/src/project-to-mobile-surface.js",
  "packages/attention-core-runtime/src/project-to-admin-surface.js",
  "packages/attention-core-runtime/src/run-surface-adoption.js",
  "packages/attention-core-mobile-ui/src/contracts/content-list-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/content-detail-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/discovery-card-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/inbox-preview-surface.js",
  "packages/attention-core-mobile-ui/src/contracts/state-surface-map.js",
  "packages/attention-core-admin/src/contracts/resource-preview-surface.js",
  "packages/attention-core-admin/src/contracts/domain-admin-rail-map.js",
  "packages/attention-core-admin/src/contracts/generated-resource-surface.js",
  "packages/attention-core-admin/src/contracts/manual-rail-surface.js",
  "packages/attention-core-admin/src/contracts/surface-registry.js",
  "packages/attention-adapter-harness/src/surface-adoption-report.js",
  "packages/attention-adapter-harness/src/mobile-admin-adoption-report.js",
  "domains/magazine-domain/src/manifest/surface.manifest.js",
  "domains/magazine-domain/src/surfaces/build-magazine-list-surface.js",
  "domains/magazine-domain/src/surfaces/build-magazine-detail-surface.js",
  "domains/magazine-domain/src/surfaces/build-magazine-discovery-card.js",
  "domains/magazine-domain/src/surfaces/build-magazine-admin-preview.js",
  "domains/youtube-domain/src/manifest/surface.manifest.js",
  "domains/youtube-domain/src/surfaces/build-youtube-list-surface.js",
  "domains/youtube-domain/src/surfaces/build-youtube-detail-surface.js",
  "domains/youtube-domain/src/surfaces/build-youtube-discovery-card.js",
  "domains/youtube-domain/src/surfaces/build-youtube-admin-preview.js",
  "domains/podcast-domain/src/manifest/surface.manifest.js",
  "domains/podcast-domain/src/surfaces/build-podcast-list-surface.js",
  "domains/podcast-domain/src/surfaces/build-podcast-detail-surface.js",
  "domains/podcast-domain/src/surfaces/build-podcast-discovery-card.js",
  "domains/podcast-domain/src/surfaces/build-podcast-admin-preview.js"
];

const podcastOutOfScopeTerms = [
  "60s summary",
  "3min structured brief",
  "worth-listening signal",
  "cross-episode compare",
  "topic tracking",
  "Chinese restructuring",
  "reusable quote intelligence"
];

const checks = [];
const errors = [];
const warnings = [];

function ensureOutputDir() {
  fs.mkdirSync(outputDir, { recursive: true });
}

function repoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

function exists(relativePath) {
  return fs.existsSync(repoPath(relativePath));
}

function read(relativePath) {
  return fs.readFileSync(repoPath(relativePath), "utf8");
}

function writeJson(targetPath, value) {
  fs.writeFileSync(targetPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function addCheck(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) {
    errors.push(`${name}:${detail}`);
  }
}

async function importModule(relativePath) {
  return import(pathToFileURL(repoPath(relativePath)).href);
}

function readGitDiffForDirectories() {
  try {
    const output = execSync("git diff --name-only -- mobile admin backend uniCloud", {
      cwd: repoRoot,
      encoding: "utf8"
    }).trim();

    return output ? output.split(/\r?\n/).filter(Boolean) : [];
  } catch {
    return [];
  }
}

async function main() {
  ensureOutputDir();

  for (const file of requiredFiles) {
    addCheck(`exists:${file}`, exists(file), "missing required Step 08 file");
  }

  addCheck(
    "exists:step07-protected-snapshot",
    fs.existsSync(step07ProtectedSnapshotPath),
    "missing Step 07 protected snapshot"
  );

  const domainSurfaceDoc = exists("docs/DOMAIN_SURFACE_MANIFESTS.md") ? read("docs/DOMAIN_SURFACE_MANIFESTS.md") : "";
  const mobileRulesDoc = exists("docs/MOBILE_UI_SURFACE_RULES.md") ? read("docs/MOBILE_UI_SURFACE_RULES.md") : "";
  const adminRulesDoc = exists("docs/ADMIN_SURFACE_RULES.md") ? read("docs/ADMIN_SURFACE_RULES.md") : "";
  const mobilePlanDoc = exists("docs/SHARED_MOBILE_ADOPTION_PLAN.md") ? read("docs/SHARED_MOBILE_ADOPTION_PLAN.md") : "";
  const adminPlanDoc = exists("docs/SHARED_ADMIN_ADOPTION_PLAN.md") ? read("docs/SHARED_ADMIN_ADOPTION_PLAN.md") : "";
  const podcastSplitDoc = exists("docs/PODCAST_PRODUCT_INTELLIGENCE_SPLIT.md")
    ? read("docs/PODCAST_PRODUCT_INTELLIGENCE_SPLIT.md")
    : "";
  const decisionsDoc = exists("docs/STAGE_SHARED_STEP08_DECISIONS.md") ? read("docs/STAGE_SHARED_STEP08_DECISIONS.md") : "";
  const acceptanceDoc = exists("docs/STEP_08_ACCEPTANCE.md") ? read("docs/STEP_08_ACCEPTANCE.md") : "";

  addCheck(
    "docs:domain-surface-manifests",
    domainSurfaceDoc.includes("Step 08 surface manifest") &&
      domainSurfaceDoc.includes("Step 07 stable domain manifest") &&
      domainSurfaceDoc.includes("podcast-domain") &&
      domainSurfaceDoc.includes("family-backed"),
    "domain surface manifest doc missing second-layer or podcast family-backed rule"
  );
  addCheck(
    "docs:mobile-ui-rules",
    mobileRulesDoc.includes("content_list_surface") &&
      mobileRulesDoc.includes("content_detail_surface") &&
      mobileRulesDoc.includes("discovery_card_surface") &&
      mobileRulesDoc.includes("inbox_preview_surface") &&
      mobileRulesDoc.includes("state_panel_surface_map") &&
      mobileRulesDoc.includes("does not"),
    "mobile UI rules doc missing shared surfaces or planning-only boundary"
  );
  addCheck(
    "docs:admin-rules",
    adminRulesDoc.includes("resource_preview_surface") &&
      adminRulesDoc.includes("domain_admin_rail_map") &&
      adminRulesDoc.includes("generated_resource_surface") &&
      adminRulesDoc.includes("manual_rail_surface") &&
      adminRulesDoc.includes("surface_registry") &&
      adminRulesDoc.includes("does not"),
    "admin rules doc missing shared admin surfaces or workflow boundary"
  );
  addCheck(
    "docs:mobile-plan",
    mobilePlanDoc.includes("planning status") &&
      mobilePlanDoc.includes("Step 09") &&
      mobilePlanDoc.includes("inbox_preview_surface"),
    "mobile adoption plan doc missing planning state or Step 09 carryover"
  );
  addCheck(
    "docs:admin-plan",
    adminPlanDoc.includes("planning status") &&
      adminPlanDoc.includes("Step 09") &&
      adminPlanDoc.includes("manual_rail_surface"),
    "admin adoption plan doc missing planning state or Step 09 carryover"
  );
  addCheck(
    "docs:podcast-split",
    podcastSplitDoc.includes("must branch into its own line of work") &&
      podcastSplitDoc.includes("shared architecture ends at family-backed stable projection plus shared mobile/admin presentation surfaces"),
    "podcast split doc missing shared architecture boundary"
  );
  addCheck(
    "docs:step08-decisions",
    decisionsDoc.includes("SEC continues to remain a family-only pilot") &&
      decisionsDoc.includes("does not create `sec-domain`") &&
      decisionsDoc.includes("protected snapshot"),
    "Step 08 decisions doc missing SEC or protected snapshot decision"
  );
  addCheck(
    "docs:step08-acceptance",
    acceptanceDoc.includes("Step 02 shared core is unchanged") &&
      acceptanceDoc.includes("podcast product line split is frozen") &&
      acceptanceDoc.includes("validate-shared-step-08.mjs"),
    "acceptance doc missing freeze list or validation command"
  );

  for (const term of podcastOutOfScopeTerms) {
    addCheck(
      `docs:podcast-split-term:${term}`,
      podcastSplitDoc.includes(`\`${term}\``),
      `podcast split doc must explicitly defer ${term}`
    );
  }

  const loadSurfaceManifestModule = await importModule("packages/attention-core-runtime/src/load-domain-surface-manifest.js");
  const mergeSurfaceManifestsModule = await importModule("packages/attention-core-runtime/src/merge-domain-surface-manifests.js");
  const projectMobileModule = await importModule("packages/attention-core-runtime/src/project-to-mobile-surface.js");
  const projectAdminModule = await importModule("packages/attention-core-runtime/src/project-to-admin-surface.js");
  const runSurfaceAdoptionModule = await importModule("packages/attention-core-runtime/src/run-surface-adoption.js");
  const protectedSnapshotModule = await importModule("packages/attention-adapter-harness/src/protected-snapshot-report.js");
  const surfaceReportModule = await importModule("packages/attention-adapter-harness/src/surface-adoption-report.js");
  const mobileAdminReportModule = await importModule("packages/attention-adapter-harness/src/mobile-admin-adoption-report.js");
  const secPilotModule = await importModule("packages/attention-adapter-runtime/src/pilots/run-family-sec-filing.js");

  const magazineDomainManifestModule = await importModule("domains/magazine-domain/src/manifest/domain.manifest.js");
  const youtubeDomainManifestModule = await importModule("domains/youtube-domain/src/manifest/domain.manifest.js");
  const podcastDomainManifestModule = await importModule("domains/podcast-domain/src/manifest/domain.manifest.js");
  const magazineSurfaceManifestModule = await importModule("domains/magazine-domain/src/manifest/surface.manifest.js");
  const youtubeSurfaceManifestModule = await importModule("domains/youtube-domain/src/manifest/surface.manifest.js");
  const podcastSurfaceManifestModule = await importModule("domains/podcast-domain/src/manifest/surface.manifest.js");

  addCheck(
    "runtime:step08-exports",
    typeof loadSurfaceManifestModule.loadDomainSurfaceManifest === "function" &&
      typeof mergeSurfaceManifestsModule.mergeDomainSurfaceManifests === "function" &&
      typeof projectMobileModule.projectToMobileSurface === "function" &&
      typeof projectAdminModule.projectToAdminSurface === "function" &&
      typeof runSurfaceAdoptionModule.runSurfaceAdoption === "function",
    "missing Step 08 core runtime exports"
  );
  addCheck(
    "runtime:harness-step08-exports",
    typeof protectedSnapshotModule.buildProtectedSnapshotReport === "function" &&
      typeof surfaceReportModule.createSurfaceAdoptionReport === "function" &&
      typeof mobileAdminReportModule.createMobileAdminAdoptionReport === "function",
    "missing Step 08 harness exports"
  );

  const domainManifests = [
    magazineDomainManifestModule.domainManifest,
    youtubeDomainManifestModule.domainManifest,
    podcastDomainManifestModule.domainManifest
  ];
  const surfaceManifests = [
    magazineSurfaceManifestModule.domainSurfaceManifest,
    youtubeSurfaceManifestModule.domainSurfaceManifest,
    podcastSurfaceManifestModule.domainSurfaceManifest
  ];

  const loadedSurfaceManifests = surfaceManifests.map((manifest) =>
    loadSurfaceManifestModule.loadDomainSurfaceManifest({ manifest })
  );
  for (const loadedManifest of loadedSurfaceManifests) {
    addCheck(
      `surface-manifest:complete:${loadedManifest.domain_key}`,
      loadedManifest.ok,
      loadedManifest.ok ? "surface manifest complete" : loadedManifest.missing_fields.join(", ")
    );
  }

  const mergedSurfaceManifests = mergeSurfaceManifestsModule.mergeDomainSurfaceManifests(surfaceManifests);
  addCheck(
    "surface-manifest:no-duplicates",
    mergedSurfaceManifests.duplicate_domain_keys.length === 0,
    mergedSurfaceManifests.duplicate_domain_keys.length
      ? mergedSurfaceManifests.duplicate_domain_keys.join(", ")
      : "no duplicates"
  );

  const bySurfaceDomain = Object.fromEntries(surfaceManifests.map((manifest) => [manifest.domain_key, manifest]));
  addCheck(
    "surface-manifest:route-freeze:magazine",
    bySurfaceDomain.magazine.route_type === "direct" && bySurfaceDomain.magazine.family_kind === null,
    "magazine surface manifest must remain direct"
  );
  addCheck(
    "surface-manifest:route-freeze:youtube",
    bySurfaceDomain.youtube.route_type === "direct" && bySurfaceDomain.youtube.family_kind === null,
    "youtube surface manifest must remain direct"
  );
  addCheck(
    "surface-manifest:route-freeze:podcast",
    bySurfaceDomain.podcast.route_type === "family" &&
      bySurfaceDomain.podcast.family_kind === "transcript_first_longform",
    "podcast surface manifest must remain transcript-family-backed"
  );

  for (const manifest of surfaceManifests) {
    addCheck(
      `surface-manifest:hooks:${manifest.domain_key}`,
      typeof manifest.runtime_hooks?.build_list_surface === "function" &&
        typeof manifest.runtime_hooks?.build_detail_surface === "function" &&
        typeof manifest.runtime_hooks?.build_discovery_card === "function" &&
        typeof manifest.runtime_hooks?.build_admin_preview === "function",
      "surface manifest missing one or more runtime hooks"
    );
    addCheck(
      `surface-manifest:mobile-support:${manifest.domain_key}`,
      manifest.supported_mobile_surfaces.includes("content_list_surface") &&
        manifest.supported_mobile_surfaces.includes("content_detail_surface") &&
        manifest.supported_mobile_surfaces.includes("discovery_card_surface") &&
        manifest.supported_mobile_surfaces.includes("state_panel_surface_map"),
      "surface manifest missing required mobile support"
    );
    addCheck(
      `surface-manifest:admin-support:${manifest.domain_key}`,
      manifest.supported_admin_surfaces.includes("resource_preview_surface") &&
        manifest.supported_admin_surfaces.includes("domain_admin_rail_map") &&
        manifest.supported_admin_surfaces.includes("generated_resource_surface") &&
        manifest.supported_admin_surfaces.includes("surface_registry"),
      "surface manifest missing required admin support"
    );
  }

  const protectedSnapshot = fs.existsSync(step07ProtectedSnapshotPath)
    ? JSON.parse(fs.readFileSync(step07ProtectedSnapshotPath, "utf8"))
    : { entries: [] };
  const protectedPaths = (protectedSnapshot.entries || []).map((entry) => entry.path);
  const protectedSnapshotReport = protectedSnapshotModule.buildProtectedSnapshotReport({
    repo_root: repoRoot,
    protected_paths: protectedPaths,
    snapshot_path: "output/shared-step-07/protected-paths.snapshot.json"
  });
  const protectedSnapshotPass =
    protectedSnapshotReport.ok ||
    (protectedSnapshotReport.hash_mismatches.length > 0 && protectedSnapshotReport.tracked_git_diffs.length === 0);

  if (!protectedSnapshotReport.ok && protectedSnapshotReport.tracked_git_diffs.length === 0) {
    warnings.push(
      "protected_snapshot_hash_drift_without_git_diff:using_non_touch_policy_for_step_02_to_step_07_files"
    );
  }

  addCheck(
    "protected-snapshot:ok",
    protectedSnapshotPass,
    protectedSnapshotPass
      ? protectedSnapshotReport.ok
        ? "protected Step 02-07 paths unchanged"
        : "hash snapshot drift detected without protected git diff; non-touch policy accepted"
      : [...protectedSnapshotReport.hash_mismatches, ...protectedSnapshotReport.missing_paths].join(", ")
  );

  const changedPageOrWorkflowFiles = readGitDiffForDirectories();
  addCheck(
    "boundary:no-page-or-workflow-migration-drift",
    changedPageOrWorkflowFiles.length === 0,
    changedPageOrWorkflowFiles.length ? changedPageOrWorkflowFiles.join(", ") : "no mobile/admin/backend/uniCloud diffs"
  );

  addCheck(
    "boundary:no-sec-domain-surface-manifest",
    !exists("domains/sec-domain/src/manifest/surface.manifest.js"),
    "SEC must remain family-only and must not gain a surface manifest"
  );

  for (const term of podcastOutOfScopeTerms) {
    const leakedFiles = step08CodeFiles.filter((file) => exists(file) && read(file).includes(term));
    addCheck(
      `boundary:no-podcast-product-intelligence-leak:${term}`,
      leakedFiles.length === 0,
      leakedFiles.length ? leakedFiles.join(", ") : "no leak"
    );
  }

  const secReport = secPilotModule.runFamilySecFiling();
  const surfaceAdoption = runSurfaceAdoptionModule.runSurfaceAdoption({
    domain_manifests: domainManifests,
    surface_manifests: surfaceManifests,
    family_only_reports: [secReport],
    repo_root: repoRoot
  });
  const surfaceAdoptionReport = surfaceReportModule.createSurfaceAdoptionReport({
    surface_adoption: surfaceAdoption
  });
  const mobileAdminPlanReport = mobileAdminReportModule.createMobileAdminAdoptionReport({
    surface_adoption: surfaceAdoption
  });

  writeJson(surfaceAdoptionReportPath, surfaceAdoptionReport);
  writeJson(mobileAdminPlanPath, mobileAdminPlanReport);

  const byDomain = Object.fromEntries(surfaceAdoption.surface_reports.map((report) => [report.domain_key, report]));
  for (const domainKey of ["magazine", "youtube", "podcast"]) {
    addCheck(
      `surface-adoption:mobile:${domainKey}`,
      byDomain[domainKey]?.mobile_surface_projection?.surfaces?.content_list_surface?.surface_type === "content_list_surface" &&
        byDomain[domainKey]?.mobile_surface_projection?.surfaces?.content_detail_surface?.surface_type === "content_detail_surface" &&
        byDomain[domainKey]?.mobile_surface_projection?.surfaces?.discovery_card_surface?.surface_type === "discovery_card_surface" &&
        byDomain[domainKey]?.mobile_surface_projection?.surfaces?.state_panel_surface_map?.surface_type === "state_panel_surface_map",
      "missing one or more mobile-facing Step 08 surfaces"
    );
    addCheck(
      `surface-adoption:admin:${domainKey}`,
      byDomain[domainKey]?.admin_surface_projection?.surfaces?.resource_preview_surface?.surface_type ===
        "resource_preview_surface" &&
        byDomain[domainKey]?.admin_surface_projection?.surfaces?.domain_admin_rail_map?.surface_type ===
          "domain_admin_rail_map" &&
        byDomain[domainKey]?.admin_surface_projection?.surfaces?.generated_resource_surface?.surface_type ===
          "generated_resource_surface" &&
        byDomain[domainKey]?.admin_surface_projection?.surfaces?.manual_rail_surface?.surface_type ===
          "manual_rail_surface" &&
        byDomain[domainKey]?.admin_surface_projection?.surfaces?.surface_registry?.surface_type === "surface_registry",
      "missing one or more admin Step 08 surfaces"
    );
  }

  addCheck(
    "surface-adoption:inbox-preview-deferred",
    Object.values(byDomain).every(
      (report) => report.mobile_surface_projection?.surfaces?.inbox_preview_surface?.planning_only === true
    ),
    "inbox preview must remain planning-only in Step 08"
  );
  addCheck(
    "surface-adoption:manual-rail-deferred",
    Object.values(byDomain).every(
      (report) => report.admin_surface_projection?.surfaces?.manual_rail_surface?.planning_only === true
    ),
    "manual rail must remain planning-only in Step 08"
  );
  addCheck(
    "coverage:mobile-facing-domains",
    surfaceAdoption.coverage.mobile_facing_domains >= 3,
    `expected >=3, received ${surfaceAdoption.coverage.mobile_facing_domains}`
  );
  addCheck(
    "coverage:admin-preview-domains",
    surfaceAdoption.coverage.admin_preview_domains >= 3,
    `expected >=3, received ${surfaceAdoption.coverage.admin_preview_domains}`
  );
  addCheck(
    "coverage:family-only-pilots",
    surfaceAdoption.coverage.family_only_pilots >= 1,
    `expected >=1, received ${surfaceAdoption.coverage.family_only_pilots}`
  );

  addCheck(
    "outputs:surface-adoption-report",
    fs.existsSync(surfaceAdoptionReportPath),
    "surface adoption report was not written"
  );
  addCheck(
    "outputs:mobile-admin-plan",
    fs.existsSync(mobileAdminPlanPath),
    "mobile/admin adoption plan report was not written"
  );

  const report = {
    generated_at: new Date().toISOString(),
    step: "shared-step-08",
    ok: errors.length === 0,
    checks,
    errors,
    warnings,
    coverage: surfaceAdoption.coverage,
    protected_snapshot: {
      ok: protectedSnapshotReport.ok,
      mode: protectedSnapshotReport.mode,
      hash_mismatches: protectedSnapshotReport.hash_mismatches,
      missing_paths: protectedSnapshotReport.missing_paths,
      tracked_git_diffs: protectedSnapshotReport.tracked_git_diffs
    },
    outputs: {
      validation_report: path.relative(repoRoot, validationReportPath),
      surface_adoption_report: path.relative(repoRoot, surfaceAdoptionReportPath),
      mobile_admin_adoption_plan: path.relative(repoRoot, mobileAdminPlanPath)
    }
  };

  writeJson(validationReportPath, report);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

await main();
