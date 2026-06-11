-- Magazine Digest Supabase runtime RLS draft.
-- Draft only: do not apply as a migration and do not connect to a real project.
-- RLS intent: fail closed, public published content reads, owner-only private state,
-- explicit product_key scoping, and service-owned writes outside the mobile client.

alter table runtime.products enable row level security;
alter table runtime.publications enable row level security;
alter table runtime.articles enable row level security;
alter table runtime.article_variants enable row level security;
alter table runtime.content_change_log enable row level security;
alter table runtime.user_content_state enable row level security;
alter table runtime.user_follows enable row level security;
alter table runtime.notification_inbox enable row level security;
alter table runtime.entitlement_snapshot enable row level security;
alter table runtime.runtime_sync_cursors enable row level security;

-- Public/product content reads.
create policy "runtime products active read"
  on runtime.products
  for select
  to anon, authenticated
  using (status = 'active');

create policy "runtime publications active read"
  on runtime.publications
  for select
  to anon, authenticated
  using (status = 'active');

create policy "runtime articles published read"
  on runtime.articles
  for select
  to anon, authenticated
  using (status = 'published');

create policy "runtime article variants published read"
  on runtime.article_variants
  for select
  to anon, authenticated
  using (
    publish_status = 'published'
    and is_deleted = false
    and publish_at <= now()
    and (available_from is null or available_from <= now())
    and (available_until is null or available_until > now())
  );

create policy "runtime content change log read"
  on runtime.content_change_log
  for select
  to anon, authenticated
  using (
    change_type in ('upsert', 'unpublish', 'tombstone', 'delete_projection')
  );

-- Owner-only private reads.
create policy "runtime user content state owner read"
  on runtime.user_content_state
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "runtime user follows owner read"
  on runtime.user_follows
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "runtime notification inbox owner read"
  on runtime.notification_inbox
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "runtime entitlement snapshot owner read"
  on runtime.entitlement_snapshot
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "runtime sync cursors owner read"
  on runtime.runtime_sync_cursors
  for select
  to authenticated
  using (user_id = auth.uid());

-- Limited future owner writes for runtime state. Content, entitlement snapshots,
-- and notification creation intentionally have no client insert/update/delete policy.
create policy "runtime user content state owner insert"
  on runtime.user_content_state
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "runtime user content state owner update"
  on runtime.user_content_state
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "runtime user follows owner insert"
  on runtime.user_follows
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "runtime user follows owner update"
  on runtime.user_follows
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "runtime user follows owner delete"
  on runtime.user_follows
  for delete
  to authenticated
  using (user_id = auth.uid());

create policy "runtime notification inbox owner read-state update"
  on runtime.notification_inbox
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and status in ('unread', 'read', 'archived')
  );

create policy "runtime sync cursors owner insert"
  on runtime.runtime_sync_cursors
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "runtime sync cursors owner update"
  on runtime.runtime_sync_cursors
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
