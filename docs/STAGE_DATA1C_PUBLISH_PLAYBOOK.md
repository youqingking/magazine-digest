# Stage DATA1C Publish Playbook

1. 运行 `import-content-pack.mjs --zip <Three-release.zip>`
2. 检查 `output/stage-data1c/pack-report.json`
3. 检查 registry 与 scenario 产物
4. 若只需生成 preview，不传 publish 参数
5. 若要切到某个 scenario，显式传 `--publish-scenario <scenario_id>`
6. 若要回退，显式重新发布 `data1a_readers_digest_12112025`

## Safety Rule

- `data1c_three_release_mixed_preview` 不自动发布
- `current` 只能由显式 publish 行为改变
