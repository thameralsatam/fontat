-- Look up ONE public font by the short code used in its URL (/fonts/<name>-<code>).
-- The code is the first 8 hex characters of the font id. Read-only; public fonts only (group_id IS NULL).
create or replace function public.get_public_font_by_code(p_code text)
returns table(font_id uuid, font_name text, download_url text, size bigint, tags jsonb, metadata jsonb, created_at timestamptz)
language plpgsql stable security definer set search_path to 'public' as $$
begin
  if p_code is null or p_code !~ '^[0-9a-f]{8}$' then return; end if;
  return query
  select f.id, f.name, fa.download_url, fa.size, f.metadata -> 'tags', f.metadata, f.created_at
  from public.fonts f
  join public.font_assets fa on fa.id = f.asset_id
  where f.group_id is null and left(f.id::text, 8) = p_code
  order by f.created_at
  limit 1;
end $$;

revoke execute on function public.get_public_font_by_code(text) from public, anon, authenticated;
grant execute on function public.get_public_font_by_code(text) to anon, authenticated;
