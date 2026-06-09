# Stage DATA1B Publish Flow

1. 运行 `import-content-batch.mjs`
2. importer 解析 zip 或 raw dir
3. 产出 normalized issue/article records
4. 写 publication / issue / scenario 注册表
5. 若传入 publish/select 参数，则把具名 scenario 发布到 `current`
6. `current` 写入 selected scenario 镜像与 scenario meta

## Important Rule

- 不直接手改 `mobile/fixtures/runtime/current/*`
- 修改 scenario bundle 或 registry，再通过 publish 步骤镜像到 current
