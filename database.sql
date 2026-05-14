-- =========================================================
-- 1. مرحلة الحذف الجذري (تنظيف النظام القديم)
-- =========================================================
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================================================
-- 2. بناء الجداول الأساسية (4 كيانات فقط + بروفايل)
-- =========================================================

-- جدول الحسابات والصلاحيات (لا يوجد فيه إلا الدور)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at timestamptz DEFAULT now()
);

-- جدول المجموعات (أساس التنظيم ومكان الخصوصية الوحيد)
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_public boolean NOT NULL DEFAULT false, -- الخصوصية هنا فقط
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- جدول الملفات المرفوعة (المخزن الفيزيائي الوحيد، لا يتكرر ولا يُحذف)
CREATE TABLE public.font_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hash text NOT NULL UNIQUE, -- يمنع تكرار نفس الملف
  storage_path text NOT NULL,
  download_url text NOT NULL,
  size bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- جدول الخطوط (سجل المستخدم الخاص، مرتبط بالمجموعة والملف)
CREATE TABLE public.fonts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.font_assets(id) ON DELETE RESTRICT, -- لا نحذف الملف لو انحذف الخط
  name text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, group_id, asset_id) -- يمنع تكرار نفس الملف للمستخدم في نفس المجموعة
);

-- جدول الأوزان (روابط حرة بين سجلات الخطوط)
CREATE TABLE public.font_weights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_font_id uuid NOT NULL REFERENCES public.fonts(id) ON DELETE CASCADE,
  child_font_id uuid NOT NULL REFERENCES public.fonts(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, parent_font_id, child_font_id),
  CHECK (parent_font_id <> child_font_id) -- يمنع ربط الخط بنفسه
);

-- =========================================================
-- 3. دالة الأدمن المركزية
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = coalesce(p_uid, auth.uid()) AND role = 'admin');
$$;

-- =========================================================
-- 4. إعدادات الأمان RLS (منع الواجهة من التعديل المباشر)
-- =========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.font_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.font_weights ENABLE ROW LEVEL SECURITY;

-- سياسات القراءة (SELECT فقط! لا يوجد INSERT/UPDATE/DELETE لأنها تتم عبر الدوال فقط)
CREATE POLICY "read_profiles" ON public.profiles FOR SELECT USING (id = auth.uid() OR public.is_admin());
CREATE POLICY "read_groups" ON public.groups FOR SELECT USING (is_public = true OR user_id = auth.uid() OR public.is_admin());
CREATE POLICY "read_assets" ON public.font_assets FOR SELECT USING (true);
CREATE POLICY "read_fonts" ON public.fonts FOR SELECT USING (
  EXISTS(SELECT 1 FROM public.groups g WHERE g.id = fonts.group_id AND g.is_public = true) OR user_id = auth.uid() OR public.is_admin()
);
CREATE POLICY "read_weights" ON public.font_weights FOR SELECT USING (
  user_id = auth.uid() OR public.is_admin()
);

-- =========================================================
-- 5. دوال القراءة (لجلب البيانات للواجهة)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_my_groups()
RETURNS TABLE (group_id uuid, name text, description text, is_public boolean, created_at timestamptz, updated_at timestamptz, font_count bigint, owner_id uuid, is_owner boolean)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT g.id, g.name, g.description, g.is_public, g.created_at, g.updated_at, count(f.id)::bigint as font_count,
         g.user_id as owner_id, (g.user_id = auth.uid()) as is_owner
  FROM public.groups g 
  LEFT JOIN public.fonts f ON f.group_id = g.id
  WHERE public.is_admin() OR g.user_id = auth.uid()
  GROUP BY g.id, g.name, g.description, g.is_public, g.created_at, g.updated_at, g.user_id
  ORDER BY g.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_my_fonts(p_group_id uuid DEFAULT NULL)
RETURNS TABLE (font_id uuid, group_id uuid, asset_id uuid, name text, metadata jsonb, download_url text, size bigint, created_at timestamptz, font_hash text) 
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT f.id, f.group_id, f.asset_id, f.name, f.metadata, a.download_url, a.size, f.created_at, a.hash
  FROM public.fonts f 
  JOIN public.font_assets a ON a.id = f.asset_id
  WHERE (public.is_admin() OR f.user_id = auth.uid()) AND (p_group_id IS NULL OR f.group_id = p_group_id)
  ORDER BY f.created_at ASC;
$$;

-- [تم التعديل] إضافة الميتادات لدالة الخطوط العامة
CREATE OR REPLACE FUNCTION public.get_public_fonts()
RETURNS TABLE (font_id uuid, font_name text, download_url text, size bigint, created_at timestamptz, group_id uuid, group_name text, metadata jsonb)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT f.id, f.name, a.download_url, a.size, f.created_at, g.id, g.name, f.metadata
  FROM public.fonts f 
  JOIN public.font_assets a ON a.id = f.asset_id
  JOIN public.groups g ON g.id = f.group_id 
  WHERE g.is_public = true 
  ORDER BY f.created_at DESC;
$$;

-- [تمت الإضافة] دالة جلب الأوزان لحل مشكلة (PGRST202)
CREATE OR REPLACE FUNCTION public.get_my_weights(p_font_id uuid)
RETURNS TABLE (font_id uuid, name text, download_url text, font_hash text, size bigint, metadata jsonb)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT f.id, f.name, a.download_url, a.hash, a.size, f.metadata
  FROM public.font_weights fw
  JOIN public.fonts f ON f.id = fw.child_font_id
  JOIN public.font_assets a ON a.id = f.asset_id
  WHERE fw.parent_font_id = p_font_id 
    AND (fw.user_id = auth.uid() OR public.is_admin());
$$;

-- =========================================================
-- 6. دوال العمليات (التي تستخدمها الواجهة بدل التعديل المباشر)
-- =========================================================

-- دالة إدارة المجموعات
CREATE OR REPLACE FUNCTION public.manage_group_smart(p_action text, p_group_id uuid DEFAULT NULL, p_name text DEFAULT NULL, p_description text DEFAULT NULL, p_is_public boolean DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
declare v_owner uuid; v_new_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'not_authenticated'); end if;
  
  if p_action = 'create' then
    insert into public.groups (user_id, name, description, is_public) values (auth.uid(), p_name, p_description, false) returning id into v_new_id;
    return jsonb_build_object('success', true, 'action', 'create', 'group_id', v_new_id);
  end if;

  v_owner := (select user_id from public.groups where id = p_group_id);
  if v_owner is null then return jsonb_build_object('success', false, 'message', 'not_found'); end if;
  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;

  if p_action = 'update' then
    update public.groups set name = coalesce(p_name, name), description = coalesce(p_description, description), is_public = coalesce(p_is_public, is_public), updated_at = now() where id = p_group_id;
    return jsonb_build_object('success', true, 'action', 'update');
  elsif p_action = 'delete' then
    delete from public.groups where id = p_group_id;
    return jsonb_build_object('success', true, 'action', 'delete');
  end if;
  return jsonb_build_object('success', false, 'message', 'unknown_action');
end;
$$;

-- دالة تجهيز الرفع (الفحص قبل التخزين)
CREATE OR REPLACE FUNCTION public.prepare_font_upload(p_name text, p_hash text, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
declare v_owner uuid; v_asset_id uuid; v_font_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  v_owner := (select user_id from public.groups where id = p_group_id);
  if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;
  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;

  v_asset_id := (select id from public.font_assets where hash = p_hash);
  if v_asset_id is null then return jsonb_build_object('success', true, 'needs_upload', true); end if;

  v_font_id := (select id from public.fonts where user_id = auth.uid() and group_id = p_group_id and asset_id = v_asset_id);
  if v_font_id is not null then return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', true, 'font_id', v_font_id); end if;

  insert into public.fonts (user_id, group_id, asset_id, name, metadata) values (auth.uid(), p_group_id, v_asset_id, p_name, p_metadata) returning id into v_font_id;
  return jsonb_build_object('success', true, 'needs_upload', false, 'duplicate', false, 'linked', true, 'font_id', v_font_id);
end;
$$;

-- دالة حفظ الخط الجديد
CREATE OR REPLACE FUNCTION public.save_new_font(p_name text, p_hash text, p_storage_path text, p_download_url text, p_size bigint, p_group_id uuid, p_metadata jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
declare v_owner uuid; v_asset_id uuid; v_font_id uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  v_owner := (select user_id from public.groups where id = p_group_id);
  if v_owner is null then return jsonb_build_object('success', false, 'message', 'group_not_found'); end if;
  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;

  insert into public.font_assets (hash, storage_path, download_url, size) values (p_hash, p_storage_path, p_download_url, p_size) on conflict (hash) do update set download_url = excluded.download_url returning id into v_asset_id;
  insert into public.fonts (user_id, group_id, asset_id, name, metadata) values (auth.uid(), p_group_id, v_asset_id, p_name, p_metadata) on conflict (user_id, group_id, asset_id) do nothing returning id into v_font_id;

  if v_font_id is null then
    v_font_id := (select id from public.fonts where user_id = auth.uid() and group_id = p_group_id and asset_id = v_asset_id);
    return jsonb_build_object('success', true, 'duplicate', true, 'font_id', v_font_id);
  end if;

  return jsonb_build_object('success', true, 'duplicate', false, 'font_id', v_font_id);
end;
$$;

-- دالة تعديل/حذف الخط (حذف السجل فقط)
CREATE OR REPLACE FUNCTION public.manage_font_smart(p_action text, p_font_id uuid, p_name text DEFAULT NULL, p_metadata jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
declare v_owner uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  v_owner := (select user_id from public.fonts where id = p_font_id);
  if v_owner is null then return jsonb_build_object('success', false, 'message', 'font_not_found'); end if;
  if v_owner <> auth.uid() and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;

  if p_action = 'delete' then
    delete from public.fonts where id = p_font_id;
    return jsonb_build_object('success', true, 'action', 'delete');
  elsif p_action = 'update' then
    update public.fonts set name = coalesce(p_name, name), metadata = coalesce(p_metadata, metadata) where id = p_font_id;
    return jsonb_build_object('success', true, 'action', 'update');
  end if;
  return jsonb_build_object('success', false, 'message', 'unknown_action');
end;
$$;

-- دالة إدارة الأوزان (الربط الحر)
CREATE OR REPLACE FUNCTION public.manage_font_weight(p_action text, p_parent_font_id uuid, p_child_font_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
declare v_p_owner uuid; v_c_owner uuid;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'message', 'unauthorized'); end if;
  if p_parent_font_id = p_child_font_id then return jsonb_build_object('success', false, 'message', 'same_font'); end if;

  v_p_owner := (select user_id from public.fonts where id = p_parent_font_id);
  v_c_owner := (select user_id from public.fonts where id = p_child_font_id);
  
  if v_p_owner is null or v_c_owner is null then return jsonb_build_object('success', false, 'message', 'not_found'); end if;
  if (v_p_owner <> auth.uid() or v_c_owner <> auth.uid()) and not public.is_admin() then return jsonb_build_object('success', false, 'message', 'forbidden'); end if;

  if p_action = 'link' then
    insert into public.font_weights (user_id, parent_font_id, child_font_id) values (auth.uid(), p_parent_font_id, p_child_font_id) on conflict do nothing;
    return jsonb_build_object('success', true, 'action', 'link');
  elsif p_action = 'unlink' then
    delete from public.font_weights where user_id = auth.uid() and parent_font_id = p_parent_font_id and child_font_id = p_child_font_id;
    return jsonb_build_object('success', true, 'action', 'unlink');
  end if;
  return jsonb_build_object('success', false, 'message', 'unknown_action');
end;
$$;

-- =========================================================
-- 7. نظام الإشعارات (Notifications)
-- =========================================================
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, -- null means global notification
  type text NOT NULL CHECK (type IN ('update', 'alert', 'info', 'promotion')),
  slides jsonb NOT NULL DEFAULT '[]'::jsonb, -- Array of { id, title, description, image_url }
  created_at timestamptz DEFAULT now()
);

-- سياسات RLS للإشعارات
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_my_notifications()
RETURNS SETOF public.notifications
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.notifications 
  WHERE user_id IS NULL OR user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id uuid,
  p_type text,
  p_slides jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  -- التحقق من الإيميل المباشر كأدمن
  IF auth.jwt() ->> 'email' = 'thameralsatam@gmail.com' THEN
    v_is_admin := true;
  ELSE
    -- التحقق من التوكين
    IF auth.jwt() -> 'app_metadata' ->> 'role' = 'admin' OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin' THEN
      v_is_admin := true;
    ELSE
      -- التحقق من جدول الملف الشخصي إذا لم يكن في التوكين
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    END IF;
  END IF;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'permission denied';
  END IF;

  INSERT INTO public.notifications (user_id, type, slides)
  VALUES (p_user_id, p_type, p_slides);
END;
$$;

DROP POLICY IF EXISTS "read_notifications" ON public.notifications;
DROP POLICY IF EXISTS "manage_notifications" ON public.notifications;
DROP POLICY IF EXISTS "admin_all_notifications" ON public.notifications;

CREATE POLICY "read_notifications" ON public.notifications
FOR SELECT USING (
  user_id IS NULL OR user_id = auth.uid() OR public.is_admin()
);

CREATE POLICY "admin_insert_notifications" ON public.notifications
FOR INSERT WITH CHECK (
  public.is_admin()
);

CREATE POLICY "admin_manage_notifications" ON public.notifications
FOR ALL USING (
  public.is_admin()
);

GRANT ALL ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

-- إضافة عمود التفضيلات لجدول المستخدمين (Profiles)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT '{"updates": true, "alerts": true, "info": true}'::jsonb;

-- إعداد مساحة التخزين الخاصة بصور الإشعارات
INSERT INTO storage.buckets (id, name, public) VALUES ('notifications', 'notifications', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "تفعيل القراءة للجميع لصور الإشعارات" ON storage.objects
  FOR SELECT USING (bucket_id = 'notifications');

CREATE POLICY "تفعيل الإضافة للمشرفين لصور الإشعارات" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'notifications' AND public.is_admin());

CREATE POLICY "تفعيل التعديل والإلغاء للمشرفين" ON storage.objects
  FOR UPDATE USING (bucket_id = 'notifications' AND public.is_admin());

CREATE POLICY "تفعيل الحذف للمشرفين" ON storage.objects
  FOR DELETE USING (bucket_id = 'notifications' AND public.is_admin());
