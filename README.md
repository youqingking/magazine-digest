# Magazine Digest

Magazine Digest is an Expo-first migration workspace for efficient magazine reading and digest-style content consumption.

## Scope

- Mobile shell target: Expo, React Native, TypeScript, Expo Router, EAS.
- Backend target: Supabase.
- Subscriptions target: RevenueCat.
- Notifications target: `expo-notifications` / Expo Push, with an FCM/APNs seam reserved.

## Repository Boundary

This repository consumes standardized content packages and runtime metadata produced by an external pipeline. It does not implement external content ingestion, PDF parsing, web scraping, prompt generation, markdown generation, or content pipeline scheduling.

Legacy DCloud / uni-app / uniCloud surfaces remain as migration references. Future implementation should land under `apps/mobile`, `packages/core-*`, and `infra/supabase`.
