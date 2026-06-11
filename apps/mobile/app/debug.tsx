import { ScrollView, Text, View } from "react-native";

import { describeNotificationSeam } from "../../../packages/core-runtime/src/seams/notification-seam";
import { describeRevenueCatEntitlementSeam } from "../../../packages/core-runtime/src/seams/revenuecat-entitlement-seam";
import { describeSupabaseRuntimeSeam } from "../../../packages/core-runtime/src/seams/supabase-seam";
import { useRuntimeFixture } from "../src/runtime/use-runtime-fixture";

export default function DebugScreen() {
  const runtime = useRuntimeFixture();
  const productKey = runtime.status === "ready" || runtime.status === "empty" || runtime.status === "unavailable"
    ? runtime.metadata.productKey
    : "fixture_unresolved";
  const seams = [
    describeSupabaseRuntimeSeam(productKey),
    describeRevenueCatEntitlementSeam(productKey),
    describeNotificationSeam(productKey)
  ];

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: "#51606a", fontSize: 13 }}>
          selected scenario
        </Text>
        <Text selectable style={{ color: "#11181c", fontSize: 22, fontWeight: "700" }}>
          {runtime.status === "ready" || runtime.status === "empty" || runtime.status === "unavailable"
            ? runtime.metadata.scenarioId
            : runtime.status}
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 14 }}>
          product_key {productKey}
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        {seams.map((seam) => (
          <View
            key={seam.name}
            style={{
              borderRadius: 8,
              borderWidth: 1,
              borderColor: "#d6e1e6",
              padding: 12,
              gap: 4,
              backgroundColor: "#ffffff"
            }}
          >
            <Text selectable style={{ color: "#11181c", fontSize: 16, fontWeight: "700" }}>
              {seam.name}
            </Text>
            <Text selectable style={{ color: "#51606a", fontSize: 13 }}>
              {seam.status}
            </Text>
            <Text selectable style={{ color: "#51606a", fontSize: 13, lineHeight: 19 }}>
              {seam.note}
            </Text>
          </View>
        ))}
      </View>

      <Text selectable style={{ color: "#6c7b83", fontSize: 13, lineHeight: 19 }}>
        Runtime source:{" "}
        {runtime.status === "ready" || runtime.status === "empty" || runtime.status === "unavailable"
          ? runtime.metadata.sourceLabel
          : "not loaded"}
        .
      </Text>
    </ScrollView>
  );
}
