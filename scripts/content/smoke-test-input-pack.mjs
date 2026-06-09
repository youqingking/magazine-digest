import { smokeTestInputPack } from "./synthetic-test-pack-lib.mjs";

try {
  console.log(JSON.stringify(smokeTestInputPack(), null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "error", message: error.message }, null, 2));
  process.exit(1);
}
