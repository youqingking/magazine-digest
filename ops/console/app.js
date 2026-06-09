const consoleConfig = window.__OPERATOR_CONSOLE_CONFIG__ || {};
const consoleBasePath = normalizeBasePath(consoleConfig.basePath || "");
const runtimeBasePath = normalizeBasePath(consoleConfig.runtimeBasePath || "/runtime");

function normalizeBasePath(value) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue || normalizedValue === "/") {
    return "";
  }
  return `/${normalizedValue.replace(/^\/+|\/+$/g, "")}`;
}

function buildConsoleUrl(requestPath) {
  const normalizedRequestPath = requestPath.startsWith("/") ? requestPath : `/${requestPath}`;
  return `${consoleBasePath}${normalizedRequestPath}` || "/";
}

function resolveDefaultRemoteBaseUrl() {
  const configuredBaseUrl = String(consoleConfig.defaultRemoteBaseUrl || "").trim();
  if (configuredBaseUrl && configuredBaseUrl !== "same-origin") {
    return configuredBaseUrl.replace(/\/+$/, "");
  }
  return `${window.location.origin}${runtimeBasePath || "/runtime"}`.replace(/\/+$/, "");
}

function syncRemoteBaseUrlInput(snapshot = null) {
  const input = document.querySelector('input[name="remote_base_url"]');
  if (!input) {
    return;
  }
  const snapshotBaseUrl = String(snapshot?.release?.runtime_source?.remote_base_url || "").trim().replace(/\/+$/, "");
  const defaultBaseUrl = snapshotBaseUrl || resolveDefaultRemoteBaseUrl();
  input.placeholder = defaultBaseUrl || "http://8.136.215.40/magazine-runtime";
  if (!String(input.value || "").trim()) {
    input.value = defaultBaseUrl;
  }
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`${url} -> ${response.status}`);
  }
  return response.json();
}

function renderKeyValues(target, values) {
  target.innerHTML = "";
  const list = document.createElement("dl");
  Object.entries(values).forEach(([key, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = key;
    const dd = document.createElement("dd");
    dd.textContent = typeof value === "string" ? value : JSON.stringify(value);
    list.append(dt, dd);
  });
  target.appendChild(list);
}

function renderList(target, title, items, formatter) {
  const wrapper = document.createElement("section");
  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.appendChild(heading);
  const list = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = formatter(item);
    list.appendChild(li);
  });
  wrapper.appendChild(list);
  target.appendChild(wrapper);
}

function renderPublicationSummarySection(target, title, publications = [], issueLimit = 6) {
  const wrapper = document.createElement("section");
  wrapper.className = "stack-section";
  const heading = document.createElement("h3");
  heading.textContent = title;
  wrapper.appendChild(heading);

  if (!publications.length) {
    const empty = document.createElement("p");
    empty.className = "muted-copy";
    empty.textContent = "暂无期次摘要";
    wrapper.appendChild(empty);
    target.appendChild(wrapper);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "summary-grid";

  publications.forEach((publication) => {
    const card = document.createElement("article");
    card.className = "summary-panel";

    const titleRow = document.createElement("div");
    titleRow.className = "summary-head";

    const name = document.createElement("h4");
    name.textContent = publication.display_name || publication.publication_id;
    titleRow.appendChild(name);

    const meta = document.createElement("p");
    meta.className = "summary-meta";
    meta.textContent = [
      `${publication.issue_count || 0} 期`,
      publication.latest_issue_display_label ? `最新 ${publication.latest_issue_display_label}` : "暂无最新期",
      `${publication.candidate_issue_count || 0} 期在 candidate`
    ].join(" · ");
    titleRow.appendChild(meta);
    card.appendChild(titleRow);

    const totals = document.createElement("p");
    totals.className = "summary-copy";
    totals.textContent = [
      `${publication.total_article_count || 0} 篇文章`,
      `${publication.total_unresolved_warnings_count || 0} 个未解决 warning`,
      `${publication.archived_issue_count || 0} 期已归档`
    ].join(" · ");
    card.appendChild(totals);

    const issueList = document.createElement("div");
    issueList.className = "issue-list";
    (publication.issue_summaries || []).slice(0, issueLimit).forEach((issue) => {
      const row = document.createElement("div");
      row.className = "issue-row";

      const rowMain = document.createElement("div");
      rowMain.className = "issue-row-main";

      const issueTitle = document.createElement("strong");
      issueTitle.textContent = issue.issue_display_label || issue.issue_label || issue.issue_id;
      rowMain.appendChild(issueTitle);

      const rowMeta = document.createElement("span");
      rowMeta.className = "issue-row-meta";
      rowMeta.textContent = [
        `${issue.article_count || 0} 篇`,
        `${issue.unresolved_warnings_count || 0} 未解决`,
        issue.parser_profile || "无 parser"
      ].join(" · ");
      rowMain.appendChild(rowMeta);
      row.appendChild(rowMain);

      const badges = document.createElement("div");
      badges.className = "badge-row";
      [
        issue.in_release_candidate ? "candidate" : "",
        issue.status || "",
        issue.enabled === false ? "disabled" : "",
        issue.mapped_ratio == null ? "" : `映射 ${Math.round(issue.mapped_ratio * 100)}%`
      ]
        .filter(Boolean)
        .forEach((label) => {
          const badge = document.createElement("span");
          badge.className = "badge";
          badge.textContent = label;
          badges.appendChild(badge);
        });
      row.appendChild(badges);
      issueList.appendChild(row);
    });

    card.appendChild(issueList);
    grid.appendChild(card);
  });

  wrapper.appendChild(grid);
  target.appendChild(wrapper);
}

function setResult(id, value) {
  document.getElementById(id).textContent = typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function collectTopBlockerCodes(validationReport, limit = 6) {
  const counts = new Map();
  const blockedRecords = validationReport?.blocked_records || [];
  blockedRecords.forEach((record) => {
    (record.blockers || []).forEach((blocker) => {
      const code = blocker?.code || "unknown_blocker";
      counts.set(code, (counts.get(code) || 0) + 1);
    });
  });
  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "zh-CN"))
    .slice(0, limit);
}

function formatIntakeUploadResult(report) {
  if (!report || typeof report === "string") {
    return typeof report === "string" ? report : JSON.stringify(report, null, 2);
  }

  const lines = [];
  const intakeResult = report.result || {};
  const validationReport = intakeResult.validation_report || null;
  const topBlockers = collectTopBlockerCodes(validationReport);
  const postActions = report.post_actions || [];

  lines.push("Summary");
  lines.push(`- upload: ${report.upload?.original_filename || "unknown"}`);
  lines.push(`- route_hint: ${report.options?.route_hint || "auto"}`);
  lines.push(`- resolved_status: ${intakeResult.status || report.status || "unknown"}`);
  lines.push(`- replace_existing: ${report.options?.replace_existing ? "true" : "false"}`);
  if (intakeResult.route) {
    lines.push(`- resolved_route: ${intakeResult.route}`);
  }
  if (validationReport?.publication_id || report.options?.publication_id) {
    lines.push(`- publication_id: ${validationReport?.publication_id || report.options?.publication_id}`);
  }
  if (validationReport?.issue_label || report.options?.issue_label) {
    lines.push(`- issue_label: ${validationReport?.issue_label || report.options?.issue_label}`);
  }

  if (intakeResult.status === "ok") {
    lines.push("");
    lines.push("Operator Feedback");
    lines.push("- 导入成功，已完成 intake 主流程。");
    if (Array.isArray(intakeResult.generated_issues) && intakeResult.generated_issues.length > 0) {
      lines.push(`- generated_issues: ${intakeResult.generated_issues.join(", ")}`);
    }
    if (intakeResult.replacement?.mode === "replace_existing_issue") {
      lines.push(`- replacement_target: ${intakeResult.replacement.target_issue_id}`);
      lines.push(`- replacement_backup: ${intakeResult.replacement.backup_root}`);
    }
    if (Array.isArray(intakeResult.generated_scenarios) && intakeResult.generated_scenarios.length > 0) {
      lines.push(`- generated_scenarios: ${intakeResult.generated_scenarios.join(", ")}`);
    }
    if (postActions.length > 0) {
      lines.push(`- post_actions: ${postActions.map((item) => item.action).join(", ")}`);
    } else {
      lines.push("- post_actions: none");
    }
  } else if (intakeResult.status === "blocked" && validationReport) {
    lines.push("");
    lines.push("Operator Feedback");
    lines.push("- 系统已成功识别包结构并进入正确 intake 路由。");
    lines.push("- 当前失败原因是内容包未通过门禁，不是上传接口或路由本身故障。");
    lines.push(`- blocked_records: ${validationReport.blocked_record_count || 0}/${validationReport.record_count || 0}`);
    lines.push(`- blocker_count: ${validationReport.blocker_count || 0}`);
    if (topBlockers.length > 0) {
      lines.push(`- top_blockers: ${topBlockers.map(([code, count]) => `${code} x${count}`).join(", ")}`);
    }
    lines.push("- next_step: 按 blocker codes 修补内容包后重新上传；不要继续改 route。");
    if (report.options?.include_in_candidate || report.options?.publish_to_current) {
      lines.push("- post_actions_skipped: 因导入被门禁阻断，candidate / current 后续动作均未执行。");
    }
  } else {
    lines.push("");
    lines.push("Operator Feedback");
    lines.push(`- 当前失败属于系统/结构类错误：${intakeResult.error_code || "unknown_error"}`);
    lines.push(`- message: ${intakeResult.message || "no message"}`);
    if (intakeResult.error_code === "OPS5_INTAKE_TARGET_EXISTS") {
      lines.push("- next_step: 这是已存在旧期次的保护性阻断。若确实是重传修订，请勾选“替代现有期次”后再次上传。");
    } else if (intakeResult.error_code === "OPS5_REPLACE_TARGET_REQUIRED") {
      lines.push("- next_step: 替代旧期次时必须明确填写 publication_id 与 issue_label，系统不会盲替代。");
    } else if (intakeResult.error_code === "OPS5_REPLACE_TARGET_NOT_FOUND") {
      lines.push("- next_step: 请先核对 publication_id / issue_label 是否与现有 issue 完全一致。");
    } else if (intakeResult.error_code === "OPS5_REPLACE_TARGET_MISMATCH") {
      lines.push("- next_step: 系统已自动回滚；请检查你填写的目标期次与 zip 实际解析结果是否一致。");
    }
    if (intakeResult.replacement_restore?.status === "restored") {
      lines.push(`- replacement_restore: restored from ${intakeResult.replacement_restore.replacement_root || "backup"}`);
    }
    if (intakeResult.error_code === "ENOENT") {
      lines.push("- next_step: 先检查 Route Hint 与 zip 目录结构是否匹配，再重试上传。");
    } else {
      lines.push("- next_step: 先检查上传包结构、路由提示和服务端日志。");
    }
    if (report.options?.include_in_candidate || report.options?.publish_to_current) {
      lines.push("- post_actions_skipped: 导入未成功，candidate / current 后续动作均未执行。");
    }
  }

  lines.push("");
  lines.push("Raw JSON");
  lines.push(JSON.stringify(report, null, 2));
  return lines.join("\n");
}

function setIntakeUploadResult(value) {
  document.getElementById("intake-upload-result").textContent = formatIntakeUploadResult(value);
}

function deriveIssueId(publicationId, issueLabel) {
  const publication = String(publicationId || "").trim();
  const label = String(issueLabel || "").trim();
  if (!publication || !label) {
    return "";
  }
  return `${publication}__${label}`;
}

function syncIssueFormIdentity(form, options = {}) {
  const publicationInput = form.querySelector('input[name="publication_id"]');
  const issueLabelInput = form.querySelector('input[name="issue_label"]');
  const issueIdInput = form.querySelector('input[name="issue_id"]');
  const hint = document.getElementById("issue-derived-hint");
  const derivedIssueId = deriveIssueId(publicationInput?.value, issueLabelInput?.value);
  const previousDerivedIssueId = form.dataset.derivedIssueId || "";
  const shouldAutofill = options.force === true || !issueIdInput.value.trim() || issueIdInput.value.trim() === previousDerivedIssueId;

  if (derivedIssueId && shouldAutofill) {
    issueIdInput.value = derivedIssueId;
  }

  form.dataset.derivedIssueId = derivedIssueId;
  if (hint) {
    hint.textContent = derivedIssueId
      ? `推导 issue_id: ${derivedIssueId}`
      : "create 时只填 publication_id + issue_label 也可以，系统会自动推导 issue_id。";
  }
}

function formPayload(form) {
  const payload = Object.fromEntries(new FormData(form).entries());
  Object.keys(payload).forEach((key) => {
    if (payload[key] === "") delete payload[key];
  });
  return payload;
}

function checkboxChecked(form, name, fallback = false) {
  const input = form.querySelector(`input[name="${name}"]`);
  return input ? input.checked : fallback;
}

async function runCrud(entity, action, payload, resultId, requiresConfirm = true) {
  if (requiresConfirm && !window.confirm(`确认执行 ${entity}:${action} ? 该动作会写入 file-backed source of truth。`)) {
    return;
  }
  setResult(resultId, "running...");
  try {
    const result = await getJson(buildConsoleUrl("/api/crud-action"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ entity, action, ...payload })
    });
    setResult(resultId, result);
    await load();
  } catch (error) {
    setResult(resultId, error.message);
  }
}

async function uploadIntakeZip(form) {
  const fileInput = form.querySelector('input[name="zip_file"]');
  const file = fileInput?.files?.[0];
  if (!file) {
    setResult("intake-upload-result", "请选择 zip 文件");
    return;
  }
  if (!window.confirm(`确认上传并导入 ${file.name} ? 该动作会写 registry / scenario / intake manifest。`)) {
    return;
  }

  const routeHint = form.querySelector('select[name="route_hint"]').value || "auto";
  const publicationId = form.querySelector('input[name="publication_id"]').value.trim();
  const publicationDisplayName = form.querySelector('input[name="publication_display_name"]').value.trim();
  const issueLabel = form.querySelector('input[name="issue_label"]').value.trim();
  const parserProfile = form.querySelector('input[name="parser_profile"]').value.trim();
  const freeQuotaLimit = form.querySelector('input[name="free_quota_limit"]').value || "8";
  const archiveSource = form.querySelector('input[name="archive_source"]').checked;
  const replaceExisting = form.querySelector('input[name="replace_existing"]').checked;
  const includeInCandidate = form.querySelector('input[name="include_in_candidate"]').checked;
  const publishToCurrent = form.querySelector('input[name="publish_to_current"]').checked;
  if (replaceExisting && (!publicationId || !issueLabel)) {
    setIntakeUploadResult("替代现有期次时必须填写 publication_id 和 issue_label");
    return;
  }
  setIntakeUploadResult(`uploading ${file.name} ...`);

  try {
    const response = await fetch(buildConsoleUrl("/api/intake-upload"), {
      method: "POST",
      headers: {
        "content-type": "application/octet-stream",
        "x-upload-filename": file.name,
        "x-route-hint": routeHint,
        "x-free-quota-limit": String(freeQuotaLimit),
        "x-archive-source": archiveSource ? "true" : "false",
        "x-publication-id": publicationId,
        "x-publication-display-name": publicationDisplayName,
        "x-issue-label": issueLabel,
        "x-parser-profile": parserProfile,
        "x-replace-existing": replaceExisting ? "true" : "false",
        "x-include-in-candidate": includeInCandidate ? "true" : "false",
        "x-publish-to-current": publishToCurrent ? "true" : "false"
      },
      body: file
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `/api/intake-upload -> ${response.status}`);
    }
    const result = await response.json();
    setIntakeUploadResult(result);
    form.reset();
    form.querySelector('select[name="route_hint"]').value = "auto";
    form.querySelector('input[name="free_quota_limit"]').value = "8";
    form.querySelector('input[name="archive_source"]').checked = true;
    form.querySelector('input[name="replace_existing"]').checked = false;
    form.querySelector('input[name="include_in_candidate"]').checked = false;
    form.querySelector('input[name="publish_to_current"]').checked = false;
    await load();
  } catch (error) {
    setIntakeUploadResult(error.message);
  }
}

function bindCrudForms() {
  document.getElementById("intake-upload-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    await uploadIntakeZip(event.currentTarget);
  });
  document.getElementById("publication-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const payload = formPayload(form);
    payload.cascade = checkboxChecked(form, "cascade", false);
    payload.purge_files = checkboxChecked(form, "purge_files", true);
    if (payload.action_name === "delete") {
      const deleteHint = payload.cascade
        ? "该动作会级联删除关联 issue、warning budget、accepted warning、override、taxonomy map 和刊物源目录。"
        : "若该刊物仍有关联 issue，脚本会保护性阻断并要求勾选级联删除。";
      if (!window.confirm(`确认删除 publication ${payload.publication_id || ""} ? ${deleteHint} 不会修改 runtime/releases 下的 immutable artifact。`)) {
        return;
      }
      await runCrud("publications", "delete", payload, "publication-result", false);
      return;
    }
    await runCrud("publications", payload.action_name || "edit", payload, "publication-result");
  });
  document.getElementById("issue-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    syncIssueFormIdentity(form, {
      force: (form.querySelector('select[name="action_name"]')?.value || "edit") === "create"
    });
    const payload = formPayload(form);
    payload.purge_files = checkboxChecked(form, "purge_files", true);
    if (payload.action_name === "delete") {
      const deleteHint = payload.purge_files
        ? "该动作会删除 issue registry、candidate budget、accepted warnings，以及这期的源目录和 override 目录。"
        : "该动作会删除 issue registry、candidate budget 与 accepted warnings，但保留这期目录文件。";
      if (!window.confirm(`确认删除 issue ${payload.issue_id || deriveIssueId(payload.publication_id, payload.issue_label) || ""} ? ${deleteHint}`)) {
        return;
      }
      await runCrud("issues", "delete", payload, "issue-result", false);
      return;
    }
    await runCrud("issues", payload.action_name || "edit", payload, "issue-result");
  });
  document.getElementById("article-override-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formPayload(event.currentTarget);
    if (payload.display_warning_suppression) {
      payload.display_warning_suppression = payload.display_warning_suppression.split(",").map((item) => item.trim()).filter(Boolean);
    }
    await runCrud("article_overrides", payload.action_name || "edit", payload, "article-result");
  });
  document.getElementById("taxonomy-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formPayload(event.currentTarget);
    await runCrud("taxonomy", payload.action_name || "edit", payload, "taxonomy-result");
  });
  document.getElementById("membership-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = formPayload(event.currentTarget);
    await runCrud("scenario_membership", payload.action_name || "edit", payload, "membership-result");
  });
  document.getElementById("membership-rebuild").addEventListener("click", async () => {
    await runCrud("scenario_membership", "rebuild", {}, "membership-result");
  });

  const issueForm = document.getElementById("issue-form");
  issueForm.querySelector('input[name="publication_id"]').addEventListener("input", () => syncIssueFormIdentity(issueForm));
  issueForm.querySelector('input[name="issue_label"]').addEventListener("input", () => syncIssueFormIdentity(issueForm));
  issueForm.querySelector('select[name="action_name"]').addEventListener("change", () => syncIssueFormIdentity(issueForm));
  syncIssueFormIdentity(issueForm, { force: true });
}

async function load() {
  const snapshot = await getJson(buildConsoleUrl("/api/snapshot"));
  syncRemoteBaseUrlInput(snapshot);
  const overview = snapshot.overview || {};
  const content = snapshot.content || {};
  const quality = snapshot.quality || {};
  const scenarios = snapshot.scenarios || {};
  const release = snapshot.release || {};
  const observability = snapshot.observability || {};
  const editorial = snapshot.editorial || {};
  const ops5 = snapshot.ops5 || {};

  document.getElementById("status-box").textContent =
    `current ${overview.current_scenario_id || "unknown"} | candidate ${overview.candidate_decision || "unknown"} | source ${overview.runtime_source?.mode || "current_mirror"}`;

  renderKeyValues(document.getElementById("overview"), {
    baseline: overview.baseline_scenario_id,
    selected: overview.selected_scenario_id,
    current: overview.current_scenario_id,
    candidate: overview.candidate_scenario_id,
    decision: overview.candidate_decision,
    last_publish: overview.latest_publish ? overview.latest_publish.action : "none",
    last_rollback: overview.latest_rollback ? overview.latest_rollback.action : "none",
    runtime_source: overview.runtime_source?.mode || "current_mirror",
    runtime_target: overview.runtime_source?.scenario_id || overview.runtime_source?.channel || "current"
  });

  const contentTarget = document.getElementById("content");
  contentTarget.innerHTML = "";
  renderList(contentTarget, "Publications", content.publications || [], (item) => `${item.id}: ${item.display_name}`);
  renderPublicationSummarySection(contentTarget, "Publication Timelines", content.publication_summaries || [], 6);
  renderList(contentTarget, "Latest Issues", (content.issues || []).slice(0, 12), (item) => `${item.issue_id} | articles=${item.article_pair_count || item.article_count || 0} | parser=${item.parser_profile || "n/a"}`);
  renderList(contentTarget, "Taxonomy Coverage", content.taxonomy_coverage || [], (item) => `${item.publication_key} | mapped=${Math.round((item.mapped_ratio || 0) * 100)}% | raw_sections=${item.raw_section_count}`);

  const qualityTarget = document.getElementById("quality");
  qualityTarget.innerHTML = "";
  renderKeyValues(qualityTarget, {
    release_candidate: quality.promotion_readiness?.release_candidate?.decision || quality.promotion_readiness?.release_candidate?.scenario_id || "n/a",
    mixed_preview: quality.promotion_readiness?.mixed_preview?.decision || "n/a",
    taxonomy_regression: quality.taxonomy_drift?.taxonomy_regression,
    accepted_warning_entries: quality.accepted_warnings?.entries?.length || 0
  });

  const scenariosTarget = document.getElementById("scenarios");
  scenariosTarget.innerHTML = "";
  renderList(scenariosTarget, "Scenario List", scenarios.items || [], (item) => `${item.scenario_id} | ${item.status} | ${item.source_kind}`);
  renderKeyValues(scenariosTarget, {
    dashboard_candidate: scenarios.dashboard?.candidate_scenario_id || "n/a",
    dashboard_decision: scenarios.dashboard?.promotion_decision?.decision || "n/a"
  });

  const releaseTarget = document.getElementById("release");
  releaseTarget.innerHTML = "";
  renderKeyValues(releaseTarget, {
    manifest_scenario: release.manifest?.scenario_id || "n/a",
    dev_channel: release.channels?.find((item) => item.channel === "dev")?.current_release_id || "n/a",
    staging_channel: release.channels?.find((item) => item.channel === "staging")?.current_release_id || "n/a",
    production_channel: release.channels?.find((item) => item.channel === "production")?.current_release_id || "n/a",
    runtime_source: release.runtime_source?.mode || "n/a",
    remote_base_url: release.runtime_source?.remote_base_url || "n/a",
    dist_verify: release.runtime_dist?.verify?.status || "n/a",
    dist_dev_release: release.runtime_dist?.index?.channels?.find((item) => item.channel === "dev")?.release_id || "n/a",
    release_notes: release.release_notes_path || "n/a",
    publish_history_items: release.publish_history?.length || 0,
    rollback_current: release.post_rollback_snapshot?.current_scenario_id || release.post_rollback_snapshot?.selected_scenario_id || "n/a"
  });

  const observabilityTarget = document.getElementById("observability");
  observabilityTarget.innerHTML = "";
  renderKeyValues(observabilityTarget, {
    source_health: observability.source_health?.health_status || "n/a",
    runtime_source: observability.triage_dashboard?.runtime_source?.mode || "n/a",
    runtime_target:
      observability.triage_dashboard?.runtime_source?.scenario_id ||
      observability.triage_dashboard?.runtime_source?.channel ||
      observability.triage_dashboard?.runtime_source?.release_id ||
      "n/a",
    recent_runtime_failures: observability.triage_dashboard?.recent_runtime_failures || 0,
    recent_incidents: observability.triage_dashboard?.recent_incidents || 0,
    taxonomy_gap_events: observability.triage_dashboard?.taxonomy_gap_events || 0
  });

  const incidentsTarget = document.getElementById("incidents");
  incidentsTarget.innerHTML = "";
  renderKeyValues(incidentsTarget, {
    total_incidents: observability.incidents?.total_incidents || 0,
    latest_incident: observability.triage_dashboard?.latest_incident?.event_type || "none",
    top_content_failure: observability.triage_dashboard?.top_content_failure?.key || "n/a",
    latest_publish_health: observability.triage_dashboard?.latest_publish_health?.event_type || "n/a"
  });
  renderList(incidentsTarget, "Recent Incidents", observability.incidents?.recent_incidents || [], (item) => `${item.occurred_at} | ${item.event_type} | ${item.error_code || "no_code"} | ${item.error_message || "no_message"}`);

  const editorialTarget = document.getElementById("editorial");
  editorialTarget.innerHTML = "";
  renderKeyValues(editorialTarget, {
    publication_count: editorial.publications?.length || 0,
    issue_count: editorial.issues?.length || 0,
    canonical_sections: editorial.taxonomy?.canonical_sections?.length || 0,
    discovery_buckets: editorial.taxonomy?.discovery_buckets?.length || 0,
    audit_entries: editorial.audit?.total_entries || 0
  });
  renderPublicationSummarySection(editorialTarget, "Issue Health Matrix", editorial.publication_summaries || [], 10);
  renderList(editorialTarget, "Recent CRUD Changes", editorial.audit?.recent_changes || [], (item) => `${item.timestamp} | ${item.entity_type}:${item.action} | ${item.entity_id} | success=${item.success}`);
  renderList(editorialTarget, "Publication List", editorial.publications || [], (item) => `${item.publication_id} | ${item.display_name} | status=${item.status} | enabled=${item.enabled}`);
  renderList(editorialTarget, "Issue List", (editorial.issues || []).slice(0, 20), (item) => `${item.issue_id} | parser=${item.parser_profile || "n/a"} | source=${item.source_pack || "n/a"} | enabled=${item.enabled}`);

  const ops5Target = document.getElementById("ops5");
  ops5Target.innerHTML = "";
  renderKeyValues(ops5Target, {
    audit_log_items: ops5.audit_log?.items?.length || 0,
    rebuild_triggers: ops5.rebuild_trigger_report?.total_follow_up_actions || 0,
    recent_entity_types: Object.keys(ops5.entity_change_report?.counts_by_entity_type || {}).join(", ") || "none"
  });
}

document.getElementById("action-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = formPayload(event.currentTarget);
  const statefulActions = new Set(["apply_publish", "rollback", "retire", "intake"]);
  if (statefulActions.has(payload.action)) {
    const confirmed = window.confirm(`确认执行 ${payload.action} ? 该动作可能修改 selected/current 或 scenario lifecycle。`);
    if (!confirmed) {
      return;
    }
  }
  setResult("action-result", "running...");
  try {
    const result = await getJson(buildConsoleUrl("/api/action"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    setResult("action-result", result);
    await load();
  } catch (error) {
    setResult("action-result", error.message);
  }
});

syncRemoteBaseUrlInput();
bindCrudForms();
load().catch((error) => {
  document.getElementById("status-box").textContent = error.message;
});
