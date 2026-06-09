import { createRuntimeConfigStub } from "../contracts/runtime-contract.js";

export function createShellPageModel(pageKey) {
  return {
    pageKey,
    runtime: createRuntimeConfigStub(),
    status: "read_path_ready",
    stage: "E0",
    businessEnabled: true
  };
}
