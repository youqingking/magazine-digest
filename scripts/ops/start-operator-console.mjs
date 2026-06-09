import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";

import { ensureOpsDirs, opsPaths, parseArgs } from "./lib/ops-lib.mjs";
import {
  buildConsoleMap,
  buildOperatorConsoleFullSnapshot,
  consolePaths,
  ops4Paths,
  runScriptJson,
  runScriptJsonAllowFailure,
  writeOps4Json
} from "./lib/operator-console-lib.mjs";
import { buildRuntimeDistBaseUrl, defaultRuntimeDistHost, defaultRuntimeDistPort } from "./lib/runtime-dist-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const args = parseArgs(process.argv.slice(2));
const port = Number(args.port || 4174);
const host = args.host || "127.0.0.1";
const consoleBasePath = normalizeBasePath(args["base-path"] || "/");
const runtimeBasePath = normalizeBasePath(args["runtime-base-path"] || "/runtime");
const defaultRemoteBaseUrl = String(
  args["default-remote-base-url"] || buildRuntimeDistBaseUrl(defaultRuntimeDistHost, defaultRuntimeDistPort)
).trim();

buildConsoleMap();

function normalizeBasePath(rawPath) {
  const value = String(rawPath || "").trim();
  if (!value || value === "/") {
    return "";
  }
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

function buildMountedPath(basePath, requestPath = "/") {
  const normalizedRequestPath = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  return `${basePath}${normalizedRequestPath}` || "/";
}

function stripMountedPath(requestPath, basePath) {
  if (!basePath) {
    return requestPath || "/";
  }
  if (requestPath === basePath || requestPath === `${basePath}/`) {
    return "/";
  }
  if (requestPath.startsWith(`${basePath}/`)) {
    return requestPath.slice(basePath.length) || "/";
  }
  return null;
}

function renderIndexHtml() {
  return fs.readFileSync(consolePaths.indexHtml, "utf8")
    .replaceAll("__CONSOLE_STYLES_URL__", buildMountedPath(consoleBasePath, "/styles.css"))
    .replaceAll("__CONSOLE_APP_URL__", buildMountedPath(consoleBasePath, "/app.js"))
    .replaceAll("__CONSOLE_BASE_PATH_JSON__", JSON.stringify(consoleBasePath))
    .replaceAll("__RUNTIME_BASE_PATH_JSON__", JSON.stringify(runtimeBasePath))
    .replaceAll("__DEFAULT_REMOTE_BASE_URL_JSON__", JSON.stringify(defaultRemoteBaseUrl));
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

function sendText(response, statusCode, payload, type = "text/plain; charset=utf-8") {
  response.writeHead(statusCode, { "content-type": type });
  response.end(payload);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
      if (data.length > 2 * 1024 * 1024) {
        reject(new Error("OPS4_REQUEST_TOO_LARGE"));
      }
    });
    request.on("end", () => resolve(data ? JSON.parse(data) : {}));
    request.on("error", reject);
  });
}

function readBinaryBody(request, limitBytes = 64 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let totalBytes = 0;
    request.on("data", (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > limitBytes) {
        reject(new Error("OPS5_UPLOAD_TOO_LARGE"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sanitizeFilename(name) {
  return String(name || "upload.zip")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}

function serveStatic(requestPath, response) {
  if (requestPath === "/") {
    sendText(response, 200, renderIndexHtml(), "text/html; charset=utf-8");
    return;
  }
  const filePath = path.join(consolePaths.root, requestPath.replace(/^\//, ""));
  if (!filePath.startsWith(consolePaths.root)) {
    sendText(response, 403, "Forbidden");
    return;
  }
  if (!fs.existsSync(filePath)) {
    sendText(response, 404, "Not found");
    return;
  }
  const ext = path.extname(filePath);
  const type =
    ext === ".js" ? "application/javascript; charset=utf-8" :
    ext === ".css" ? "text/css; charset=utf-8" :
    "text/plain; charset=utf-8";
  sendText(response, 200, fs.readFileSync(filePath, "utf8"), type);
}

function handleReadApi(url, response) {
  const snapshot = buildOperatorConsoleFullSnapshot();
  if (url.pathname === "/api/overview") return sendJson(response, 200, snapshot.overview);
  if (url.pathname === "/api/content") return sendJson(response, 200, snapshot.content);
  if (url.pathname === "/api/quality") return sendJson(response, 200, snapshot.quality);
  if (url.pathname === "/api/scenarios") return sendJson(response, 200, snapshot.scenarios);
  if (url.pathname === "/api/release") return sendJson(response, 200, snapshot.release);
  if (url.pathname === "/api/observability") return sendJson(response, 200, snapshot.observability);
  if (url.pathname === "/api/editorial") return sendJson(response, 200, snapshot.editorial);
  if (url.pathname === "/api/ops5") return sendJson(response, 200, snapshot.ops5);
  if (url.pathname === "/api/runtime-dist") return sendJson(response, 200, snapshot.release?.runtime_dist || null);
  if (url.pathname === "/api/snapshot") return sendJson(response, 200, snapshot);
  if (url.pathname === "/api/map") {
    const map = JSON.parse(fs.readFileSync(ops4Paths.consoleMap, "utf8"));
    return sendJson(response, 200, map);
  }
  return false;
}

function resolveActionCommand(action, payload) {
  const scenario = payload.scenario || "data2_multi_publication_release_candidate";
  const baseline = payload.baseline || "data1a_readers_digest_12112025";
  switch (action) {
    case "compare":
      return { script: "scripts/ops/compare-scenarios.mjs", args: ["--from", baseline, "--to", scenario], allowFailure: false, stateful: false };
    case "evaluate":
      return { script: "scripts/ops/evaluate-promotion.mjs", args: ["--scenario", scenario, "--use-existing-reports"], allowFailure: false, stateful: false };
    case "dry_run_publish":
      return { script: "scripts/ops/promote-scenario.mjs", args: ["--scenario", scenario, "--dry-run", "--use-existing-reports"], allowFailure: true, stateful: false };
    case "apply_publish":
      return { script: "scripts/ops/promote-scenario.mjs", args: ["--scenario", scenario, "--apply", "--use-existing-reports"], allowFailure: true, stateful: true };
    case "rollback":
      return { script: "scripts/ops/rollback-scenario.mjs", args: ["--scenario", baseline], allowFailure: true, stateful: true };
    case "retire":
      return { script: "scripts/ops/retire-scenario.mjs", args: ["--scenario", scenario], allowFailure: true, stateful: true };
    case "build_release_candidate":
      return { script: "scripts/ops/build-release-candidate.mjs", args: [], allowFailure: false, stateful: false };
    case "intake":
      return { script: "scripts/ops/intake-pack.mjs", args: [], allowFailure: true, stateful: true };
    case "publish_channel":
      return { script: "scripts/ops/publish-channel.mjs", args: ["--channel", payload.channel || "dev", "--scenario", scenario, payload.apply ? "--apply" : "--dry-run", "--use-existing-reports"], allowFailure: true, stateful: true };
    case "promote_channel":
      return { script: "scripts/ops/promote-channel.mjs", args: ["--from", payload.from || "dev", "--to", payload.to || "staging", payload.apply ? "--apply" : "--dry-run"], allowFailure: true, stateful: true };
    case "rollback_channel":
      return { script: "scripts/ops/rollback-channel.mjs", args: ["--channel", payload.channel || "dev"], allowFailure: true, stateful: true };
    case "export_runtime_dist":
      return { script: "scripts/ops/export-runtime-dist.mjs", args: [], allowFailure: false, stateful: false };
    case "serve_runtime_dist":
      return { script: "scripts/ops/serve-runtime-dist.mjs", args: [], allowFailure: false, stateful: false };
    case "set_runtime_source":
      return {
        script: "scripts/ops/set-runtime-source.mjs",
        args: payload.mode === "scenario_preview"
          ? ["--mode", "scenario_preview", "--scenario", scenario]
          : payload.mode === "channel_head"
            ? ["--mode", "channel_head", "--channel", payload.channel || "dev"]
            : payload.mode === "remote_channel_head"
              ? ["--mode", "remote_channel_head", "--channel", payload.channel || "dev", "--remote-base-url", payload.remote_base_url || "http://127.0.0.1:4184"]
              : ["--mode", "current_mirror"],
        allowFailure: true,
        stateful: false
      };
    default:
      throw new Error(`OPS4_UNKNOWN_ACTION:${action}`);
  }
}

function resolveCrudCommand(entity, payload) {
  const jsonPayload = JSON.stringify(payload || {});
  switch (entity) {
    case "publications":
      return { script: "scripts/ops/crud/publications.mjs", args: ["--action", payload.action || "list", "--payload", jsonPayload], allowFailure: true, stateful: payload.action !== "list" };
    case "issues":
      return { script: "scripts/ops/crud/issues.mjs", args: ["--action", payload.action || "list", "--payload", jsonPayload], allowFailure: true, stateful: payload.action !== "list" };
    case "article_overrides":
      return { script: "scripts/ops/crud/article-overrides.mjs", args: ["--action", payload.action || "list", "--payload", jsonPayload], allowFailure: true, stateful: payload.action !== "list" };
    case "taxonomy":
      return { script: "scripts/ops/crud/taxonomy.mjs", args: ["--action", payload.action || "list", "--payload", jsonPayload], allowFailure: true, stateful: payload.action !== "list" };
    case "scenario_membership":
      return { script: "scripts/ops/crud/scenario-membership.mjs", args: ["--action", payload.action || "list", "--payload", jsonPayload], allowFailure: true, stateful: payload.action !== "list" };
    default:
      throw new Error(`OPS5_UNKNOWN_ENTITY:${entity}`);
  }
}

async function handleAction(request, response) {
  const payload = await readBody(request);
  const action = payload.action;
  const command = resolveActionCommand(action, payload);
  const startedAt = new Date().toISOString();
  const result = command.allowFailure
    ? runScriptJsonAllowFailure(path.join(repoRoot, command.script), command.args)
    : runScriptJson(path.join(repoRoot, command.script), command.args);
  const shouldRefreshRuntimeDist =
    result?.status === "ok" &&
    (
      (action === "publish_channel" && payload.apply) ||
      (action === "promote_channel" && payload.apply) ||
      action === "rollback_channel"
    );
  const postActions = [];
  if (shouldRefreshRuntimeDist) {
    postActions.push({
      action: "export_runtime_dist",
      result: runScriptJsonAllowFailure(path.join(repoRoot, "scripts/ops/export-runtime-dist.mjs"), [])
    });
  }
  const report = {
    generated_at: new Date().toISOString(),
    action,
    started_at: startedAt,
    scenario: payload.scenario || null,
    baseline: payload.baseline || null,
    stateful: command.stateful,
    script: command.script,
    args: command.args,
    result,
    post_actions: postActions
  };
  writeOps4Json(ops4Paths.actionsReport, report);
  sendJson(response, 200, report);
}

async function handleCrudAction(request, response) {
  const payload = await readBody(request);
  const entity = payload.entity;
  const command = resolveCrudCommand(entity, payload);
  const startedAt = new Date().toISOString();
  const result = command.allowFailure
    ? runScriptJsonAllowFailure(path.join(repoRoot, command.script), command.args)
    : runScriptJson(path.join(repoRoot, command.script), command.args);
  const report = {
    generated_at: new Date().toISOString(),
    entity,
    action: payload.action || null,
    started_at: startedAt,
    stateful: command.stateful,
    script: command.script,
    args: command.args,
    result
  };
  writeOps4Json(path.join(path.dirname(ops4Paths.actionsReport), "operator-console-crud-actions-report.json"), report);
  sendJson(response, 200, report);
}

async function handleIntakeUpload(request, response) {
  ensureOpsDirs();
  const filename = sanitizeFilename(request.headers["x-upload-filename"] || "upload.zip");
  if (!filename.toLowerCase().endsWith(".zip")) {
    throw new Error("OPS5_UPLOAD_EXPECTS_ZIP");
  }
  const routeHint = String(request.headers["x-route-hint"] || "auto").trim() || "auto";
  const freeQuotaLimit = Number(request.headers["x-free-quota-limit"] || 8);
  const archiveSource = String(request.headers["x-archive-source"] || "true").trim().toLowerCase() !== "false";
  const publicationId = String(request.headers["x-publication-id"] || "").trim();
  const publicationDisplayName = String(request.headers["x-publication-display-name"] || "").trim();
  const issueLabel = String(request.headers["x-issue-label"] || "").trim();
  const parserProfile = String(request.headers["x-parser-profile"] || "").trim();
  const includeInCandidate = String(request.headers["x-include-in-candidate"] || "false").trim().toLowerCase() === "true";
  const publishToCurrent = String(request.headers["x-publish-to-current"] || "false").trim().toLowerCase() === "true";
  const replaceExisting = String(request.headers["x-replace-existing"] || "false").trim().toLowerCase() === "true";
  const buffer = await readBinaryBody(request);
  if (!buffer.length) {
    throw new Error("OPS5_UPLOAD_EMPTY");
  }

  const storedName = `${new Date().toISOString().replace(/[:.]/g, "-")}-${filename}`;
  const storedPath = path.join(opsPaths.intakeInbox, storedName);
  fs.writeFileSync(storedPath, buffer);

  const args = ["--zip", storedPath, "--free-quota-limit", String(freeQuotaLimit)];
  if (routeHint && routeHint !== "auto") {
    args.push("--route-hint", routeHint);
  }
  if (publicationId) args.push("--publication-id", publicationId);
  if (publicationDisplayName) args.push("--publication-display-name", publicationDisplayName);
  if (issueLabel) args.push("--issue-label", issueLabel);
  if (parserProfile) args.push("--parser-profile", parserProfile);
  if (replaceExisting) args.push("--replace-existing");
  if (archiveSource) {
    args.push("--archive-source");
  }

  const result = runScriptJsonAllowFailure(path.join(repoRoot, "scripts/ops/intake-pack.mjs"), args);
  const postActions = [];
  const generatedIssueId = Array.isArray(result.generated_issues) && result.generated_issues.length === 1
    ? result.generated_issues[0]
    : null;

  if (result.status === "ok" && (includeInCandidate || publishToCurrent) && generatedIssueId) {
    const includePayload = JSON.stringify({
      issue_id: generatedIssueId,
      classification: "release_ready",
      note: "included_via_zip_intake"
    });
    const includeResult = runScriptJsonAllowFailure(
      path.join(repoRoot, "scripts/ops/crud/scenario-membership.mjs"),
      ["--action", "include", "--payload", includePayload]
    );
    postActions.push({
      action: "include_in_release_candidate",
      issue_id: generatedIssueId,
      result: includeResult
    });
  }

  if (result.status === "ok" && publishToCurrent) {
    const publishResult = runScriptJsonAllowFailure(
      path.join(repoRoot, "scripts/ops/promote-scenario.mjs"),
      ["--scenario", "data2_multi_publication_release_candidate", "--apply", "--use-existing-reports"]
    );
    postActions.push({
      action: "publish_candidate_to_current",
      scenario_id: "data2_multi_publication_release_candidate",
      result: publishResult
    });
  }

  const report = {
    generated_at: new Date().toISOString(),
    action: "intake_upload",
    upload: {
      original_filename: filename,
      stored_filename: storedName,
      stored_path: path.relative(repoRoot, storedPath).replace(/\\/g, "/"),
      size_bytes: buffer.length
    },
    options: {
      route_hint: routeHint,
      free_quota_limit: freeQuotaLimit,
      archive_source: archiveSource,
      publication_id: publicationId || null,
      publication_display_name: publicationDisplayName || null,
      issue_label: issueLabel || null,
      parser_profile: parserProfile || null,
      replace_existing: replaceExisting,
      include_in_candidate: includeInCandidate,
      publish_to_current: publishToCurrent
    },
    result,
    post_actions: postActions
  };
  writeOps4Json(path.join(path.dirname(ops4Paths.actionsReport), "operator-console-intake-upload-report.json"), report);
  sendJson(response, 200, report);
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
    const scopedPath = stripMountedPath(url.pathname, consoleBasePath);
    if (scopedPath == null) {
      sendText(response, 404, "Not found");
      return;
    }
    url.pathname = scopedPath;
    if (request.method === "GET" && url.pathname.startsWith("/api/")) {
      const handled = handleReadApi(url, response);
      if (handled === false) sendJson(response, 404, { error: "OPS4_API_NOT_FOUND" });
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/action") {
      await handleAction(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/crud-action") {
      await handleCrudAction(request, response);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/intake-upload") {
      await handleIntakeUpload(request, response);
      return;
    }
    if (request.method === "GET") {
      serveStatic(url.pathname, response);
      return;
    }
    sendJson(response, 405, { error: "OPS4_METHOD_NOT_ALLOWED" });
  } catch (error) {
    sendJson(response, 500, { error: error.message || String(error) });
  }
});

server.listen(port, host, () => {
  const payload = {
    status: "ok",
    url: `http://${host}:${port}`,
    console_base_path: consoleBasePath || "/",
    runtime_base_path: runtimeBasePath || "/runtime",
    default_remote_base_url: defaultRemoteBaseUrl,
    console_root: path.relative(repoRoot, consolePaths.root).replace(/\\/g, "/")
  };
  console.log(JSON.stringify(payload, null, 2));
});
