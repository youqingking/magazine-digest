import { execFileSync } from "node:child_process";
import fs from "node:fs";

export function extractZipToDir(zipPath, destinationPath, envKeyPrefix = "ZIP_EXTRACT") {
  if (fs.existsSync(destinationPath)) {
    fs.rmSync(destinationPath, { recursive: true, force: true });
  }
  fs.mkdirSync(destinationPath, { recursive: true });

  const env = {
    ...process.env,
    [`${envKeyPrefix}_SOURCE`]: zipPath,
    [`${envKeyPrefix}_DEST`]: destinationPath
  };

  const attempts = [];

  if (process.platform === "win32") {
    attempts.push(() => execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath $env:${envKeyPrefix}_SOURCE -DestinationPath $env:${envKeyPrefix}_DEST -Force`
      ],
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 128 * 1024 * 1024,
        env
      }
    ));
  }

  attempts.push(() => execFileSync(
    "python3",
    [
      "-c",
      [
        "import os, zipfile",
        `src = os.environ['${envKeyPrefix}_SOURCE']`,
        `dst = os.environ['${envKeyPrefix}_DEST']`,
        "with zipfile.ZipFile(src) as z:",
        "    z.extractall(dst)"
      ].join("; ")
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024,
      env
    }
  ));

  attempts.push(() => execFileSync(
    "unzip",
    ["-o", zipPath, "-d", destinationPath],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      maxBuffer: 128 * 1024 * 1024,
      env
    }
  ));

  let lastError = null;
  for (const run of attempts) {
    try {
      run();
      return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error(`ZIP_EXTRACT_FAILED:${zipPath}`);
}
