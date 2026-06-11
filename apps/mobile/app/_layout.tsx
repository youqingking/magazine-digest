import { Stack } from "expo-router/stack";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: true,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal"
      }}
    >
      <Stack.Screen name="index" options={{ title: "Discovery" }} />
      <Stack.Screen name="article/[articleId]" options={{ title: "Article", headerLargeTitle: false }} />
      <Stack.Screen name="debug" options={{ title: "Scenario", presentation: "modal" }} />
    </Stack>
  );
}
