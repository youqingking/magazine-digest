import type { RuntimeFixtureBundle, RuntimeShellState } from "./runtime-fixture-reader.ts";

export type RuntimeDataSource = "fixture" | "supabase";

export type MaybePromise<T> = T | Promise<T>;

export type RuntimeRepositoryContext = {
  productKey?: string;
  requestedScenarioId?: string;
};

export type RuntimeScenarioDescriptor = {
  status: "ready" | "unavailable";
  productKey: string;
  product_key: string;
  scenarioId: string;
  sourceKind: RuntimeDataSource;
  sourceLabel: string;
  message?: string;
};

export type RuntimeEntitlementSnapshot = {
  status: "placeholder" | "unavailable";
  productKey: string;
  product_key: string;
  sourceKind: RuntimeDataSource;
  message: string;
};

export type RuntimeNotificationSnapshot = {
  status: "placeholder" | "unavailable";
  productKey: string;
  product_key: string;
  sourceKind: RuntimeDataSource;
  message: string;
};

export interface RuntimeContentRepository {
  sourceKind: RuntimeDataSource;
  connects: boolean;
  loadContentState(context?: RuntimeRepositoryContext): MaybePromise<RuntimeShellState>;
}

export interface RuntimeScenarioRepository {
  sourceKind: RuntimeDataSource;
  connects: boolean;
  loadScenario(context?: RuntimeRepositoryContext): MaybePromise<RuntimeScenarioDescriptor>;
}

export interface RuntimeEntitlementRepository {
  sourceKind: RuntimeDataSource;
  connects: boolean;
  loadEntitlementSnapshot(context?: RuntimeRepositoryContext): MaybePromise<RuntimeEntitlementSnapshot>;
}

export interface RuntimeNotificationRepository {
  sourceKind: RuntimeDataSource;
  connects: boolean;
  loadNotificationSnapshot(context?: RuntimeRepositoryContext): MaybePromise<RuntimeNotificationSnapshot>;
}

export type RuntimeDataRepository = RuntimeContentRepository &
  RuntimeScenarioRepository &
  RuntimeEntitlementRepository &
  RuntimeNotificationRepository;

export type RuntimeFixtureBundleSource = {
  bundle: RuntimeFixtureBundle | null;
  sourceLabel: string;
  requestedScenarioId: string;
};
