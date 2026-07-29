# Supabase Integration Reference & Backend Mapping (دليل وتجميع عمليات Supabase)

هذا الملف يحتوي على تجميع شامل وتفصيلي لكل استدعاءات وتعاملات **Supabase** في التطبيق وفقًا للوضع الحالي تمامًا بدون أي تعديل على كود التطبيق.

---

## 1. المصادقة والتعامل مع المستخدمين (Supabase Auth)

| الموقع في الكود (`File`) | العملية (`Method`) | المدخلات والتفاصيل (`Details`) |
| :--- | :--- | :--- |
| `src/contexts/AuthContext.tsx` | `supabase.auth.getSession()` | جلب جلسة المستخدم عند فتح التطبيق لأول مرة. |
| `src/contexts/AuthContext.tsx` | `supabase.auth.onAuthStateChange(...)` | الاستماع للتغيرات الجلسة تلقائيًا (تسجيل دخول/خروج). |
| `src/pages/Login.tsx` | `supabase.auth.signUp(...)` | إنشاء حساب جديد بالبريد وكلمة المرور + الاسم والمسمى الوظيفي في `options.data`. |
| `src/pages/Login.tsx` | `supabase.auth.signInWithPassword(...)` | تسجيل الدخول بكلمة المرور. |
| `src/pages/Account.tsx` | `supabase.auth.signUp(...)` | إنشاء حساب جديد من صفحة الحساب. |
| `src/pages/Account.tsx` | `supabase.auth.signInWithPassword(...)` | تسجيل الدخول من صفحة الحساب. |
| `src/pages/Account.tsx` | `supabase.auth.signOut()` | تسجيل الخروج. |
| `src/services/groupService.ts` | `supabase.auth.getSession()` | التحقق من جلسة المستخدم قبل جلب المجموعات. |

---

## 2. الإجراءات والـ Stored Procedures المتخزنة (Supabase RPCs)

يقوم التطبيق بالاعتماد بشكل أساسي على الدوار المخزنة (RPC) في PostgreSQL لإجراء العمليات الحساسة والمعقدة:

| اسم الـ RPC في Supabase | الملف والاستدعاء (`Caller Function`) | المعاملات الممررة (`Parameters`) | الغرض الوظيفي |
| :--- | :--- | :--- | :--- |
| `prepare_font_upload` | `fontService.ts` -> `uploadFontToGroup` | `p_group_id`, `p_font_name`, `p_file_size`, `p_sha256`, `p_original_filename` | التحقق من صلاحيات العضو/الأدمن، فحص التكرار عبر SHA256، وحجز اسم ملف للرفع. |
| `save_new_font` | `fontService.ts` -> `uploadFontToGroup` | `p_group_id`, `p_font_name`, `p_storage_path`, `p_font_type`, `p_style`, `p_file_size`, `p_sha256`, `p_weight_name`, `p_weight_value` | حفظ الخط المرفوع وأول وزن له في قاعدة البيانات بعد نجاح الرفع للـ Storage. |
| `add_weight_directly` | `fontService.ts` -> `addWeightToFontDirectly` | `p_font_id`, `p_weight_name`, `p_weight_value`, `p_storage_path`, `p_file_size`, `p_sha256`, `p_style` | إضافة وزن جديد لخط موجود سابقاً. |
| `manage_font_smart` | `fontService.ts` -> `deleteFontSmart` | `p_action: 'delete'`, `p_font_id` | حذف خط بالكامل ذكيًا حسب صلاحيات المستخدم. |
| `manage_font_smart` | `fontService.ts` -> `renameFontSmart` | `p_action: 'rename'`, `p_font_id`, `p_new_name` | إعادة تسمية خط ذكيًا. |
| `manage_font_smart` | `fontService.ts` -> `moveFontGroupSmart` | `p_action: 'move_group'`, `p_font_id`, `p_target_group_id` | نقل خط من مجموعة إلى مجموعة أخرى. |
| `get_my_fonts` | `fontService.ts` -> `getMyFonts` | `p_group_id` (اختياري) | جلب الخطوط الخاصة بالمستخدم/المجموعة. |
| `get_public_fonts` | `fontService.ts` -> `getPublicFonts` | `p_search` (اختياري) | جلب الخطوط العامة والمفتوحة للجميع. |
| `get_my_weights` | `fontService.ts` -> `getMyWeights` | `p_font_id` | جلب أوزان خط معين. |
| `manage_group_smart` | `groupService.ts` -> `createGroupSmart` | `p_action: 'create'`, `p_name`, `p_description` | إنشاء مجموعة جديدة. |
| `manage_group_smart` | `groupService.ts` -> `updateGroup` | `p_action: 'update'`, `p_group_id`, `p_name`, `p_description` | تعديل بيانات مجموعة. |
| `manage_group_smart` | `groupService.ts` -> `deleteGroupSmart` | `p_action: 'delete'`, `p_group_id` | حذف مجموعة. |
| `get_my_notifications` | `notificationService.ts` -> `getNotifications` | لا يوجد | جلب إشعارات المستخدم. |
| `send_notification` | `notificationService.ts` -> `createNotification` | `p_user_id`, `p_type`, `p_slides` | إرسال إشعار جديد (خاص بالأدمن). |
| `smart_search` | `SmartSearch.tsx` -> `handleSearch` | `p_query` | البحث الذكي المتقدم في الخطوط والمجموعات. |

---

## 3. التعامل المباشر مع الجداول (Direct Table Queries - `.from(...)`)

هذه هي الأماكن التي تتصل مباشرة بالجداول عبر `.from(...)` لاستعلامات القراءة فقط (`SELECT`):

| اسم الجدول (`Table`) | الملف السطر | نوع العملية (`Query`) | الكود المكتوب | ملاحظات |
| :--- | :--- | :--- | :--- | :--- |
| `groups` | `src/services/groupService.ts` | `SELECT` | `supabase.from('groups').select('*').order('created_at', { ascending: false })` | جلب قائمة المجموعات للكل. |
| `groups` | `src/pages/GroupDetails.tsx` | `SELECT` | `supabase.from('groups').select('*').eq('id', id).single()` | جلب تفاصيل مجموعة فردية بمُعرّفها. |
| `fonts` | `src/pages/FontsPage.tsx` | `SELECT` | `supabase.from('fonts').select('group_id').eq('id', res.id).single()` | الاستعلام عن `group_id` لخط عند استلام تحديث Realtime. |
| `font_weights` | `src/services/fontService.ts` | `SELECT` | `supabase.from('font_weights').select('parent_font_id, child_font_id')` | جلب العلاقات بين الخطوط وأوزانها للقراءة فقط. |

> **ملاحظة هامّة:** تم إلغاء جميع استدعاءات الحذف والتعديل المباشر (`.delete()` / `.update()`) من العميل بالكامل وتحويلها إلى دوال آمنة مخزنة (`RPC`) على الباك إند.

---

## 4. مستوعبات الملفات والرفع (Supabase Storage)

| اسم الـ Bucket | الملف والفرع | نوع العملية (`Storage Method`) | الخيارات والمسار (`Options & Path`) |
| :--- | :--- | :--- | :--- |
| `fonts` | `src/services/fontService.ts` (`uploadFontToGroup`) | `.upload(fileName, file, { upsert: false })` | رفع ملف الخط إلى مجلد `fonts`. |
| `fonts` | `src/services/fontService.ts` (`uploadFontToGroup`) | `.getPublicUrl(fileName)` | استخراج الرابط العام لملف الخط بعد الرفع. |
| `fonts` | `src/services/fontService.ts` (`uploadFontWeight`) | `.upload(fileName, file, { upsert: false })` | رفع ملف وزن خط جديد. |
| `fonts` | `src/services/fontService.ts` (`uploadFontWeight`) | `.getPublicUrl(fileName)` | استخراج الرابط العام لوزن الخط. |
| `notifications` | `src/services/notificationService.ts` (`uploadNotificationImage`) | `.upload(fileName, file, { upsert: false })` | رفع صور شرائح الإشعارات. |
| `notifications` | `src/services/notificationService.ts` (`uploadNotificationImage`) | `.getPublicUrl(fileName)` | استخراج الرابط العام لصور الإشعارات. |

---

## 5. الاشتراكات اللحظية والتحديث المباشر (Supabase Realtime)

| القناة (`Channel Name`) | الحدث المستمع إليه (`Event`) | الملف | التفاصيل |
| :--- | :--- | :--- | :--- |
| `public:fonts` | `postgres_changes` على جدول `fonts` (`*`) | `src/pages/FontsPage.tsx` | الاستماع لأي إضافة، تعديل، أو حذف في جدول الخطوط لإعادة جلب البيانات تلقائيًا. |

---

## 6. ملخص وملاحظات هامة للربط مع الباك إند (Back-End Consistency Audit)

1. **الاعتماد الكلي على الـ RPC للعمليات الحساسة (`100% RPC for Mutations`)**:
   - لا يوجد أي استدعاء `.delete()` أو `.update()` مباشر على الجداول من واجهة الفرونت إند.
   - **حذف وتعديل الخطوط والأوزان**: يتم دائماً من خلال `manage_font_smart` مع الإجراء `delete` أو `update`.
   - **حذف وتعديل المجموعات**: يتم عبر `manage_group_smart`.
   - **إدارة الإشعارات**: يتم الحذف عبر `manage_notification` / `delete_notification` RPC.
2. **استعلامات القراءة فقط (`Read-Only SELECTs`)**:
   - اقتصر استخدام `.from(...)` فقط على القراءة السريعة (`SELECT`) للمجموعات وعلاقات الأوزان (`font_weights`).
3. **الرفع المباشر لـ Storage مع (`upsert: false`)**:
   - جميع عمليات الرفع لـ `fonts` و `notifications` تستخدم `{ upsert: false }` للحفاظ على توافق صلاحيات `INSERT` للعضو العادي بدون الحاجة لـ `UPDATE`.
