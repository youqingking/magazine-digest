import { exportRuntimeDist } from "./lib/runtime-dist-lib.mjs";

console.log(JSON.stringify(exportRuntimeDist().runtimeDistReport, null, 2));
