الدوال وأكوادها





[
  {
    "اسم الدالة": "add_weight_directly",
    "المدخلات (Arguments)": "p_parent_font_id uuid, p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_metadata jsonb DEFAULT '{}'::jsonb",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\n  -- 1. التأكد من وجود أو تحديث الـ Asset\n  WITH inserted_asset AS (\n    INSERT INTO public.font_assets (hash, storage_path, download_url, size)\n    VALUES (p_hash, p_storage_path, p_download_url, p_size)\n    ON CONFLICT (hash) DO UPDATE SET download_url = EXCLUDED.download_url\n    RETURNING id\n  ),\n  -- 2. محاولة إضافة الخط، وإذا كان موجوداً (Duplicate) نقوم بتحديث الـ metadata ليكون \"وزن\"\n  upserted_font AS (\n    INSERT INTO public.fonts (user_id, group_id, asset_id, name, metadata)\n    SELECT \n        f.user_id, \n        f.group_id, \n        (SELECT id FROM inserted_asset), \n        p_name, \n        p_metadata || '{\"is_weight\": true}'::jsonb\n    FROM public.fonts f\n    WHERE f.id = p_parent_font_id\n    ON CONFLICT (user_id, group_id, asset_id) \n    DO UPDATE SET metadata = EXCLUDED.metadata || '{\"is_weight\": true}'::jsonb\n    RETURNING id\n  ),\n  -- 3. ربطه بالخط الأب (إذا لم يكن مربوطاً مسبقاً)\n  inserted_weight AS (\n    INSERT INTO public.font_weights (user_id, parent_font_id, child_font_id)\n    SELECT \n        (SELECT user_id FROM public.fonts WHERE id = p_parent_font_id),\n        p_parent_font_id,\n        id\n    FROM upserted_font\n    ON CONFLICT DO NOTHING\n    RETURNING child_font_id\n  )\n  SELECT jsonb_build_object(\n    'success', true, \n    'child_font_id', (SELECT id FROM upserted_font)\n  );\n"
  },
  {
    "اسم الدالة": "get_all_public_groups",
    "المدخلات (Arguments)": "",
    "المخرجات (Return Type)": "SETOF groups",
    "كود الدالة بالكامل (Source Code)": "\n    -- جلب المجموعات العامة لأي مستخدم (بما فيها مجموعاتك العامة)\n    SELECT * FROM public.groups \n    WHERE is_public = true \n    ORDER BY created_at DESC;\n"
  },
  {
    "اسم الدالة": "get_my_fonts",
    "المدخلات (Arguments)": "p_group_id uuid DEFAULT NULL::uuid",
    "المخرجات (Return Type)": "TABLE(font_id uuid, group_id uuid, asset_id uuid, name text, metadata jsonb, download_url text, size bigint, created_at timestamp with time zone, font_hash text)",
    "كود الدالة بالكامل (Source Code)": "\n  SELECT f.id, f.group_id, f.asset_id, f.name, f.metadata, a.download_url, a.size, f.created_at, a.hash\n  FROM public.fonts f \n  JOIN public.font_assets a ON a.id = f.asset_id\n  WHERE (public.is_admin() OR f.user_id = auth.uid()) AND (p_group_id IS NULL OR f.group_id = p_group_id)\n  ORDER BY f.created_at ASC;\n"
  },
  {
    "اسم الدالة": "get_my_groups",
    "المدخلات (Arguments)": "",
    "المخرجات (Return Type)": "SETOF groups",
    "كود الدالة بالكامل (Source Code)": "\n    SELECT * FROM public.groups \n    WHERE user_id = auth.uid() AND is_public = false\n    ORDER BY created_at DESC;\n"
  },
  {
    "اسم الدالة": "get_my_notifications",
    "المدخلات (Arguments)": "",
    "المخرجات (Return Type)": "SETOF notifications",
    "كود الدالة بالكامل (Source Code)": "\n  SELECT *\n  FROM notifications\n  WHERE user_id = auth.uid() \n     OR user_id IS NULL       \n  ORDER BY created_at DESC;\n"
  },
  {
    "اسم الدالة": "get_my_weights",
    "المدخلات (Arguments)": "p_font_id uuid",
    "المخرجات (Return Type)": "TABLE(font_id uuid, name text, download_url text, font_hash text, size bigint, metadata jsonb)",
    "كود الدالة بالكامل (Source Code)": "\n  SELECT \n    f.id, f.name, a.download_url, a.hash, a.size, f.metadata\n  FROM public.font_weights fw\n  JOIN public.fonts f ON f.id = fw.child_font_id\n  JOIN public.font_assets a ON a.id = f.asset_id\n  WHERE fw.parent_font_id = p_font_id \n    AND (fw.user_id = auth.uid() OR public.is_admin());\n"
  },
  {
    "اسم الدالة": "get_public_fonts",
    "المدخلات (Arguments)": "",
    "المخرجات (Return Type)": "TABLE(font_id uuid, font_name text, download_url text, size bigint, created_at timestamp with time zone, group_id uuid, group_name text, metadata jsonb)",
    "كود الدالة بالكامل (Source Code)": "\n  SELECT \n    f.id, f.name, a.download_url, a.size, f.created_at, g.id, g.name, f.metadata\n  FROM public.fonts f \n  JOIN public.font_assets a ON a.id = f.asset_id\n  JOIN public.groups g ON g.id = f.group_id \n  WHERE g.is_public = true \n  ORDER BY f.created_at DESC;\n"
  },
  {
    "اسم الدالة": "handle_new_user",
    "المدخلات (Arguments)": "",
    "المخرجات (Return Type)": "trigger",
    "كود الدالة بالكامل (Source Code)": "\nBEGIN\n  -- إدخال الايدي تبع المستخدم الجديد في جدول البروفايلات\n  -- الـ role رح ياخذ القيمة الافتراضية 'user' تلقائياً حسب تصميمك\n  INSERT INTO public.profiles (id, role)\n  VALUES (new.id, 'user');\n  \n  RETURN new;\nEND;\n"
  },
  {
    "اسم الدالة": "is_admin",
    "المدخلات (Arguments)": "p_uid uuid DEFAULT auth.uid()",
    "المخرجات (Return Type)": "boolean",
    "كود الدالة بالكامل (Source Code)": "\n  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = coalesce(p_uid, auth.uid()) AND role = 'admin');\n"
  },
  {
    "اسم الدالة": "manage_font_smart",
    "المدخلات (Arguments)": "p_action text, p_font_id uuid, p_name text DEFAULT NULL::text, p_metadata jsonb DEFAULT NULL::jsonb",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\ndeclare v_owner uuid;\nbegin\n  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;\n  v_owner := (select user_id from public.fonts where id = p_font_id);\n  if v_owner is null then return jsonb_build_object('success', false, 'message', 'font_not_found'); end if;\n  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;\n\n  if p_action = 'delete' then\n    delete from public.fonts where id = p_font_id;\n    return jsonb_build_object('success', true, 'action', 'delete');\n  elsif p_action = 'update' then\n    update public.fonts set name = coalesce(p_name, name), metadata = coalesce(p_metadata, metadata) where id = p_font_id;\n    return jsonb_build_object('success', true, 'action', 'update');\n  end if;\n  return jsonb_build_object('success', false, 'message', 'unknown_action');\nend;\n"
  },
  {
    "اسم الدالة": "manage_font_weight",
    "المدخلات (Arguments)": "p_action text, p_parent_font_id uuid, p_child_font_id uuid",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\ndeclare v_p_owner uuid; v_c_owner uuid;\nbegin\n  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;\n  if p_parent_font_id = p_child_font_id then return jsonb_build_object('success', false, 'message', 'same_font'); end if;\n\n  v_p_owner := (select user_id from public.fonts where id = p_parent_font_id);\n  v_c_owner := (select user_id from public.fonts where id = p_child_font_id);\n  \n  if v_p_owner is null or v_c_owner is null then return jsonb_build_object('success', false, 'message', 'not_found'); end if;\n  if (v_p_owner <> auth.uid() or v_c_owner <> auth.uid()) and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;\n\n  if p_action = 'link' then\n    insert into public.font_weights (user_id, parent_font_id, child_font_id) values (auth.uid(), p_parent_font_id, p_child_font_id) on conflict do nothing;\n    return jsonb_build_object('success', true, 'action', 'link');\n  elsif p_action = 'unlink' then\n    delete from public.font_weights where user_id = auth.uid() and parent_font_id = p_parent_font_id and child_font_id = p_child_font_id;\n    return jsonb_build_object('success', true, 'action', 'unlink');\n  end if;\n  return jsonb_build_object('success', false, 'message', 'unknown_action');\nend;\n"
  },
  {
    "اسم الدالة": "manage_group_smart",
    "المدخلات (Arguments)": "p_action text, p_group_id uuid DEFAULT NULL::uuid, p_name text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_is_public boolean DEFAULT NULL::boolean",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\nBEGIN\n    IF p_action = 'create' THEN\n        INSERT INTO public.groups (user_id, name, description, is_public)\n        VALUES (auth.uid(), p_name, p_description, COALESCE(p_is_public, false));\n        RETURN jsonb_build_object('success', true, 'message', 'Group created');\n\n    ELSIF p_action = 'update' AND p_group_id IS NOT NULL THEN\n        UPDATE public.groups\n        SET name = COALESCE(p_name, name),\n            description = COALESCE(p_description, description),\n            is_public = COALESCE(p_is_public, is_public)\n        WHERE id = p_group_id AND user_id = auth.uid();\n        RETURN jsonb_build_object('success', true, 'message', 'Group updated');\n\n    ELSIF p_action = 'delete' AND p_group_id IS NOT NULL THEN\n        DELETE FROM public.groups WHERE id = p_group_id AND user_id = auth.uid();\n        RETURN jsonb_build_object('success', true, 'message', 'Group deleted');\n    END IF;\n\n    RETURN jsonb_build_object('success', false, 'message', 'Action failed');\nEND;\n"
  },
  {
    "اسم الدالة": "prepare_font_upload",
    "المدخلات (Arguments)": "p_name text, p_hash text, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\ndeclare v_owner uuid; v_asset_id uuid; v_font_id uuid;\nbegin\n  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;\n  v_owner := (select user_id from public.groups where id = p_group_id);\n  if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;\n  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;\n\n  v_asset_id := (select id from public.font_assets where hash = p_hash);\n  if v_asset_id is null then return jsonb_build_object('success', true, 'needs_upload', true); end if;\n\n  v_font_id := (select id from public.fonts where user_id = auth.uid() and group_id = p_group_id and asset_id = v_asset_id);\n  if v_font_id is not null then return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', true, 'font_id', v_font_id); end if;\n\n  insert into public.fonts (user_id, group_id, asset_id, name, metadata) values (auth.uid(), p_group_id, v_asset_id, p_name, p_metadata) returning id into v_font_id;\n  return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', false, 'linked', true, 'font_id', v_font_id);\nend;\n"
  },
  {
    "اسم الدالة": "save_new_font",
    "المدخلات (Arguments)": "p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb",
    "المخرجات (Return Type)": "jsonb",
    "كود الدالة بالكامل (Source Code)": "\ndeclare v_owner uuid; v_asset_id uuid; v_font_id uuid;\nbegin\n  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;\n  v_owner := (select user_id from public.groups where id = p_group_id);\n  if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;\n  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;\n\n  insert into public.font_assets (hash, storage_path, download_url, size) values (p_hash, p_storage_path, p_download_url, p_size) on conflict (hash) do update set download_url = excluded.download_url returning id into v_asset_id;\n  insert into public.fonts (user_id, group_id, asset_id, name, metadata) values (auth.uid(), p_group_id, v_asset_id, p_name, p_metadata) on conflict (user_id, group_id, asset_id) do nothing returning id into v_font_id;\n\n  if v_font_id is null then\n    v_font_id := (select id from public.fonts where user_id = auth.uid() and group_id = p_group_id and asset_id = v_asset_id);\n    return jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_font_id);\n  end if;\n\n  return jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_font_id);\nend;\n"
  },
  {
    "اسم الدالة": "send_notification",
    "المدخلات (Arguments)": "p_user_id uuid, p_type text, p_slides jsonb",
    "المخرجات (Return Type)": "void",
    "كود الدالة بالكامل (Source Code)": "\nBEGIN\n  -- الفحص من التوكن مباشرة (Metadata)\n  IF (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin') \n     OR (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin') \n  THEN\n      INSERT INTO public.notifications (user_id, type, slides, created_at)\n      VALUES (p_user_id, p_type, p_slides, now());\n  ELSE\n      RAISE EXCEPTION 'Unauthorized: Admin role not found in Token';\n  END IF;\nEND;\n"
  },
  {
    "اسم الدالة": "smart_search",
    "المدخلات (Arguments)": "search_term text, p_mode text",
    "المخرجات (Return Type)": "TABLE(id uuid, name text, group_name text, metadata jsonb, download_url text, total_count bigint)",
    "كود الدالة بالكامل (Source Code)": "\n  WITH results_cte AS (\n    SELECT \n      f.id, \n      f.name, \n      g.name as g_name, \n      f.metadata, \n      a.download_url\n    FROM public.fonts f\n    JOIN public.groups g ON f.group_id = g.id\n    JOIN public.font_assets a ON f.asset_id = a.id\n    WHERE \n      (f.name ILIKE '%' || search_term || '%') \n      AND (\n        CASE \n          WHEN p_mode = 'public' THEN (g.is_public = true)\n          WHEN p_mode = 'private' THEN (f.user_id = auth.uid())\n        END\n      )\n  )\n  SELECT \n    id, \n    name, \n    g_name as group_name, \n    metadata, \n    download_url,\n    (SELECT count(*) FROM results_cte) AS total_count\n  FROM results_cte\n  ORDER BY name ASC  -- التعديل هنا: استخدمنا name بدلاً من font_name\n  LIMIT 5;\n"
  }
]



جميع السياسات للجداول






[
  {
    "اسم الجدول": "font_assets",
    "اسم السياسة": "read_assets",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "true",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "font_weights",
    "اسم السياسة": "read_weights",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "((user_id = auth.uid()) OR is_admin() OR (EXISTS ( SELECT 1\n   FROM (fonts f\n     JOIN groups g ON ((f.group_id = g.id)))\n  WHERE ((f.id = font_weights.parent_font_id) AND (g.is_public = true)))))",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "fonts",
    "اسم السياسة": "read_fonts",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "((EXISTS ( SELECT 1\n   FROM groups g\n  WHERE ((g.id = fonts.group_id) AND (g.is_public = true)))) OR (user_id = auth.uid()) OR is_admin())",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "groups",
    "اسم السياسة": "read_groups",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "((is_public = true) OR (user_id = auth.uid()) OR is_admin())",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "notifications",
    "اسم السياسة": "read_notifications",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "((user_id IS NULL) OR (user_id = auth.uid()) OR is_admin())",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "notifications",
    "اسم السياسة": "admin_manage_notifications",
    "العملية (Command)": "ALL",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "is_admin()",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "notifications",
    "اسم السياسة": "admin_all",
    "العملية (Command)": "ALL",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "is_admin(auth.uid())",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "notifications",
    "اسم السياسة": "Enable read access for all users",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "true",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "notifications",
    "اسم السياسة": "update_my_notifications",
    "العملية (Command)": "UPDATE",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "(auth.uid() = user_id)",
    "شرط الكتابة (With Check)": null
  },
  {
    "اسم الجدول": "profiles",
    "اسم السياسة": "read_profiles",
    "العملية (Command)": "SELECT",
    "الأدوار المستهدفة": "{public}",
    "شرط القراءة (Using)": "((auth.uid() = id) OR is_admin())",
    "شرط الكتابة (With Check)": null
  }
]




جميع الجداول والعواميد





[
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "hash",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "storage_path",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "download_url",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "size",
    "نوع البيانات": "bigint",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_assets",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "font_weights",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_weights",
    "اسم العمود": "user_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_weights",
    "اسم العمود": "parent_font_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_weights",
    "اسم العمود": "child_font_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "font_weights",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "user_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "group_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "asset_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "name",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "metadata",
    "نوع البيانات": "jsonb",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "fonts",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "user_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "name",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "description",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "is_public",
    "نوع البيانات": "boolean",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "groups",
    "اسم العمود": "updated_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "notifications",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "notifications",
    "اسم العمود": "user_id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "notifications",
    "اسم العمود": "type",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "notifications",
    "اسم العمود": "slides",
    "نوع البيانات": "jsonb",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "notifications",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "profiles",
    "اسم العمود": "id",
    "نوع البيانات": "uuid",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "profiles",
    "اسم العمود": "role",
    "نوع البيانات": "text",
    "هل يقبل فارغ؟": "NO"
  },
  {
    "اسم الجدول": "profiles",
    "اسم العمود": "created_at",
    "نوع البيانات": "timestamp with time zone",
    "هل يقبل فارغ؟": "YES"
  },
  {
    "اسم الجدول": "profiles",
    "اسم العمود": "notification_preferences",
    "نوع البيانات": "jsonb",
    "هل يقبل فارغ؟": "YES"
  }
]