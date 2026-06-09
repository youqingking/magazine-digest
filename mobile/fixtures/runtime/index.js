const runtimeFixtures = {
  "metadata": {
    "exported_at": "2026-03-17T08:23:29.029Z",
    "runtime_mode": "local_fixture_backed",
    "canonical_source": "backend/* + fixtures/db/seed/* + docs/Stage B/Stage D contracts",
    "product_key": "demo_cn_content"
  },
  "surfaceStatus": [
    {
      "surface": "bootstrap-config",
      "status": "implemented_now"
    },
    {
      "surface": "content-sync-delta",
      "status": "implemented_now"
    },
    {
      "surface": "content-detail",
      "status": "implemented_now"
    },
    {
      "surface": "entitlement-snapshot",
      "status": "implemented_now"
    },
    {
      "surface": "pricing-preview",
      "status": "implemented_now"
    },
    {
      "surface": "experiment-assign",
      "status": "implemented_now"
    },
    {
      "surface": "event-ingest",
      "status": "implemented_now"
    },
    {
      "surface": "billing.createOrder",
      "status": "future_stage"
    },
    {
      "surface": "billing.confirmOrder",
      "status": "future_stage"
    },
    {
      "surface": "billing.handleWebhook",
      "status": "future_stage"
    },
    {
      "surface": "promo.redeem",
      "status": "stub_only"
    },
    {
      "surface": "growth.bindReferral",
      "status": "stub_only"
    },
    {
      "surface": "growth.grantReward",
      "status": "stub_only"
    }
  ],
  "bootstrapConfig": {
    "response": {
      "product_key": "demo_cn_content",
      "config_source": "local_fixture_backed",
      "timezone": "Asia/Shanghai",
      "money_unit": "fen",
      "discount_canonical": "price_multiplier_basis_points",
      "reward_canonical": "vip_days",
      "product": {
        "product_id": "prod_demo_cn_content",
        "display_name": "Demo CN Content",
        "default_language": "zh-CN",
        "active_status": "active"
      },
      "feature_flags": [],
      "experiments": [
        {
          "experiment_id": "exp_paywall_layout_v1",
          "experiment_key": "paywall_layout_v1",
          "assignment_unit": "installation_id",
          "assignment_version": 1,
          "status": "running"
        }
      ]
    }
  },
  "contentSyncDelta": {
    "response": {
      "server_cursor": "2026-03-16T09:10:00+08:00|var_nebula_teen_quick_r1",
      "has_more": false,
      "items": [
        {
          "entity_type": "article",
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "publication_id": "pub_daily_brief",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation.",
          "status": "active",
          "updated_at": "2026-03-16T09:05:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_adult_deep_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "adult",
          "reading_mode": "deep_3m",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_adult_deep_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_adult_quick_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "adult",
          "reading_mode": "quick_30s",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_adult_quick_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_general_deep_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "general",
          "reading_mode": "deep_3m",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_general_deep_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_general_quick_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "general",
          "reading_mode": "quick_30s",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_general_quick_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_teen_deep_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "teen",
          "reading_mode": "deep_3m",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_teen_deep_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        },
        {
          "entity_type": "article_variant",
          "article_variant_id": "var_nebula_teen_quick_r1",
          "article_id": "art_nebula_launch",
          "language": "zh-CN",
          "audience_segment": "teen",
          "reading_mode": "quick_30s",
          "publish_status": "published",
          "publish_at": "2026-03-16T09:10:00+08:00",
          "revision": 1,
          "content_hash": "hash_teen_quick_r1",
          "is_deleted": false,
          "updated_at": "2026-03-16T09:10:00+08:00"
        }
      ],
      "tombstones": []
    }
  },
  "contentDetail": {
    "responses": {
      "art_nebula_launch|zh-CN|general|quick_30s": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_general_quick_r1",
          "audience_segment": "general",
          "reading_mode": "quick_30s",
          "revision": 1,
          "title": "Nebula Launch General Quick",
          "markdown_body": "General quick fallback version.",
          "content_hash": "hash_general_quick_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_nebula_launch|zh-CN|general|deep_3m": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_general_deep_r1",
          "audience_segment": "general",
          "reading_mode": "deep_3m",
          "revision": 1,
          "title": "Nebula Launch General Deep",
          "markdown_body": "General deep fallback version.",
          "content_hash": "hash_general_deep_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_nebula_launch|zh-CN|teen|quick_30s": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_teen_quick_r1",
          "audience_segment": "teen",
          "reading_mode": "quick_30s",
          "revision": 1,
          "title": "Nebula Launch Teen Quick",
          "markdown_body": "Teen quick version.",
          "content_hash": "hash_teen_quick_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_nebula_launch|zh-CN|teen|deep_3m": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_teen_deep_r1",
          "audience_segment": "teen",
          "reading_mode": "deep_3m",
          "revision": 1,
          "title": "Nebula Launch Teen Deep",
          "markdown_body": "Teen deep version.",
          "content_hash": "hash_teen_deep_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_nebula_launch|zh-CN|adult|quick_30s": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_adult_quick_r1",
          "audience_segment": "adult",
          "reading_mode": "quick_30s",
          "revision": 1,
          "title": "Nebula Launch Adult Quick",
          "markdown_body": "Adult quick version.",
          "content_hash": "hash_adult_quick_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_nebula_launch|zh-CN|adult|deep_3m": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": {
          "article_variant_id": "var_nebula_adult_deep_r1",
          "audience_segment": "adult",
          "reading_mode": "deep_3m",
          "revision": 1,
          "title": "Nebula Launch Adult Deep",
          "markdown_body": "Adult deep version.",
          "content_hash": "hash_adult_deep_r1"
        },
        "selection_reason": "exact_match",
        "fallback_applied": false,
        "unavailable_reason": null
      },
      "art_fixture_unavailable|zh-CN|teen|quick_30s": {
        "article": {
          "article_id": "art_nebula_launch",
          "article_key": "nebula_launch_20260316",
          "title": "Nebula Launch Overview",
          "summary": "A stable sample article root for contract validation."
        },
        "resolved_variant": null,
        "selection_reason": null,
        "fallback_applied": false,
        "unavailable_reason": "CONTENT_UNAVAILABLE_SAFE_FALLBACK_MISSING"
      }
    }
  },
  "entitlementSnapshot": {
    "response": {
      "product_key": "demo_cn_content",
      "subject_id": "inst_mobile_export",
      "access_state": "denied",
      "decision_source": "local_runtime_stub",
      "quota_remaining": 0,
      "entitlement_snapshot": null,
      "denial_reason": "LOCAL_RUNTIME_NO_BILLING_FACTS"
    }
  },
  "pricingPreview": {
    "responses": [
      {
        "product_key": "demo_cn_content",
        "pricing_plan_id": "plan_demo_monthly",
        "original_amount_fen": 3000,
        "final_amount_fen": 3000,
        "price_floor_fen": 900,
        "applied_price_multiplier_basis_points": 10000,
        "floor_applied": false,
        "campaign_id": null,
        "denial_reason": null
      },
      {
        "product_key": "demo_cn_content",
        "pricing_plan_id": "plan_demo_monthly",
        "original_amount_fen": 3000,
        "final_amount_fen": 900,
        "price_floor_fen": 900,
        "applied_price_multiplier_basis_points": 3000,
        "floor_applied": false,
        "campaign_id": "camp_internal_beta_30off",
        "denial_reason": null
      },
      {
        "product_key": "demo_cn_content",
        "pricing_plan_id": "plan_demo_annual",
        "original_amount_fen": 28800,
        "final_amount_fen": 28800,
        "price_floor_fen": 8640,
        "applied_price_multiplier_basis_points": 10000,
        "floor_applied": false,
        "campaign_id": null,
        "denial_reason": null
      },
      {
        "product_key": "demo_cn_content",
        "pricing_plan_id": "plan_demo_annual",
        "original_amount_fen": 28800,
        "final_amount_fen": 8640,
        "price_floor_fen": 8640,
        "applied_price_multiplier_basis_points": 3000,
        "floor_applied": false,
        "campaign_id": "camp_internal_beta_30off",
        "denial_reason": null
      }
    ]
  },
  "experimentAssign": {
    "response": {
      "product_key": "demo_cn_content",
      "installation_id": "inst_mobile_export",
      "experiment_id": "exp_paywall_layout_v1",
      "experiment_key": "paywall_layout_v1",
      "assignment_version": 1,
      "bucket_key": "A",
      "assignment_source": "local_fixture_backed",
      "cache_ttl_seconds": 3600
    }
  }
};

export default runtimeFixtures;
