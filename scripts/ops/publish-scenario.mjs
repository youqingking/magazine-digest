import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const promoteScript = path.join(__dirname, "promote-scenario.mjs");
const child = spawn(process.execPath, [promoteScript, ...process.argv.slice(2)], {
  stdio: "inherit"
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
