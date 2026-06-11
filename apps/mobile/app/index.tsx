import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useRuntimeFixture } from "../src/runtime/use-runtime-fixture";

export default function DiscoveryScreen() {
  const runtime = useRuntimeFixture();

  if (runtime.status === "loading") {
    return <StatusView title="Loading fixture" message="Resolving selected runtime scenario..." />;
  }

  if (runtime.status === "missing") {
    return <StatusView title="Missing fixture" message={runtime.message} />;
  }

  if (runtime.status === "empty") {
    return <StatusView title="Empty discovery" message={runtime.message} />;
  }

  if (runtime.status === "unavailable") {
    return <StatusView title="Runtime data unavailable" message={runtime.message} />;
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 18 }}>
      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: "#51606a", fontSize: 13 }}>
          product_key
        </Text>
        <Text selectable style={{ color: "#11181c", fontSize: 22, fontWeight: "700" }}>
          {runtime.metadata.productKey}
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 14 }}>
          scenario {runtime.metadata.scenarioId}
        </Text>
      </View>

      <Link href="/debug" asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => ({
            alignSelf: "flex-start",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "#9bb6c5",
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: pressed ? "#e8f3f7" : "#f6fbfd"
          })}
        >
          <Text style={{ color: "#1f5667", fontWeight: "700" }}>Scenario debug</Text>
        </Pressable>
      </Link>

      <View style={{ gap: 10 }}>
        {runtime.articles.map((article) => (
          <Link
            key={article.articleId}
            href={{ pathname: "/article/[articleId]", params: { articleId: article.articleId } }}
            asChild
          >
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => ({
                borderRadius: 8,
                borderWidth: 1,
                borderColor: pressed ? "#6f9aaa" : "#d6e1e6",
                padding: 14,
                gap: 6,
                backgroundColor: pressed ? "#eef7f9" : "#ffffff"
              })}
            >
              <Text selectable style={{ color: "#51606a", fontSize: 12, fontWeight: "700" }}>
                {article.publicationName || article.publicationKey || "Unknown publication"}
              </Text>
              <Text selectable style={{ color: "#11181c", fontSize: 17, fontWeight: "700" }}>
                {article.title}
              </Text>
              <Text selectable numberOfLines={3} style={{ color: "#51606a", fontSize: 14, lineHeight: 20 }}>
                {article.summary || "No summary in fixture."}
              </Text>
              <Text selectable style={{ color: "#6c7b83", fontSize: 12 }}>
                {article.issueLabel || "fixture article"} · {article.primaryAudience}/{article.primaryReadingMode}
              </Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

function StatusView({ title, message }: { title: string; message: string }) {
  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 10 }}>
      <Text selectable style={{ color: "#11181c", fontSize: 22, fontWeight: "700" }}>
        {title}
      </Text>
      <Text selectable style={{ color: "#51606a", fontSize: 15, lineHeight: 22 }}>
        {message}
      </Text>
    </ScrollView>
  );
}
