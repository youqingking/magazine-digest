import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const mobileProjectRoot = path.join(repoRoot, "mobile");
const outDir = path.join(repoRoot, "output", "stage-ui35-h5");
const reportPath = path.join(outDir, "h5-shell-report.json");
const wrapperReportPath = path.join(outDir, "h5-shell-wrapper.json");
const logPath = path.join(outDir, "h5-shell-build.log");
const buildDir = path.join(mobileProjectRoot, "unpackage", "dist", "build", "web");

fs.mkdirSync(outDir, { recursive: true });

function firstExistingPath(candidates) {
  for (const candidate of candidates.filter(Boolean)) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return "";
}

function normalizeRootCandidate(candidate) {
  if (!candidate) {
    return "";
  }
  if (/\.exe$/i.test(candidate)) {
    return path.dirname(candidate);
  }
  return candidate;
}

function resolveHBuilderXCliPath() {
  const rootCandidates = [
    process.env.UI35_HBUILDERX_ROOT,
    "D:/HBuilderX0",
    "D:/HBuilderX",
    normalizeRootCandidate(process.env.HBUILDERX_CLI_PATH),
    normalizeRootCandidate(process.env.HBUILDERX_EXE),
    normalizeRootCandidate(process.env.HBUILDERX_PATH),
    "C:/Program Files/HBuilderX",
    "C:/Program Files (x86)/HBuilderX",
    "D:/Program Files/HBuilderX"
  ];

  return firstExistingPath([
    process.env.HBUILDERX_CLI_PATH,
    ...rootCandidates.map((root) => (root ? path.join(root, "cli.exe") : ""))
  ]);
}

function resolvePlaywrightBrowserConfig() {
  if (process.env.PLAYWRIGHT_CHROME_PATH) {
    return {
      executablePath: process.env.PLAYWRIGHT_CHROME_PATH,
      channel: ""
    };
  }

  const chromePath = firstExistingPath([
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"
  ]);
  if (chromePath) {
    return {
      executablePath: "",
      channel: "chrome"
    };
  }

  const edgePath = firstExistingPath([
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
  ]);
  if (edgePath) {
    return {
      executablePath: "",
      channel: "msedge"
    };
  }

  return {
    executablePath: "",
    channel: ""
  };
}

function writeBlockedReport(blockingReason, extra = {}) {
  const report = {
    generated_at: new Date().toISOString(),
    status: "blocked",
    blocking_reason: blockingReason,
    ...extra
  };
  fs.writeFileSync(wrapperReportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  if (!fs.existsSync(reportPath)) {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + "\n", "utf8");
  }
  console.log(JSON.stringify(report, null, 2));
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    default:
      return "application/octet-stream";
  }
}

function createStaticServer(rootDir) {
  return http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);

    if (pathname === "/") {
      pathname = "/index.html";
    }

    let filePath = path.join(rootDir, pathname);

    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("Forbidden");
      return;
    }

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(rootDir, "index.html");
    }

    response.writeHead(200, {
      "Content-Type": getContentType(filePath),
      "Cache-Control": "no-store"
    });
    fs.createReadStream(filePath).pipe(response);
  });
}

function sanitizeBuiltIndex(rootDir) {
  const indexFile = path.join(rootDir, "index.html");
  if (!fs.existsSync(indexFile)) {
    return;
  }

  const original = fs.readFileSync(indexFile, "utf8");
  const sanitized = original.replace(
    /<script src=https:\/\/cn-shanghai-aliyun-cloudauth\.oss-cn-shanghai\.aliyuncs\.com\/web_sdk_js\/jsvm_all\.js><\/script>/i,
    ""
  );

  if (sanitized !== original) {
    fs.writeFileSync(indexFile, sanitized, "utf8");
  }
}

function runPlaywright(playwrightEnv) {
  return new Promise((resolve, reject) => {
    const command = process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "npx";
    const args =
      process.platform === "win32"
        ? ["/d", "/s", "/c", "npx playwright test tests/smoke/ui35-h5-shell.spec.js --reporter=line"]
        : ["playwright", "test", "tests/smoke/ui35-h5-shell.spec.js", "--reporter=line"];

    const child = spawn(command, args, {
      cwd: repoRoot,
      env: playwrightEnv,
      stdio: "inherit"
    });

    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`PLAYWRIGHT_EXIT_${code ?? "UNKNOWN"}`));
    });
  });
}

async function main() {
  const cliPath = resolveHBuilderXCliPath();
  const browserConfig = resolvePlaywrightBrowserConfig();

  if (!cliPath) {
    writeBlockedReport("HBUILDERX_CLI_MISSING");
    process.exit(0);
  }

  try {
    const publishOutput = execFileSync(
      cliPath,
      ["publish", "web", "--project", mobileProjectRoot, "--webTitle", "Magazine Digest UI3.5 H5"],
      {
        cwd: repoRoot,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 16 * 1024 * 1024
      }
    );
    fs.writeFileSync(logPath, publishOutput, "utf8");
  } catch (error) {
    writeBlockedReport("HBUILDERX_WEB_PUBLISH_FAILED", {
      hbuilderx_cli_path: cliPath,
      stderr: error.stderr || "",
      stdout: error.stdout || ""
    });
    process.exit(0);
  }

  try {
    if (!fs.existsSync(path.join(buildDir, "index.html"))) {
      writeBlockedReport("HBUILDERX_WEB_BUILD_MISSING", {
        hbuilderx_cli_path: cliPath,
        build_dir: buildDir
      });
      process.exit(0);
    }

    sanitizeBuiltIndex(buildDir);

    const server = createStaticServer(buildDir);
    const requestedPort = Number(process.env.UI35_H5_PORT || 18085);
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(requestedPort, "127.0.0.1", resolve);
    });

    try {
      const playwrightEnv = {
        ...process.env,
        H5_SMOKE_URL: process.env.H5_SMOKE_URL || `http://127.0.0.1:${requestedPort}/#/`,
        PLAYWRIGHT_CHROME_PATH: browserConfig.executablePath || "",
        PLAYWRIGHT_BROWSER_CHANNEL: browserConfig.channel || "",
        UI35_H5_REPORT_PATH: reportPath
      };
      await runPlaywright(playwrightEnv);
      fs.writeFileSync(
        wrapperReportPath,
        JSON.stringify(
          {
            generated_at: new Date().toISOString(),
            status: "passed",
            hbuilderx_cli_path: cliPath,
            build_dir: buildDir,
            report_path: reportPath
          },
          null,
          2
        ) + "\n",
        "utf8"
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  } catch (error) {
    writeBlockedReport(error.message || "UI35_H5_SMOKE_FAILED", {
      hbuilderx_cli_path: cliPath,
      build_dir: buildDir
    });
    process.exit(0);
  }
}

main().catch((error) => {
  writeBlockedReport(error.message || "UI35_H5_SMOKE_FAILED");
  process.exit(0);
});
