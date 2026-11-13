-- =====================================================================
-- Fontat – security hardening (PROPOSED – review before applying)
-- Status: NOT applied to the live project.
--
-- What it fixes (numbers refer to docs "fontat-audit-2026-11-11"):
--   #12/#14  manage_font_smart replaced the whole metadata → now MERGES, whitelists keys (tags, note) and validates them
--   #13      font_assets URL hijack: the server no longer trusts download_url/size/storage_path from the browser
--   #15      anyone could upload unlimited / arbitrary files to the fonts bucket → name format + per-user object cap
--   #16      trigger functions & user RPCs were callable by anyone via the REST API → EXECUTE locked down
--   #17      groups: length limits, max 20 groups per user, create returns the new id
--   #18      users could rewrite their own notifications → UPDATE policy removed (the app never updates)
--   #20      missing foreign-key indexes
--   +        weights: nested/self weights are rejected, existing font rows linked as weights get is_weight
--   +        removes the broken trigger on_font_asset_deleted (it calls storage.delete_object(), which does not exist)
--   +        realtime: stop publishing fonts / font_assets / font_weights (only `groups` is used by the app)
--
-- Client compatibility: the current client keeps working (it already sends complete tags/note values).
-- Part C (admin access to other users' private data) is in a separate file and needs your decision.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Validation helpers (private: not callable through the API)
-- ---------------------------------------------------------------------
create or replace function public._clean_font_name(p_name text)
returns text language plpgsql immutable set search_path = public as $$
declare v text := btrim(regexp_replace(coalesce(p_name, ''), '[[:cntrl:]]', '', 'g'));
begin
  if char_length(v) not between 1 and 255 then raise exception 'invalid_name'; end if;
  return v;
end $$;

-- Keeps only whitelisted keys (tags[], note) and validates them.
create or replace function public._clean_font_metadata(p_metadata jsonb)
returns jsonb language plpgsql immutable set search_path = public as $$
declare v jsonb := '{}'::jsonb; v_tags jsonb; v_note text;
begin
  if p_metadata is null or jsonb_typeof(p_metadata) <> 'object' then return v; end if;

  if p_metadata ? 'tags' and jsonb_typeof(p_metadata -> 'tags') <> 'null' then
    v_tags := p_metadata -> 'tags';
    if jsonb_typeof(v_tags) <> 'array'
       or jsonb_array_length(v_tags) > 20
       or exists (select 1 from jsonb_array_elements(v_tags) e
                  where jsonb_typeof(e) <> 'string' or char_length(btrim(e #>> '{}')) not between 1 and 40) then
      raise exception 'invalid_tags';
    end if;
    v := v || jsonb_build_object('tags', v_tags);
  end if;

  if p_metadata ? 'note' and jsonb_typeof(p_metadata -> 'note') <> 'null' then
    if jsonb_typeof(p_metadata -> 'note') <> 'string' then raise exception 'invalid_note'; end if;
    v_note := btrim(p_metadata ->> 'note');
    if char_length(v_note) > 100 then raise exception 'invalid_note'; end if;
    if v_note <> '' then v := v || jsonb_build_object('note', v_note); end if;
  end if;

  return v;
end $$;

-- Registers (or reuses) the asset for an uploaded file. The URL and size are derived on the server.
create or replace function public._register_asset(p_hash text, p_storage_path text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_size bigint; v_owner uuid;
begin
  if p_hash !~ '^[0-9a-f]{64}$'
     or p_storage_path !~ '^[0-9a-f]{64}\.(ttf|otf|woff|woff2)$'
     or split_part(p_storage_path, '.', 1) <> p_hash then
    raise exception 'invalid_file_reference';
  end if;

  select id into v_id from public.font_assets where hash = p_hash;
  if v_id is not null then return v_id; end if;          -- never modify an existing asset

  select (o.metadata ->> 'size')::bigint, o.owner into v_size, v_owner
  from storage.objects o where o.bucket_id = 'fonts' and o.name = p_storage_path;
  if v_size is null then raise exception 'file_not_uploaded'; end if;
  if v_owner is distinct from auth.uid() and not public.is_admin() then raise exception 'file_not_owned'; end if;

  insert into public.font_assets (hash, storage_path, download_url, size)
  values (p_hash, p_storage_path,
          'https://njbgonhxwbofxujvjycn.supabase.co/storage/v1/object/public/fonts/' || p_storage_path,
          v_size)
  on conflict (hash) do nothing
  returning id into v_id;

  if v_id is null then select id into v_id from public.font_assets where hash = p_hash; end if;
  return v_id;
end $$;

-- ---------------------------------------------------------------------
-- 2. Upload RPCs (same signatures; extra arguments are accepted but no longer trusted)
-- ---------------------------------------------------------------------
create or replace function public.prepare_font_upload(p_name text, p_hash text, p_group_id uuid, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_owner uuid; v_asset_id uuid; v_font_id uuid; v_name text; v_meta jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  if p_hash !~ '^[0-9a-f]{64}$' then return jsonb_build_object('success', false, 'message', 'invalid_hash'); end if;
  v_name := public._clean_font_name(p_name);
  v_meta := public._clean_font_metadata(p_metadata);

  if p_group_id is not null then
    v_owner := (select user_id from public.groups where id = p_group_id);
    if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;
    if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;
    if not public.is_admin() and (select count(*) from public.fonts where user_id = v_owner) >= 50 then
      return jsonb_build_object('success', false, 'message', 'font_limit_reached');
    end if;
  else
    if not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden_public_upload'); end if;
  end if;

  v_asset_id := (select id from public.font_assets where hash = p_hash);
  if v_asset_id is null then return jsonb_build_object('success', true, 'needs_upload', true); end if;

  v_font_id := (select id from public.fonts
                where user_id = auth.uid() and asset_id = v_asset_id
                  and (group_id = p_group_id or (group_id is null and p_group_id is null)));
  if v_font_id is not null then
    return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', true, 'font_id', v_font_id);
  end if;

  insert into public.fonts (user_id, group_id, asset_id, name, metadata)
  values (auth.uid(), p_group_id, v_asset_id, v_name, v_meta) returning id into v_font_id;
  return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', false, 'linked', true, 'font_id', v_font_id);
end $$;

create or replace function public.save_new_font(p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_group_id uuid, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_owner uuid; v_asset_id uuid; v_font_id uuid; v_name text; v_meta jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  v_name := public._clean_font_name(p_name);
  v_meta := public._clean_font_metadata(p_metadata);

  if p_group_id is not null then
    v_owner := (select user_id from public.groups where id = p_group_id);
    if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;
    if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;
    if not public.is_admin() and (select count(*) from public.fonts where user_id = v_owner) >= 50 then
      return jsonb_build_object('success', false, 'message', 'font_limit_reached');
    end if;
  else
    if not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden_public_upload'); end if;
  end if;

  v_asset_id := public._register_asset(p_hash, p_storage_path);

  v_font_id := (select id from public.fonts
                where user_id = auth.uid() and asset_id = v_asset_id
                  and ((group_id is null and p_group_id is null) or group_id = p_group_id)
                limit 1);
  if v_font_id is not null then
    return jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_font_id);
  end if;

  insert into public.fonts (user_id, group_id, asset_id, name, metadata)
  values (auth.uid(), p_group_id, v_asset_id, v_name, v_meta) returning id into v_font_id;
  return jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_font_id);
end $$;

create or replace function public.add_weight_directly(p_parent_font_id uuid, p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_metadata jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare
  v_parent_owner uuid; v_parent_group_id uuid;
  v_asset_id uuid; v_weight_font_id uuid; v_name text; v_meta jsonb;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  v_name := public._clean_font_name(p_name);
  v_meta := public._clean_font_metadata(p_metadata);

  select user_id, group_id into v_parent_owner, v_parent_group_id from public.fonts where id = p_parent_font_id;
  if v_parent_owner is null then return jsonb_build_object('success', false, 'message', 'parent_font_not_found'); end if;

  -- a weight cannot itself carry weights
  if exists (select 1 from public.font_weights where child_font_id = p_parent_font_id) then
    return jsonb_build_object('success', false, 'message', 'parent_is_already_a_weight');
  end if;

  if v_parent_group_id is null then
    if not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden_public_weight'); end if;
  else
    if v_parent_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;
    if not public.is_admin() and (select count(*) from public.fonts where user_id = v_parent_owner) >= 50 then
      return jsonb_build_object('success', false, 'message', 'font_limit_reached');
    end if;
  end if;

  v_asset_id := public._register_asset(p_hash, p_storage_path);

  v_weight_font_id := (select id from public.fonts
                       where user_id = v_parent_owner and asset_id = v_asset_id
                         and ((group_id is null and v_parent_group_id is null) or group_id = v_parent_group_id)
                       limit 1);

  if v_weight_font_id is not null then
    if v_weight_font_id = p_parent_font_id then
      return jsonb_build_object('success', false, 'message', 'same_as_parent');
    end if;
    if exists (select 1 from public.font_weights where parent_font_id = v_weight_font_id) then
      return jsonb_build_object('success', false, 'message', 'font_has_weights');
    end if;
    update public.fonts set metadata = coalesce(metadata, '{}'::jsonb) || '{"is_weight": true}'::jsonb
    where id = v_weight_font_id;
    insert into public.font_weights (user_id, parent_font_id, child_font_id)
    values (v_parent_owner, p_parent_font_id, v_weight_font_id) on conflict do nothing;
    return jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_weight_font_id);
  end if;

  insert into public.fonts (user_id, group_id, asset_id, name, metadata)
  values (v_parent_owner, v_parent_group_id, v_asset_id, v_name, v_meta || '{"is_weight": true}'::jsonb)
  returning id into v_weight_font_id;

  insert into public.font_weights (user_id, parent_font_id, child_font_id)
  values (v_parent_owner, p_parent_font_id, v_weight_font_id);

  return jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_weight_font_id);
end $$;

-- ---------------------------------------------------------------------
-- 3. manage_font_smart: merge + whitelist (null / '' removes a key; absent keys are untouched;
--    other keys such as is_weight can never be changed from the client)
-- ---------------------------------------------------------------------
create or replace function public.manage_font_smart(p_action text, p_font_id uuid, p_name text default null, p_metadata jsonb default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_owner uuid; v_meta jsonb; v_clean jsonb; v_name text;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;

  select user_id, coalesce(metadata, '{}'::jsonb) into v_owner, v_meta from public.fonts where id = p_font_id;
  if v_owner is null then return jsonb_build_object('success', false, 'message', 'font_not_found'); end if;
  if not (v_owner = auth.uid() or public.is_admin()) then raise exception 'forbidden'; end if;

  if p_action = 'delete' then
    delete from public.fonts where id = p_font_id;
    if not found then return jsonb_build_object('success', false, 'message', 'font_not_found'); end if;
    return jsonb_build_object('success', true, 'message', 'font_deleted');

  elsif p_action = 'update' then
    if p_name is null and p_metadata is null then
      return jsonb_build_object('success', false, 'message', 'no_changes_provided');
    end if;

    if p_name is not null then v_name := public._clean_font_name(p_name); end if;

    if p_metadata is not null then
      if jsonb_typeof(p_metadata) <> 'object' then raise exception 'invalid_metadata'; end if;
      v_clean := public._clean_font_metadata(p_metadata);          -- validated tags / note

      if p_metadata ? 'tags' then
        if v_clean ? 'tags' then v_meta := v_meta || jsonb_build_object('tags', v_clean -> 'tags');
        else v_meta := v_meta - 'tags'; end if;
      end if;
      if p_metadata ? 'note' then
        if v_clean ? 'note' then v_meta := v_meta || jsonb_build_object('note', v_clean -> 'note');
        else v_meta := v_meta - 'note'; end if;
      end if;
    end if;

    update public.fonts set name = coalesce(v_name, name), metadata = v_meta where id = p_font_id;
    return jsonb_build_object('success', true, 'message', 'font_updated');
  end if;

  return jsonb_build_object('success', false, 'message', 'unknown_action');
end $$;

-- ---------------------------------------------------------------------
-- 4. manage_group_smart: limits + returns the new id
-- ---------------------------------------------------------------------
create or replace function public.manage_group_smart(p_action text, p_group_id uuid default null, p_name text default null, p_description text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $$
declare v_name text; v_desc text; v_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;

  if p_name is not null then
    v_name := btrim(regexp_replace(p_name, '[[:cntrl:]]', '', 'g'));
    if char_length(v_name) not between 1 and 25 then raise exception 'invalid_group_name'; end if;
  end if;
  if p_description is not null then
    v_desc := btrim(regexp_replace(p_description, '[[:cntrl:]]', ' ', 'g'));
    if char_length(v_desc) > 200 then raise exception 'invalid_group_description'; end if;
  end if;

  if p_action = 'create' then
    if v_name is null then raise exception 'invalid_group_name'; end if;
    if not public.is_admin() and (select count(*) from public.groups where user_id = auth.uid()) >= 20 then
      return jsonb_build_object('success', false, 'message', 'group_limit_reached');
    end if;
    insert into public.groups (user_id, name, description) values (auth.uid(), v_name, v_desc) returning id into v_id;
    return jsonb_build_object('success', true, 'message', 'Group created', 'id', v_id);

  elsif p_action = 'update' and p_group_id is not null then
    update public.groups set name = coalesce(v_name, name), description = coalesce(v_desc, description)
    where id = p_group_id and user_id = auth.uid();
    if not found then return jsonb_build_object('success', false, 'message', 'not_found_or_forbidden'); end if;
    return jsonb_build_object('success', true, 'message', 'Group updated');

  elsif p_action = 'delete' and p_group_id is not null then
    delete from public.groups where id = p_group_id and user_id = auth.uid();
    if not found then return jsonb_build_object('success', false, 'message', 'not_found_or_forbidden'); end if;
    return jsonb_build_object('success', true, 'message', 'Group deleted');
  end if;

  return jsonb_build_object('success', false, 'message', 'Action failed');
end $$;

-- ---------------------------------------------------------------------
-- 5. Table constraints (all existing rows already satisfy them)
-- ---------------------------------------------------------------------
alter table public.fonts  drop constraint if exists fonts_name_length;
alter table public.fonts  add  constraint fonts_name_length check (char_length(name) between 1 and 255);
alter table public.fonts  drop constraint if exists fonts_metadata_size;
alter table public.fonts  add  constraint fonts_metadata_size check (metadata is null or pg_column_size(metadata) <= 4096);
alter table public.groups drop constraint if exists groups_name_length;
alter table public.groups add  constraint groups_name_length check (char_length(name) between 1 and 25);
alter table public.groups drop constraint if exists groups_description_length;
alter table public.groups add  constraint groups_description_length check (description is null or char_length(description) <= 200);

-- ---------------------------------------------------------------------
-- 6. Policies
-- ---------------------------------------------------------------------
-- notifications: the app never updates them; users must not be able to rewrite them
drop policy if exists update_my_notifications on public.notifications;

-- storage: uploads must use the <sha256>.<ext> naming and a per-user cap (admin is covered by Storage_Admin_Master).
-- The count runs as SECURITY DEFINER because the SELECT policy hides not-yet-linked uploads from the user.
create or replace function public._my_font_object_count()
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::integer from storage.objects where bucket_id = 'fonts' and owner = auth.uid();
$$;

drop policy if exists fonts_insert_authenticated on storage.objects;
create policy fonts_insert_authenticated on storage.objects for insert to authenticated
with check (
  bucket_id = 'fonts'
  and name ~ '^[0-9a-f]{64}\.(ttf|otf|woff|woff2)$'
  and public._my_font_object_count() < 60
);

-- ---------------------------------------------------------------------
-- 7. Remove the broken trigger (storage.delete_object() does not exist; file deletion must go through the Storage API)
-- ---------------------------------------------------------------------
drop trigger  if exists trigger_font_asset_deleted on public.font_assets;
drop function if exists public.on_font_asset_deleted();
alter function public.on_storage_object_deleted() set search_path = public;

-- ---------------------------------------------------------------------
-- 8. EXECUTE privileges (REST API exposure)
-- ---------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;

-- readable by visitors (public catalogue, global notifications, RLS helper)
grant execute on function public.is_admin()                     to anon, authenticated;
grant execute on function public.get_public_fonts(text, integer, integer) to anon, authenticated;
grant execute on function public.smart_search(text, text)       to anon, authenticated;
grant execute on function public.get_my_weights(uuid)           to anon, authenticated;
grant execute on function public.get_parent_font_ids(uuid[])    to anon, authenticated;
grant execute on function public.get_my_notifications()         to anon, authenticated;
-- signed-in users only
grant execute on function public.get_my_fonts(uuid, text, integer, integer) to authenticated;
grant execute on function public.get_my_groups()                to authenticated;
grant execute on function public.manage_group_smart(text, uuid, text, text) to authenticated;
grant execute on function public.manage_font_smart(text, uuid, text, jsonb) to authenticated;
grant execute on function public.prepare_font_upload(text, text, uuid, jsonb) to authenticated;
grant execute on function public.save_new_font(text, text, text, text, bigint, uuid, jsonb) to authenticated;
grant execute on function public.add_weight_directly(uuid, text, text, text, text, bigint, jsonb) to authenticated;
grant execute on function public.send_notification(uuid, text, jsonb) to authenticated;   -- admin check inside
grant execute on function public._my_font_object_count()        to authenticated;   -- used by the storage insert policy
-- trigger functions and the other _helpers stay callable only by the database itself / service_role

-- ---------------------------------------------------------------------
-- 9. Realtime: the app only listens to `groups`
-- ---------------------------------------------------------------------
alter publication supabase_realtime drop table public.fonts;
alter publication supabase_realtime drop table public.font_assets;
alter publication supabase_realtime drop table public.font_weights;

-- ---------------------------------------------------------------------
-- 10. Indexes on foreign keys / filters
-- ---------------------------------------------------------------------
create index if not exists fonts_asset_id_idx          on public.fonts (asset_id);
create index if not exists fonts_group_id_idx          on public.fonts (group_id);
create index if not exists fonts_user_id_idx           on public.fonts (user_id);
create index if not exists font_weights_parent_idx     on public.font_weights (parent_font_id);
create index if not exists font_weights_child_idx      on public.font_weights (child_font_id);
create index if not exists groups_user_id_idx          on public.groups (user_id);
create index if not exists notifications_user_id_idx   on public.notifications (user_id);

-- ---------------------------------------------------------------------
-- Checks to run after applying (as anon / authenticated / admin):
--   anon:  select * from get_public_fonts();          -- works
--   anon:  select * from get_my_fonts();               -- permission denied
--   anon:  select on_storage_object_deleted();         -- permission denied
--   user:  tags edit keeps note and is_weight; deleting a note removes it; 21 tags → invalid_tags
--   user:  upload a font → prepare_font_upload → storage upload → save_new_font works; wrong extension → rejected
--   admin: upload public font + weight works; global notification send works
--   Supabase advisors (security): no more "function executable by anon" warnings for the above
-- ---------------------------------------------------------------------
