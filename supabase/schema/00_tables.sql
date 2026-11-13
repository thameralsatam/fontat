-- Snapshot of public schema tables (exported 2026-11-13 from the live project).
-- RLS is enabled on every table (not forced).

create table public.font_assets (
  id           uuid primary key default gen_random_uuid(),
  hash         text not null unique,
  storage_path text not null,
  download_url text not null,
  size         bigint not null,
  created_at   timestamptz default now()
);

create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz default now()
);

create table public.fonts (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  group_id   uuid references public.groups(id) on delete cascade,   -- NULL = public font
  asset_id   uuid not null references public.font_assets(id) on delete cascade,
  name       text not null,
  metadata   jsonb default '{}'::jsonb,                              -- tags[], note, is_weight
  created_at timestamptz default now(),
  constraint fonts_note_length_check check (
    metadata is null or not (metadata ? 'note') or length(metadata ->> 'note') <= 100)
);
create unique index fonts_prevent_duplicate_in_group_idx
  on public.fonts (user_id, group_id, asset_id) where group_id is not null;
create unique index fonts_prevent_duplicate_in_public_idx
  on public.fonts (user_id, asset_id) where group_id is null;

create table public.font_weights (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  parent_font_id uuid not null references public.fonts(id) on delete cascade,
  child_font_id  uuid not null references public.fonts(id) on delete cascade,
  created_at     timestamptz default now(),
  constraint font_weights_check check (parent_font_id <> child_font_id),
  unique (user_id, parent_font_id, child_font_id)
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,       -- NULL = global announcement
  type       text not null,
  slides     jsonb not null default '[]'::jsonb,
  created_at timestamptz default now(),
  constraint notifications_type_check check (type = any (array['update','alert','info','promotion']))
);

alter table public.font_assets  enable row level security;
alter table public.groups       enable row level security;
alter table public.fonts        enable row level security;
alter table public.font_weights enable row level security;
alter table public.notifications enable row level security;

-- Realtime: published tables at export time
-- alter publication supabase_realtime add table groups, font_assets, fonts, font_weights;
