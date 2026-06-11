-- Magazine Digest Supabase runtime schema draft.
-- Draft only: do not apply as a migration and do not connect to a real project.
-- This file intentionally contains no project ids, URLs, anon keys, service secrets, or production config.

create schema if not exists runtime;

create table if not exists runtime.products (
  product_key text primary key,
  display_name text not null,
  status text not null check (status in ('active', 'paused', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists runtime.publications (
  product_key text not null references runtime.products(product_key),
  publication_key text not null,
  display_name text not null,
  description text,
  status text not null check (status in ('active', 'hidden', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, publication_key)
);

create table if not exists runtime.articles (
  product_key text not null,
  article_id text not null,
  article_key text not null,
  publication_key text not null,
  issue_key text,
  title text not null,
  summary text,
  tags jsonb not null default '[]'::jsonb,
  status text not null check (status in ('published', 'scheduled', 'unpublished', 'tombstoned', 'archived')),
  availability jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, article_id),
  foreign key (product_key, publication_key) references runtime.publications(product_key, publication_key)
);

create table if not exists runtime.article_variants (
  product_key text not null,
  article_variant_id text not null,
  article_id text not null,
  publication_key text not null,
  language text not null,
  audience_segment text not null,
  reading_mode text not null,
  title text not null,
  deck text,
  body_markdown text not null,
  premium_tier text not null,
  publish_status text not null check (publish_status in ('published', 'scheduled', 'unpublished', 'tombstoned', 'archived')),
  publish_at timestamptz not null,
  revision integer not null check (revision >= 0),
  source_kind text not null,
  content_hash text not null,
  fallback_policy text not null,
  available_from timestamptz,
  available_until timestamptz,
  is_deleted boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, article_variant_id),
  foreign key (product_key, article_id) references runtime.articles(product_key, article_id),
  foreign key (product_key, publication_key) references runtime.publications(product_key, publication_key)
);

create table if not exists runtime.content_change_log (
  product_key text not null references runtime.products(product_key),
  change_id text not null,
  entity_type text not null check (entity_type in ('publication', 'article', 'article_variant', 'tombstone')),
  entity_key text not null,
  change_type text not null check (change_type in ('upsert', 'unpublish', 'tombstone', 'delete_projection')),
  revision integer,
  changed_at timestamptz not null,
  payload jsonb not null default '{}'::jsonb,
  primary key (product_key, change_id)
);

create table if not exists runtime.user_content_state (
  product_key text not null references runtime.products(product_key),
  user_id uuid not null,
  article_id text not null,
  article_variant_id text,
  state jsonb not null default '{}'::jsonb,
  last_read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, user_id, article_id),
  foreign key (product_key, article_id) references runtime.articles(product_key, article_id)
);

create table if not exists runtime.user_follows (
  product_key text not null references runtime.products(product_key),
  user_id uuid not null,
  follow_type text not null check (follow_type in ('publication', 'topic', 'author', 'series')),
  follow_key text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, user_id, follow_type, follow_key)
);

create table if not exists runtime.notification_inbox (
  product_key text not null references runtime.products(product_key),
  notification_id text not null,
  user_id uuid not null,
  topic_key text,
  title text not null,
  body text not null,
  data jsonb not null default '{}'::jsonb,
  status text not null check (status in ('unread', 'read', 'archived')),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, notification_id)
);

create table if not exists runtime.entitlement_snapshot (
  product_key text not null references runtime.products(product_key),
  user_id uuid not null,
  snapshot_status text not null check (snapshot_status in ('unknown', 'active', 'inactive', 'grace', 'revoked')),
  entitlements jsonb not null default '{}'::jsonb,
  source text not null,
  synced_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (product_key, user_id)
);

create table if not exists runtime.runtime_sync_cursors (
  product_key text not null references runtime.products(product_key),
  user_id uuid not null,
  cursor_name text not null check (cursor_name in ('content_change_log', 'notification_inbox', 'user_content_state')),
  cursor_value text not null,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (product_key, user_id, cursor_name)
);

create index if not exists runtime_publications_product_status_idx
  on runtime.publications (product_key, status);

create index if not exists runtime_articles_product_publication_status_idx
  on runtime.articles (product_key, publication_key, status, updated_at desc);

create index if not exists runtime_article_variants_product_article_selection_idx
  on runtime.article_variants (
    product_key,
    article_id,
    language,
    audience_segment,
    reading_mode,
    publish_status,
    revision desc
  );

create index if not exists runtime_content_change_log_product_changed_idx
  on runtime.content_change_log (product_key, changed_at, change_id);

create index if not exists runtime_user_content_state_owner_updated_idx
  on runtime.user_content_state (product_key, user_id, updated_at desc);

create index if not exists runtime_user_follows_owner_idx
  on runtime.user_follows (product_key, user_id, follow_type);

create index if not exists runtime_notification_inbox_owner_status_idx
  on runtime.notification_inbox (product_key, user_id, status, created_at desc);
