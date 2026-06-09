import path from "node:path";

import { archivePack, parseArgs } from "./lib/ops-lib.mjs";

const args = parseArgs(process.argv.slice(2));
const source = args.zip || args.path;
if (!source) {
  throw new Error("OPS1_ARCHIVE_SOURCE_REQUIRED");
}

const result = archivePack(path.isAbsolute(source) ? source : path.join(process.cwd(), source));
console.log(JSON.stringify({ status: "ok", ...result }, null, 2));
