-- RLS policies (public schema) and storage policies, exported 2026-11-13.

create policy read_assets on public.font_assets for select to public using (
  exists (select 1 from fonts f where f.asset_id = font_assets.id
          and (f.group_id is null or f.user_id = auth.uid() or is_admin())));

create policy read_weights on public.font_weights for select to public using (
  user_id = auth.uid() or is_admin());

create policy read_fonts on public.fonts for select to public using (
  group_id is null or user_id = auth.uid() or is_admin());

create policy read_groups on public.groups for select to public using (
  user_id = auth.uid() or is_admin());

create policy admin_manage_notifications on public.notifications for all to public using (is_admin());
create policy read_notifications on public.notifications for select to public using (
  user_id is null or user_id = auth.uid() or is_admin());
create policy update_my_notifications on public.notifications for update to public using (auth.uid() = user_id);

-- storage.objects
create policy "Storage_Admin_Master" on storage.objects for all to authenticated using (is_admin());
create policy fonts_admin_delete on storage.objects for delete to authenticated using (bucket_id = 'fonts' and is_admin());
create policy fonts_admin_update on storage.objects for update to authenticated using (bucket_id = 'fonts' and is_admin());
create policy fonts_insert_authenticated on storage.objects for insert to authenticated with check (bucket_id = 'fonts');
create policy fonts_select_linked_to_fonts_table on storage.objects for select to public using (
  bucket_id = 'fonts' and exists (
    select 1 from fonts f join font_assets fa on fa.id = f.asset_id
    where fa.storage_path = objects.name and (f.group_id is null or f.user_id = auth.uid() or is_admin())));
create policy notifications_admin_delete on storage.objects for delete to public using (bucket_id = 'notifications' and is_admin());
create policy notifications_admin_insert on storage.objects for insert to public with check (bucket_id = 'notifications' and is_admin());
create policy notifications_admin_update on storage.objects for update to public using (bucket_id = 'notifications' and is_admin());
create policy notifications_public_select on storage.objects for select to public using (bucket_id = 'notifications');

-- Buckets (settings at export time)
-- fonts:         public=true, file_size_limit=6291456 (6 MB), allowed_mime_types={font/otf,font/ttf,font/woff,font/woff2,application/octet-stream}
-- notifications: public=true, no limit
