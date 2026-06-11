import {
  buildRuntimeShellState,
  type RuntimeFixtureBundle,
  type RuntimeShellState
} from "../runtime-fixture-reader.ts";
import type {
  RuntimeDataRepository,
  RuntimeContentRepository,
  RuntimeEntitlementRepository,
  RuntimeEntitlementSnapshot,
  RuntimeFixtureBundleSource,
  RuntimeNotificationRepository,
  RuntimeNotificationSnapshot,
  RuntimeRepositoryContext,
  RuntimeScenarioRepository,
  RuntimeScenarioDescriptor
} from "../runtime-data-port.ts";

type RuntimeFixtureRepository = RuntimeContentRepository &
  RuntimeScenarioRepository &
  RuntimeEntitlementRepository &
  RuntimeNotificationRepository &
  RuntimeDataRepository;

export function createRuntimeFixtureRepository(source: RuntimeFixtureBundleSource): RuntimeFixtureRepository {
  const productKey = readProductKey(source.bundle);

  return {
    sourceKind: "fixture",
    connects: false,
    loadContentState(context?: RuntimeRepositoryContext): RuntimeShellState {
      return buildRuntimeShellState(source.bundle, {
        requestedScenarioId: context?.requestedScenarioId || source.requestedScenarioId,
        sourceLabel: source.sourceLabel
      });
    },
    loadScenario(context?: RuntimeRepositoryContext): RuntimeScenarioDescriptor {
      const scenarioId = readScenarioId(source.bundle) || context?.requestedScenarioId || source.requestedScenarioId;
      return {
        status: source.bundle ? "ready" : "unavailable",
        productKey,
        product_key: productKey,
        scenarioId,
        sourceKind: "fixture",
        sourceLabel: source.sourceLabel,
        message: source.bundle ? undefined : "No runtime fixture bundle is available."
      };
    },
    loadEntitlementSnapshot(context?: RuntimeRepositoryContext): RuntimeEntitlementSnapshot {
      const scopedProductKey = context?.productKey || productKey;
      return {
        status: "placeholder",
        productKey: scopedProductKey,
        product_key: scopedProductKey,
        sourceKind: "fixture",
        message: "Fixture entitlement metadata is local test data, not a RevenueCat grant."
      };
    },
    loadNotificationSnapshot(context?: RuntimeRepositoryContext): RuntimeNotificationSnapshot {
      const scopedProductKey = context?.productKey || productKey;
      return {
        status: "placeholder",
        productKey: scopedProductKey,
        product_key: scopedProductKey,
        sourceKind: "fixture",
        message: "Fixture notification metadata is local test data, not a push registration."
      };
    }
  };
}

function readProductKey(bundle: RuntimeFixtureBundle | null): string {
  const metadata = bundle?.metadata || {};
  const bootstrapProduct = bundle?.bootstrapConfig?.response?.product as Record<string, unknown> | undefined;
  return readString(metadata.product_key) || readString(bootstrapProduct?.product_key) || "fixture_unknown";
}

function readScenarioId(bundle: RuntimeFixtureBundle | null): string {
  const metadata = bundle?.metadata || {};
  return readString(metadata.selected_scenario_id) || readString(metadata.scenario_id);
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}
