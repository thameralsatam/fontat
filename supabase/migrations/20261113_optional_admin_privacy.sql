-- =====================================================================
-- OPTIONAL – needs a decision. NOT applied.
-- "Admin cannot read other users' private fonts and groups."
--
-- Today the admin role bypasses ownership on private data: read_fonts, read_groups, read_weights,
-- read_assets, the storage select policy, get_my_fonts (an admin's "my fonts" lists EVERY user's fonts),
-- manage_font_smart (admin can edit/delete any user's font) and the upload RPCs.
--
-- Trade-off: after this change nobody can moderate a user's private group (e.g. a takedown request would
-- have to be handled by deleting the whole account). Public fonts stay fully manageable by the admin.
--
-- Note: files are in a PUBLIC bucket, so anyone holding a file URL can still download it. Only moving private
-- fonts to a private bucket with signed URLs (planned for later) changes that.
-- =====================================================================

drop policy if exists read_fonts on public.fonts;
create policy read_fonts on public.fonts for select to public using (group_id is null or user_id = auth.uid());

drop policy if exists read_groups on public.groups;
create policy read_groups on public.groups for select to public using (user_id = auth.uid());

drop policy if exists read_weights on public.font_weights;
create policy read_weights on public.font_weights for select to public using (user_id = auth.uid());

drop policy if exists read_assets on public.font_assets;
create policy read_assets on public.font_assets for select to public using (
  exists (select 1 from public.fonts f where f.asset_id = font_assets.id
          and (f.group_id is null or f.user_id = auth.uid())));

drop policy if exists fonts_select_linked_to_fonts_table on storage.objects;
create policy fonts_select_linked_to_fonts_table on storage.objects for select to public using (
  bucket_id = 'fonts' and exists (
    select 1 from public.fonts f join public.font_assets fa on fa.id = f.asset_id
    where fa.storage_path = objects.name and (f.group_id is null or f.user_id = auth.uid())));

-- get_my_fonts: own fonts only (the admin sees public fonts through get_public_fonts)
create or replace function public.get_my_fonts(p_group_id uuid default null, p_sort text default 'oldest', p_limit integer default 15, p_offset integer default 0)
returns table(font_id uuid, group_id uuid, asset_id uuid, name text, metadata jsonb, download_url text, size bigint, created_at timestamptz, font_hash text, total_count bigint)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  return query
  select f.id, f.group_id, f.asset_id, f.name, f.metadata, a.download_url, a.size, f.created_at, a.hash,
         count(*) over() as total_count
  from public.fonts f
  join public.font_assets a on a.id = f.asset_id
  where f.user_id = auth.uid()
    and (p_group_id is null or f.group_id = p_group_id)
    and not exists (select 1 from public.font_weights fw where fw.child_font_id = f.id)
  order by
    case when p_sort = 'oldest'   then f.created_at end asc,
    case when p_sort = 'newest'   then f.created_at end desc,
    case when p_sort = 'name_asc' then f.name end asc,
    f.id
  limit p_limit offset p_offset;
end $$;
-- Also to do in the same step if approved: in manage_font_smart / prepare_font_upload / save_new_font /
-- add_weight_directly replace "or public.is_admin()" by "or (public.is_admin() and <font is public>)".
