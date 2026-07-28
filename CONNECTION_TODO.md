# Supabase Reconnection Todo List (CONNECTION_TODO.md)

هذا الملف يحتوي على حصر كامل وشهادة بجميع نقاط الاتصال بـ Supabase التي تم فصلها مؤقتاً عن قاعدة البيانات والتخزين (Database & Storage) في واجهة الفرونت إند، مع الحفاظ الكامل على مصادقة المستخدمين (Supabase Auth).

---

## 1. خدمات المجموعات (`src/services/groupService.ts`)

- **`getGroups()`**
  - **السابق:** `supabase.rpc('get_my_groups')`
  - **الحالي:** إرجاع المجموعات المخزنة محلياً في `localStorage` أو مجموعة تجريبية بديلة.

- **`createGroupSmart(name, description, isPublic)`**
  - **السابق:** `supabase.rpc('manage_group_smart', { p_group_id: null, p_action: 'create', p_name: name, p_description: description, p_is_public: isPublic })`
  - **الحالي:** إنشاء كائن مجموعة جديد وإضافته إلى `localStorage`.

- **`updateGroup(groupId, updates)`**
  - **السابق:** `supabase.rpc('manage_group_smart', { p_group_id: groupId, p_action: 'update', p_name: updates.name, p_description: updates.description, p_is_public: updates.is_public })`
  - **الحالي:** تحديث بيانات المجموعة محلياً في `localStorage`.

- **`deleteGroupSmart(groupId)`**
  - **السابق:** `supabase.rpc('manage_group_smart', { p_action: 'delete', p_group_id: groupId, ... })`
  - **الحالي:** حذف المجموعة من `localStorage`.

---

## 2. خدمات الخطوط والأوزان (`src/services/fontService.ts`)

- **`uploadFontToGroup(file, groupId, allowDuplicate)`**
  - **السابق:** 
    1. `supabase.rpc('prepare_font_upload', { p_name, p_hash, p_group_id })`
    2. `supabase.storage.from('fonts').upload(fileName, file, { upsert: true })`
    3. `supabase.storage.from('fonts').getPublicUrl(fileName)`
    4. `supabase.rpc('save_new_font', { p_name, p_hash, p_storage_path, p_download_url, p_size, p_group_id })`
  - **الحالي:** إنشاء Blob URL محلي وحفظ كائن الخط في `localStorage` دون رفع للمتجر.

- **`getGroupFonts(groupId)`**
  - **السابق:** `supabase.rpc('get_my_fonts', { p_group_id: groupId })`
  - **الحالي:** إرجاع الخطوط المخزنة محلياً من `localStorage`.

- **`getPublicFonts()`**
  - **السابق:** `supabase.rpc('get_public_fonts')`
  - **الحالي:** إرجاع قائمة الخطوط العامة من `localStorage`.

- **`deleteFontPermanently(fontId)`**
  - **السابق:** `supabase.rpc('manage_font_smart', { p_action: 'delete', p_font_id: fontId, p_name: null })`
  - **الحالي:** إرجاع استجابة نجاح صورية `{ success: true }`.

- **`updateFontName(fontId, newName)`**
  - **السابق:** `supabase.rpc('manage_font_smart', { p_action: 'update', p_font_id: fontId, p_name: newName })`
  - **الحالي:** معطل مؤقتاً.

- **`updateFontTags(fontId, tags)`**
  - **السابق:** `supabase.rpc('manage_font_smart', { p_action: 'update', p_font_id: fontId, p_metadata: { tags } })`
  - **الحالي:** معطل مؤقتاً.

- **`uploadFontWeight(file, parentFontId, groupId)`**
  - **السابق:** 
    1. `supabase.storage.from('fonts').upload(...)`
    2. `supabase.storage.from('fonts').getPublicUrl(...)`
    3. `supabase.rpc('add_weight_directly', { p_parent_font_id, p_name, p_hash, p_storage_path, p_download_url, p_size })`
  - **الحالي:** إرجاع كائن وزن محلي بـ Blob URL.

- **`getFontWeights(parentFontId)`**
  - **السابق:** `supabase.rpc('get_my_weights', { p_font_id: parentFontId })`
  - **الحالي:** إرجاع مصفوفة فارغة `[]`.

- **`getAllWeightRelationships()`**
  - **السابق:** `supabase.from('font_weights').select('parent_font_id, child_font_id')`
  - **الحالي:** إرجاع مصفوفة فارغة `[]`.

- **`getWeightRelationshipsForFonts(fontIds)`**
  - **السابق:** `supabase.from('font_weights').select('parent_font_id, child_font_id').in('parent_font_id', fontIds)`
  - **الحالي:** إرجاع مصفوفة فارغة `[]`.

---

## 3. خدمات الإشعارات (`src/services/notificationService.ts`)

- **`getNotifications(userId)`**
  - **السابق:** `supabase.rpc('get_my_notifications')`
  - **الحالي:** إرجاع مصفوفة فارغة `[]`.

- **`createNotification(type, slides, userId)`**
  - **السابق:** `supabase.rpc('send_notification', { p_user_id, p_type, p_slides })`
  - **الحالي:** إرجاع `{ success: true }`.

- **`uploadNotificationImage(file)`**
  - **السابق:** `supabase.storage.from('notifications').upload(...)` و `.getPublicUrl(...)`
  - **الحالي:** إرجاع Blob URL محلي `URL.createObjectURL(file)`.

- **`deleteNotification(id)`**
  - **السابق:** `supabase.from('notifications').delete().eq('id', id)`
  - **الحالي:** معطل مؤقتاً.

---

## 4. البحث الذكي (`src/components/SmartSearch.tsx`)

- **استعلام البحث الذكي**
  - **السابق:** `supabase.rpc('smart_search', { search_term, p_mode })`
  - **الحالي:** معطل مؤقتاً وإرجاع استجابة فارغة.

---

## 5. الصفحات والعرض المباشر (Pages)

- **`src/pages/FontsPage.tsx`**
  - **مستمع التحديث الفوري (Realtime):** `supabase.channel('groups_changes').on('postgres_changes', ...)`
  - **استعلام المجموعة الفرعي:** `supabase.from('fonts').select('group_id').eq('id', res.id).single()`
  - **الحالي:** تم التعليق عليهما بحافظة `/* ... */` وتأشيرهما بـ `// TODO: reconnect to Supabase`.

- **`src/pages/GroupDetails.tsx`**
  - **استعلام تفاصيل المجموعة العامة البديل:** `supabase.from('groups').select('*').eq('id', id).single()`
  - **الحالي:** تم التعليق عليه بحافظة `/* ... */` وتأشيره بـ `// TODO: reconnect to Supabase`.

---

## 6. الأجزاء غير الملموسة (المحفوظة كلياً كما هي)

- **تهيئة العميل ومتغيرات البيئة (`src/lib/supabase.ts`)**: لم تتغير نهائياً.
- **مصادقة المستخدمين Auth**:
  - `src/contexts/AuthContext.tsx` (`supabase.auth.getSession`, `supabase.auth.onAuthStateChange`)
  - `src/pages/Login.tsx` (`supabase.auth.signInWithPassword`, `supabase.auth.signUp`)
  - `src/pages/Account.tsx` (`supabase.auth.signOut`, `signUp`, `signInWithPassword`)
