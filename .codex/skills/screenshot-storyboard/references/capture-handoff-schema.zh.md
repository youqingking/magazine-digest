# Capture Handoff Schema

`screenshot-storyboard` 生成的 shot-list 是 `screenshot-capture-agent` 的输入。

## screenshot-shot-list.json

```json
{
  "schema_version": "screenshot_shot_list.v1",
  "generated_at": "ISO-8601",
  "produced_by": "screenshot-storyboard",
  "shots": [
    {
      "shot_id": "shot_01_home_feed",
      "route": "pages/feed/index",
      "route_path": "pages/feed/index",
      "route_params": {},
      "scenario": "首页内容流展示中文摘要",
      "title": "首页",
      "claim_ids": ["listing_claim_digest_detail"],
      "fixture_source": ["mobile/fixtures/runtime/current/runtime.bundle.json:discoveryCatalog.items"],
      "must_not_show": ["开发态", "Feed 诊断"],
      "human_review_required": true,
      "review_status": "NEED_HUMAN"
    }
  ]
}
```

## screenshot-capture-handoff.json

包含推荐命令、capture 前置条件、阻塞项和与 capture skill 对齐的 shot-list 路径。

```powershell
python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-list play-store-launch/reports/screenshot-shot-list.json
```

capture skill 可以读取 `route` 和 `scenario`；其他字段供人工导航、设计和审核使用。
