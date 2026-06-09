import { runtimeGateway } from "./runtime-gateway.service.js";

export async function loadExperimentAssignment() {
  return runtimeGateway.getExperimentAssignment();
}

export function createExperimentAssignmentStub() {
  return {
    capability: "experiment.assign",
    contractStatus: "local_runtime_first"
  };
}
