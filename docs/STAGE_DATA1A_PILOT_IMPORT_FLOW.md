# Stage DATA1A Pilot Import Flow

1. 读取 `Reader's Digest-12112025.zip`
2. 解压到 `output/stage-data1a-pilot/extracted/`
3. 识别 15 篇单篇 md 与 1 个 `_adult.md`
4. 解析单篇 md 的 6 个固定标签
5. 用 `_adult.md` 目录表补 `section_label / start_page`
6. 生成：
   - `data/real-content/readers-digest/12112025/raw/*`
   - `data/real-content/readers-digest/12112025/normalized/article-001.json ...`
   - `data/real-content/readers-digest/12112025/manifest.json`
   - `output/stage-data1a-pilot/manifest.json`
   - `output/stage-data1a-pilot/parse-report.json`
   - `output/stage-data1a-pilot/normalized-catalog.json`
7. 基于 normalized records 生成 `real_content_pilot` runtime bundle
8. 写入：
   - `mobile/fixtures/runtime/scenarios/data1a_readers_digest_12112025.bundle.json`
   - `mobile/fixtures/runtime/current/runtime.bundle.json`

## Run

- `node scripts/import/import-readers-digest-pilot.mjs`

## Roll-Forward Behavior

- 重跑脚本会覆盖本 issue 的 raw/normalized/output/current runtime 产物
- 不修改 schema / backend contract
