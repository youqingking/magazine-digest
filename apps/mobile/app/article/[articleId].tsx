import { Stack, useLocalSearchParams } from "expo-router";
import { ScrollView, Text, View } from "react-native";

import { useRuntimeFixture } from "../../src/runtime/use-runtime-fixture";

export default function ArticleScreen() {
  const { articleId } = useLocalSearchParams<{ articleId?: string }>();
  const runtime = useRuntimeFixture();

  if (runtime.status !== "ready") {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 10 }}>
        <Text selectable style={{ color: "#11181c", fontSize: 22, fontWeight: "700" }}>
          Article unavailable
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 15 }}>
          Runtime data state is {runtime.status}.
        </Text>
      </ScrollView>
    );
  }

  const article = runtime.articles.find((item) => item.articleId === articleId);
  const detail = articleId ? runtime.detailsByArticleId[articleId] : undefined;

  if (!article || !detail) {
    return (
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 10 }}>
        <Text selectable style={{ color: "#11181c", fontSize: 22, fontWeight: "700" }}>
          Missing article
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 15 }}>
          The selected fixture does not expose a readable detail response for {articleId || "unknown"}.
        </Text>
      </ScrollView>
    );
  }

  const body = detail.markdownBody || detail.unavailableReason || "No markdown_body is available in this fixture response.";
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ padding: 18, gap: 18 }}>
      <Stack.Screen options={{ title: article.publicationName || article.publicationKey || "Article" }} />

      <View style={{ gap: 6 }}>
        <Text selectable style={{ color: "#51606a", fontSize: 12, fontWeight: "700" }}>
          product_key {runtime.metadata.productKey}
        </Text>
        <Text selectable style={{ color: "#11181c", fontSize: 24, lineHeight: 30, fontWeight: "800" }}>
          {detail.title || article.title}
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 14 }}>
          {article.publicationName || article.publicationKey || "Unknown publication"} · scenario {runtime.metadata.scenarioId}
        </Text>
      </View>

      <View
        style={{
          borderRadius: 8,
          borderWidth: 1,
          borderColor: detail.unavailableReason ? "#e1b7a6" : "#d6e1e6",
          padding: 12,
          gap: 4,
          backgroundColor: detail.unavailableReason ? "#fff7f3" : "#f8fbfc"
        }}
      >
        <Text selectable style={{ color: "#51606a", fontSize: 12, fontWeight: "700" }}>
          {detail.audienceSegment}/{detail.readingMode} · revision {detail.revision}
        </Text>
        <Text selectable style={{ color: "#51606a", fontSize: 12 }}>
          {detail.unavailableReason ? `unavailable: ${detail.unavailableReason}` : "fixture markdown_body"}
        </Text>
      </View>

      <View style={{ gap: 12 }}>
        {paragraphs.map((paragraph, index) => (
          <Text selectable key={`${detail.detailKey}-${index}`} style={{ color: "#182126", fontSize: 17, lineHeight: 27 }}>
            {paragraph}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}
