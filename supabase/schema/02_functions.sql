-- Functions, exported verbatim 2026-11-13. All public RPCs are SECURITY DEFINER.
-- NOTE: at export time EXECUTE was granted to anon+authenticated on every function (Supabase default).

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  RETURN (COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin');
END;
$function$;

CREATE OR REPLACE FUNCTION public.prepare_font_upload(p_name text, p_hash text, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_owner uuid; v_asset_id uuid; v_font_id uuid; v_clean_metadata jsonb;
BEGIN
  IF auth.uid() IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'unauthorized'); END IF;

  IF p_group_id IS NOT NULL THEN
      v_owner := (SELECT user_id FROM public.groups WHERE id = p_group_id);
      IF v_owner IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'group_not_found'); END IF;
      IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RETURN jsonb_build_object('success', false, 'message', 'forbidden'); END IF;

      IF NOT public.is_admin() AND (SELECT COUNT(*) FROM public.fonts WHERE user_id = v_owner) >= 50 THEN
          RETURN jsonb_build_object('success', false, 'message', 'font_limit_reached');
      END IF;
  ELSE
      IF NOT public.is_admin() THEN RETURN jsonb_build_object('success', false, 'message', 'forbidden_public_upload'); END IF;
  END IF;

  v_clean_metadata := (p_metadata - 'is_weight');

  v_asset_id := (SELECT id FROM public.font_assets WHERE hash = p_hash);
  IF v_asset_id IS NULL THEN RETURN jsonb_build_object('success', true, 'needs_upload', true); END IF;

  v_font_id := (SELECT id FROM public.fonts WHERE user_id = auth.uid() AND (group_id = p_group_id OR (group_id IS NULL AND p_group_id IS NULL)) AND asset_id = v_asset_id);
  IF v_font_id IS NOT NULL THEN RETURN jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', true, 'font_id', v_font_id); END IF;

  INSERT INTO public.fonts (user_id, group_id, asset_id, name, metadata) VALUES (auth.uid(), p_group_id, v_asset_id, p_name, v_clean_metadata) RETURNING id INTO v_font_id;
  RETURN jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', false, 'linked', true, 'font_id', v_font_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.save_new_font(p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    v_owner uuid; v_asset_id uuid; v_font_id uuid; v_clean_metadata jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'unauthorized');
  END IF;

  IF p_group_id IS NOT NULL THEN
      v_owner := (SELECT user_id FROM public.groups WHERE id = p_group_id);
      IF v_owner IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'group_not_found'); END IF;
      IF v_owner <> auth.uid() AND NOT public.is_admin() THEN RETURN jsonb_build_object('success', false, 'message', 'forbidden'); END IF;

      IF NOT public.is_admin() AND (SELECT COUNT(*) FROM public.fonts WHERE user_id = v_owner) >= 50 THEN
          RETURN jsonb_build_object('success', false, 'message', 'font_limit_reached');
      END IF;
  ELSE
      IF NOT public.is_admin() THEN RETURN jsonb_build_object('success', false, 'message', 'forbidden_public_upload'); END IF;
  END IF;

  v_clean_metadata := (p_metadata - 'is_weight');

  INSERT INTO public.font_assets (hash, storage_path, download_url, size)
  VALUES (p_hash, p_storage_path, p_download_url, p_size)
  ON CONFLICT (hash) DO UPDATE SET download_url = EXCLUDED.download_url
  RETURNING id INTO v_asset_id;

  v_font_id := (
      SELECT id FROM public.fonts
      WHERE user_id = auth.uid() AND asset_id = v_asset_id
        AND ((group_id IS NULL AND p_group_id IS NULL) OR (group_id = p_group_id))
      LIMIT 1
  );

  IF v_font_id IS NOT NULL THEN
      RETURN jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_font_id);
  END IF;

  INSERT INTO public.fonts (user_id, group_id, asset_id, name, metadata)
  VALUES (auth.uid(), p_group_id, v_asset_id, p_name, v_clean_metadata)
  RETURNING id INTO v_font_id;

  RETURN jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_font_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.add_weight_directly(p_parent_font_id uuid, p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_metadata jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    v_parent_owner uuid; v_parent_group_id uuid; v_parent_is_weight boolean;
    v_asset_id uuid; v_weight_font_id uuid;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'unauthorized');
    END IF;

    SELECT user_id, group_id, COALESCE((metadata->>'is_weight')::boolean, false)
    INTO v_parent_owner, v_parent_group_id, v_parent_is_weight
    FROM public.fonts WHERE id = p_parent_font_id;

    IF v_parent_owner IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'parent_font_not_found');
    END IF;
    IF v_parent_is_weight THEN
        RETURN jsonb_build_object('success', false, 'message', 'parent_is_already_a_weight');
    END IF;

    IF v_parent_group_id IS NULL THEN
        IF NOT public.is_admin() THEN
            RETURN jsonb_build_object('success', false, 'message', 'forbidden_public_weight');
        END IF;
    ELSE
        IF v_parent_owner <> auth.uid() AND NOT public.is_admin() THEN
            RETURN jsonb_build_object('success', false, 'message', 'forbidden');
        END IF;
        IF NOT public.is_admin() AND (SELECT COUNT(*) FROM public.fonts WHERE user_id = v_parent_owner) >= 50 THEN
            RETURN jsonb_build_object('success', false, 'message', 'font_limit_reached');
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM public.font_assets WHERE hash = p_hash) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.fonts f JOIN public.font_assets fa ON fa.id = f.asset_id
            WHERE fa.hash = p_hash AND f.user_id = auth.uid()
        ) AND NOT public.is_admin() THEN
            RETURN jsonb_build_object('success', false, 'message', 'file_not_owned_by_user');
        END IF;
    END IF;

    INSERT INTO public.font_assets (hash, storage_path, download_url, size)
    VALUES (p_hash, p_storage_path, p_download_url, p_size)
    ON CONFLICT (hash) DO UPDATE SET download_url = EXCLUDED.download_url
    RETURNING id INTO v_asset_id;

    v_weight_font_id := (
        SELECT id FROM public.fonts
        WHERE user_id = v_parent_owner AND asset_id = v_asset_id
          AND ((group_id IS NULL AND v_parent_group_id IS NULL) OR (group_id = v_parent_group_id))
        LIMIT 1
    );

    IF v_weight_font_id IS NOT NULL THEN
        INSERT INTO public.font_weights (user_id, parent_font_id, child_font_id)
        VALUES (v_parent_owner, p_parent_font_id, v_weight_font_id)
        ON CONFLICT DO NOTHING;
        RETURN jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_weight_font_id);
    END IF;

    INSERT INTO public.fonts (user_id, group_id, asset_id, name, metadata)
    VALUES (v_parent_owner, v_parent_group_id, v_asset_id, p_name, p_metadata || '{"is_weight": true}'::jsonb)
    RETURNING id INTO v_weight_font_id;

    INSERT INTO public.font_weights (user_id, parent_font_id, child_font_id)
    VALUES (v_parent_owner, p_parent_font_id, v_weight_font_id);

    RETURN jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_weight_font_id);
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_font_smart(p_action text, p_font_id uuid, p_name text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    v_owner uuid;
BEGIN
    SELECT user_id INTO v_owner FROM public.fonts WHERE id = p_font_id;
    IF v_owner IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'font_not_found');
    END IF;
    IF NOT (v_owner = auth.uid() OR is_admin()) THEN
        RAISE EXCEPTION 'غير مصرح لك بإجراء هذه العملية.';
    END IF;

    IF p_action = 'delete' THEN
        DELETE FROM public.fonts WHERE id = p_font_id;
        IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'font_not_found'); END IF;
        RETURN jsonb_build_object('success', true, 'message', 'font_deleted');

    ELSIF p_action = 'update' THEN
        IF p_name IS NULL AND p_metadata IS NULL THEN
            RETURN jsonb_build_object('success', false, 'message', 'no_changes_provided');
        END IF;
        UPDATE public.fonts
        SET name = COALESCE(p_name, name),
            metadata = COALESCE(p_metadata, metadata)      -- NOTE: replaces the whole metadata
        WHERE id = p_font_id;
        IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'font_not_found'); END IF;
        RETURN jsonb_build_object('success', true, 'message', 'font_updated');
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'unknown_action');
    END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.manage_group_smart(p_action text, p_group_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'unauthorized');
    END IF;

    IF p_action = 'create' THEN
        INSERT INTO public.groups (user_id, name, description) VALUES (auth.uid(), p_name, p_description);
        RETURN jsonb_build_object('success', true, 'message', 'Group created');

    ELSIF p_action = 'update' AND p_group_id IS NOT NULL THEN
        UPDATE public.groups
        SET name = COALESCE(p_name, name), description = COALESCE(p_description, description)
        WHERE id = p_group_id AND user_id = auth.uid();
        IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'not_found_or_forbidden'); END IF;
        RETURN jsonb_build_object('success', true, 'message', 'Group updated');

    ELSIF p_action = 'delete' AND p_group_id IS NOT NULL THEN
        DELETE FROM public.groups WHERE id = p_group_id AND user_id = auth.uid();
        IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'message', 'not_found_or_forbidden'); END IF;
        RETURN jsonb_build_object('success', true, 'message', 'Group deleted');
    END IF;

    RETURN jsonb_build_object('success', false, 'message', 'Action failed');
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_fonts(p_group_id uuid DEFAULT NULL::uuid, p_sort text DEFAULT 'oldest'::text, p_limit integer DEFAULT 15, p_offset integer DEFAULT 0)
 RETURNS TABLE(font_id uuid, group_id uuid, asset_id uuid, name text, metadata jsonb, download_url text, size bigint, created_at timestamp with time zone, font_hash text, total_count bigint)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT f.id, f.group_id, f.asset_id, f.name, f.metadata, a.download_url, a.size, f.created_at, a.hash,
           COUNT(*) OVER() AS total_count
    FROM public.fonts f
    JOIN public.font_assets a ON a.id = f.asset_id
    WHERE (public.is_admin() OR f.user_id = auth.uid())          -- NOTE: admin sees every user's fonts
      AND (p_group_id IS NULL OR f.group_id = p_group_id)
      AND NOT EXISTS (SELECT 1 FROM public.font_weights fw WHERE fw.child_font_id = f.id)
    ORDER BY
        CASE WHEN p_sort = 'oldest' THEN f.created_at END ASC,
        CASE WHEN p_sort = 'newest' THEN f.created_at END DESC,
        CASE WHEN p_sort = 'name_asc' THEN f.name END ASC
    LIMIT p_limit OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_public_fonts(p_sort text DEFAULT 'newest'::text, p_limit integer DEFAULT 15, p_offset integer DEFAULT 0)
 RETURNS TABLE(font_id uuid, font_name text, download_url text, size bigint, tags jsonb, total_count bigint)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
    SELECT f.id, f.name, fa.download_url, fa.size, f.metadata -> 'tags', COUNT(*) OVER() AS total_count
    FROM public.fonts f
    JOIN public.font_assets fa ON fa.id = f.asset_id
    WHERE f.group_id IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.font_weights fw WHERE fw.child_font_id = f.id)
    ORDER BY
        CASE WHEN p_sort = 'newest' THEN f.created_at END DESC,
        CASE WHEN p_sort = 'oldest' THEN f.created_at END ASC,
        CASE WHEN p_sort = 'name_asc' THEN f.name END ASC
    LIMIT p_limit OFFSET p_offset;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_weights(p_font_id uuid)
 RETURNS TABLE(font_id uuid, name text, download_url text, font_hash text, size bigint, metadata jsonb)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    v_group_id uuid; v_font_exists boolean;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.fonts WHERE id = p_font_id) INTO v_font_exists;
    IF NOT v_font_exists THEN RETURN; END IF;
    SELECT group_id INTO v_group_id FROM public.fonts WHERE id = p_font_id;

    RETURN QUERY
    SELECT f.id AS font_id, f.name, a.download_url, a.hash AS font_hash, a.size, f.metadata
    FROM public.font_weights fw
    JOIN public.fonts f ON f.id = fw.child_font_id
    JOIN public.font_assets a ON a.id = f.asset_id
    WHERE fw.parent_font_id = p_font_id
      AND (v_group_id IS NULL OR fw.user_id = auth.uid() OR public.is_admin());
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_parent_font_ids(p_font_ids uuid[])
 RETURNS TABLE(parent_font_id uuid) LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT DISTINCT fw.parent_font_id
  FROM public.font_weights fw
  JOIN public.fonts f ON f.id = fw.parent_font_id
  WHERE fw.parent_font_id = ANY(p_font_ids)
    AND (f.group_id IS NULL OR fw.user_id = auth.uid() OR public.is_admin());
$function$;

CREATE OR REPLACE FUNCTION public.get_my_groups()
 RETURNS SETOF groups LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
    SELECT * FROM public.groups WHERE user_id = auth.uid() ORDER BY created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.get_my_notifications()
 RETURNS SETOF notifications LANGUAGE sql SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT * FROM notifications WHERE user_id = auth.uid() OR user_id IS NULL ORDER BY created_at DESC;
$function$;

CREATE OR REPLACE FUNCTION public.send_notification(p_user_id uuid, p_type text, p_slides jsonb)
 RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Admin role not found in Token';
    END IF;
    IF p_type NOT IN ('update', 'alert', 'info', 'promotion') THEN
        RETURN jsonb_build_object('success', false, 'message', 'invalid_notification_type');
    END IF;
    INSERT INTO public.notifications (user_id, type, slides, created_at) VALUES (p_user_id, p_type, p_slides, now());
    RETURN jsonb_build_object('success', true, 'message', 'notification_sent');
END;
$function$;

CREATE OR REPLACE FUNCTION public.smart_search(search_term text, p_mode text)
 RETURNS TABLE(id uuid, name text, tags jsonb, download_url text, total_count bigint)
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
BEGIN
    IF p_mode = 'public' THEN
        RETURN QUERY
        WITH filtered_fonts AS (
            SELECT f.id, f.name, COALESCE(f.metadata->'tags', '[]'::jsonb) as tags, fa.download_url
            FROM public.fonts f JOIN public.font_assets fa ON f.asset_id = fa.id
            WHERE f.group_id IS NULL
              AND NOT EXISTS (SELECT 1 FROM public.font_weights fw WHERE fw.child_font_id = f.id)
              AND (f.name ILIKE '%' || search_term || '%' OR f.metadata->>'tags' ILIKE '%' || search_term || '%')
        )
        SELECT ff.id, ff.name, ff.tags, ff.download_url, (SELECT COUNT(*) FROM filtered_fonts) AS total_count
        FROM filtered_fonts ff ORDER BY ff.name ASC LIMIT 5;

    ELSIF p_mode = 'private' THEN
        RETURN QUERY
        WITH filtered_fonts AS (
            SELECT f.id, f.name, '[]'::jsonb as tags, fa.download_url
            FROM public.fonts f JOIN public.font_assets fa ON f.asset_id = fa.id
            WHERE f.user_id = v_user_id AND f.group_id IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM public.font_weights fw WHERE fw.child_font_id = f.id)
              AND f.name ILIKE '%' || search_term || '%'
        )
        SELECT ff.id, ff.name, ff.tags, ff.download_url, (SELECT COUNT(*) FROM filtered_fonts) AS total_count
        FROM filtered_fonts ff ORDER BY ff.name ASC LIMIT 5;
    ELSE
        RETURN QUERY SELECT NULL::uuid, NULL::text, NULL::jsonb, NULL::text, 0::bigint WHERE false;
    END IF;
END;
$function$;

-- Trigger functions ---------------------------------------------------------
-- BROKEN: storage.delete_object() does not exist in this project; the branch only runs if the file still exists.
CREATE OR REPLACE FUNCTION public.on_font_asset_deleted()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'fonts' AND name = OLD.storage_path) THEN
    PERFORM storage.delete_object('fonts', OLD.storage_path);
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.on_storage_object_deleted()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
AS $function$
BEGIN
  IF OLD.bucket_id = 'fonts' THEN
    DELETE FROM public.font_assets WHERE storage_path = OLD.name;
  END IF;
  RETURN OLD;
END;
$function$;

CREATE OR REPLACE FUNCTION public.on_weight_link_deleted()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
    DELETE FROM public.fonts WHERE id = OLD.child_font_id;
    RETURN OLD;
END;
$function$;

-- Triggers
CREATE TRIGGER trigger_clean_orphan_weight AFTER DELETE ON public.font_weights FOR EACH ROW EXECUTE FUNCTION on_weight_link_deleted();
CREATE TRIGGER trigger_font_asset_deleted  AFTER DELETE ON public.font_assets  FOR EACH ROW EXECUTE FUNCTION on_font_asset_deleted();
CREATE TRIGGER trigger_storage_object_deleted AFTER DELETE ON storage.objects  FOR EACH ROW EXECUTE FUNCTION on_storage_object_deleted();
