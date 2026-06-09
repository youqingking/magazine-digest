# Discovery Runtime

- Discovery home reads local synthetic bundle data plus mutable user follow / content-state overlays.
- Search uses local text match and request-scoped filters only.
- Follow catalog is limited to publication and topic-tag entities already present in the synthetic pack.
- Active follows are user-local persisted overlays, not runtime fixture defaults; importing or publishing more刊物 must not silently make them all “已关注”.
- Home `followed_updates`, inbox publish-batch updates, and synthetic release summaries must all scope to the user’s active follow set.
- Continue reading and save-for-later are projected from `user_content_state` local-first state.
- Publish batch summary is a read model over `publish_batches`, discovery catalog items, follows, and inbox rows.
