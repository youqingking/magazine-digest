# apps/mobile

Expo-first mobile runtime shell for Magazine Digest.

This shell reads generated runtime fixtures and renders:

- discovery at `/`
- article detail at `/article/[articleId]`
- scenario and service seam status at `/debug`

It does not connect to Supabase, RevenueCat, push services, production config, or the external content production pipeline.

See:

- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/mobile/RUNTIME_FIXTURE_READER.md`
