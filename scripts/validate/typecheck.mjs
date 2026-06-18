import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outputDir = path.join(repoRoot, "output", "typecheck");
const reportPath = path.join(outputDir, "typecheck-report.json");
const tempDir = path.join(outputDir, ".tmp-vue-scripts");

const fileExtensions = new Set([".js", ".mjs", ".vue"]);
const ignoredDirectoryNames = new Set([
  ".git",
  ".hbuilderx",
  "node_modules",
  "output",
  "unpackage"
]);
const ignoredRepoPrefixes = [
  "artifacts/",
  "data/",
  "mobile/uniCloud-aliyun/",
  "mobile/uniCloud-tcb/",
  "mobile/uni_modules/",
  "play-store-launch/",
  "runtime/dist/"
];
const scanRoots = [
  "mobile/api",
  "mobile/components",
  "mobile/contracts",
  "mobile/fixtures/runtime",
  "mobile/pages",
  "mobile/services",
  "mobile/stores",
  "mobile/theme",
  "mobile/App.vue",
  "mobile/main.js",
  "packages",
  "scripts/bootstrap",
  "scripts/contracts",
  "scripts/content",
  "scripts/harness",
  "scripts/import",
  "scripts/ops",
  "scripts/validate",
  "shared"
];
const expectedContractTypes = [
  "ReadingMode",
  "AudienceSegment",
  "PublishStatus",
  "PaymentOrderStatus",
  "SubscriptionStatus",
  "EventName"
];

function toRepoRelative(absolutePath) {
  return path.relative(repoRoot, absolutePath).replaceAll("\\", "/");
}

function shouldIgnore(absolutePath) {
  const relativePath = toRepoRelative(absolutePath);
  return ignoredRepoPrefixes.some((prefix) => relativePath === prefix.slice(0, -1) || relativePath.startsWith(prefix));
}

function walk(absolutePath, files) {
  if (!fs.existsSync(absolutePath) || shouldIgnore(absolutePath)) {
    return;
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isDirectory()) {
    const name = path.basename(absolutePath);
    if (ignoredDirectoryNames.has(name)) {
      return;
    }
    for (const entry of fs.readdirSync(absolutePath, { withFileTypes: true })) {
      walk(path.join(absolutePath, entry.name), files);
    }
    return;
  }

  if (stat.isFile() && fileExtensions.has(path.extname(absolutePath))) {
    files.push(absolutePath);
  }
}

function collectSourceFiles() {
  const files = [];
  for (const root of scanRoots) {
    walk(path.join(repoRoot, root), files);
  }
  return [...new Set(files)].sort((a, b) => toRepoRelative(a).localeCompare(toRepoRelative(b)));
}

function runNodeCheck(filePath) {
  const result = spawnSync(process.execPath, ["--check", filePath], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  return {
    ok: result.status === 0,
    exit_code: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function extractVueScripts(content) {
  const scripts = [];
  const pattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  for (const match of content.matchAll(pattern)) {
    scripts.push({
      attrs: match[1] || "",
      content: match[2] || ""
    });
  }
  return scripts;
}

function checkSyntax(filePath) {
  const extension = path.extname(filePath);
  if (extension !== ".vue") {
    return [runNodeCheck(filePath)];
  }

  const content = fs.readFileSync(filePath, "utf8");
  const scripts = extractVueScripts(content);
  if (scripts.length === 0) {
    return [{ ok: true, exit_code: 0, stdout: "", stderr: "" }];
  }

  fs.mkdirSync(tempDir, { recursive: true });
  return scripts.map((script, index) => {
    if (/\blang\s*=\s*["']ts["']/i.test(script.attrs)) {
      return {
        ok: false,
        exit_code: 1,
        stdout: "",
        stderr: "Vue SFC uses lang=\"ts\" but this repository has no TypeScript compiler configured."
      };
    }

    const tempPath = path.join(tempDir, `${toRepoRelative(filePath).replace(/[/:\\]/g, "__")}__${index}.mjs`);
    fs.writeFileSync(tempPath, script.content, "utf8");
    return runNodeCheck(tempPath);
  });
}

function extractImportSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[^'"]+\s+from\s+["']([^"']+)["']/g,
    /\bimport\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\(\s*["']([^"']+)["']\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function stripSpecifierSuffix(specifier) {
  return specifier.split(/[?#]/)[0];
}

function resolveAlias(specifier) {
  if (specifier.startsWith("@/")) {
    return path.join(repoRoot, "mobile", specifier.slice(2));
  }
  if (specifier.startsWith("~@/")) {
    return path.join(repoRoot, "mobile", specifier.slice(3));
  }
  return "";
}

function resolveLocalSpecifier(fromFile, specifier) {
  const cleanSpecifier = stripSpecifierSuffix(specifier);
  const basePath = cleanSpecifier.startsWith(".")
    ? path.resolve(path.dirname(fromFile), cleanSpecifier)
    : resolveAlias(cleanSpecifier);

  if (!basePath) {
    return "";
  }

  const candidates = [
    basePath,
    `${basePath}.js`,
    `${basePath}.mjs`,
    `${basePath}.json`,
    `${basePath}.vue`,
    path.join(basePath, "index.js"),
    path.join(basePath, "index.mjs"),
    path.join(basePath, "index.json"),
    path.join(basePath, "index.vue")
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || "";
}

function sourceTextForImports(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  if (path.extname(filePath) !== ".vue") {
    return content;
  }
  return extractVueScripts(content).map((script) => script.content).join("\n");
}

function checkImportResolution(filePath) {
  const issues = [];
  const content = sourceTextForImports(filePath);
  for (const specifier of extractImportSpecifiers(content)) {
    if (!(specifier.startsWith(".") || specifier.startsWith("@/") || specifier.startsWith("~@/"))) {
      continue;
    }
    if (!resolveLocalSpecifier(filePath, specifier)) {
      issues.push({
        file: toRepoRelative(filePath),
        specifier,
        problem: "local_import_unresolved"
      });
    }
  }
  return issues;
}

function checkContractTypes() {
  const typeFile = path.join(repoRoot, "shared", "types", "contracts.d.ts");
  if (!fs.existsSync(typeFile)) {
    return {
      ok: false,
      path: toRepoRelative(typeFile),
      missing_types: expectedContractTypes
    };
  }

  const content = fs.readFileSync(typeFile, "utf8");
  const missingTypes = expectedContractTypes.filter(
    (name) => !new RegExp(`\\bexport\\s+type\\s+${name}\\b`).test(content)
  );
  return {
    ok: missingTypes.length === 0,
    path: toRepoRelative(typeFile),
    missing_types: missingTypes
  };
}

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.rmSync(tempDir, { recursive: true, force: true });

  const files = collectSourceFiles();
  const syntaxIssues = [];
  const importIssues = [];

  for (const file of files) {
    const syntaxResults = checkSyntax(file);
    syntaxResults.forEach((result, index) => {
      if (!result.ok) {
        syntaxIssues.push({
          file: toRepoRelative(file),
          block: path.extname(file) === ".vue" ? `script[${index}]` : "module",
          exit_code: result.exit_code,
          stderr: result.stderr,
          stdout: result.stdout
        });
      }
    });
    importIssues.push(...checkImportResolution(file));
  }

  fs.rmSync(tempDir, { recursive: true, force: true });

  const contractTypes = checkContractTypes();
  const passed = syntaxIssues.length === 0 && importIssues.length === 0 && contractTypes.ok;
  const report = {
    generated_at: new Date().toISOString(),
    status: passed ? "ok" : "blocked",
    passed,
    gate: "typecheck",
    checker: "js_uniapp_static_type_gate",
    summary: {
      files_checked: files.length,
      syntax_issue_count: syntaxIssues.length,
      import_issue_count: importIssues.length,
      contract_type_missing_count: contractTypes.missing_types.length
    },
    evidence: {
      node: process.version,
      scan_roots: scanRoots,
      ignored_repo_prefixes: ignoredRepoPrefixes,
      contract_types: contractTypes
    },
    issues: {
      syntax: syntaxIssues,
      imports: importIssues
    }
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));

  if (!passed) {
    process.exit(1);
  }
}

main();
