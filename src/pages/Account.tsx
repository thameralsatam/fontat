import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, Loader2, Eye, EyeOff, Bell, ChevronDown, Key, UserCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { NotificationPreferences } from '../types';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../services/notificationService';

const PREFS_KEY = 'fontat_notification_prefs';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.251 17.64 11.945 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

export const Account = () => {
  const { user } = useAuth();
  const { language, t, dir, setLanguage } = useLanguage();
  
  // Settings State
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isNotificationExpanded, setIsNotificationExpanded] = useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Notification Preferences
  const [prefs, setPrefs] = useState<NotificationPreferences>({ all_notifications: true, updates: true, alerts: true, info: true, promotion: true });
  const [savingPrefs, setSavingPrefs] = useState(false);

  useEffect(() => {
    const fetchPrefs = async () => {
       if (user) {
          try {
             const userPrefs = await getUserNotificationPreferences(user.id);
             setPrefs(userPrefs);
          } catch (e) {
             console.error('Failed to load user preferences', e);
          }
       } else {
          try {
             const stored = localStorage.getItem(PREFS_KEY);
             if (stored) {
               const parsed = JSON.parse(stored);
               setPrefs(p => ({ ...p, ...parsed }));
             }
          } catch (e) {}
       }
    };
    fetchPrefs();
  }, [user]);

  const togglePref = async (key: keyof typeof prefs) => {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
    
    if (user) {
       setSavingPrefs(true);
       try {
          await updateUserNotificationPreferences(user.id, newPrefs);
       } catch (e) {
          console.error('Failed to save preferences', e);
       } finally {
          setSavingPrefs(false);
       }
    } else {
       localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    }
  };

  useEffect(() => {
    // profile fetch removed
  }, [user]);

  const handleLogout = () => supabase.auth.signOut();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-4 pb-20 relative overflow-hidden">
      <div className="w-full max-w-xl mx-auto mt-10 px-4 relative z-10">
        {user ? (
          <>
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center text-white/60 mb-3 shadow-inner">
                   <UserCircle2 className="w-8 h-8 opacity-75" />
                 </div>
                 <h3 className="text-lg font-medium text-white tracking-tight break-all max-w-sm mb-1">
                   {user.email || ''}
                 </h3>
                 <div className="flex gap-2 items-center justify-center">
                   <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-white/50 text-[11px] font-medium tracking-wide uppercase border border-white/5">
                     {user.user_metadata?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'Member')}
                   </span>
                   <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/5 text-cyan-400/80 text-[11px] font-medium border border-cyan-500/10">
                     {user?.created_at ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(user.created_at)) : '2024'}
                   </span>
                 </div>
              </div>

              {/* Accordions Group */}
              <div className="space-y-3">
                 
                 {/* ACCORDION 1: Notification Settings */}
                 <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setIsNotificationExpanded(!isNotificationExpanded)}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] active:bg-white/[0.01] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-white/60">
                           <Bell className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <span className="text-white text-sm font-medium">{language === 'ar' ? 'إعدادات الإشعارات' : 'Notification Settings'}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isNotificationExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${isNotificationExpanded ? 'max-h-[500px] border-t border-white/5 opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}>
                       <div className="p-5 space-y-4">
                          {/* Global Toggle */}
                          <div className="flex items-center justify-between pb-3 border-b border-white/5">
                             <div>
                                <div className="text-white/90 text-sm font-medium">{language === 'ar' ? 'تفعيل كافة الإشعارات' : 'Enable All Notifications'}</div>
                                <div className="text-white/40 text-[11px] mt-0.5">{language === 'ar' ? 'تمكين أو تعطيل استلام الإشعارات بشكل عام' : 'Enable or disable receiving notifications'}</div>
                             </div>
                             <button 
                                onClick={() => togglePref('all_notifications')}
                                disabled={savingPrefs}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${prefs.all_notifications ? 'bg-cyan-500' : 'bg-white/10'} ${savingPrefs ? 'opacity-50 cursor-not-allowed' : ''}`}
                             >
                                <span 
                                  className="pointer-events-none absolute h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200 ease-in-out" 
                                  style={{
                                    transform: prefs.all_notifications ? (dir === 'rtl' ? 'translateX(-16px)' : 'translateX(16px)') : 'translateX(0)',
                                    [dir === 'rtl' ? 'right' : 'left']: '2px'
                                  }}
                                />
                             </button>
                          </div>

                          <div className={`space-y-3 transition-opacity duration-300 ${!prefs.all_notifications ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                            {[
                              { key: 'updates', title: language === 'ar' ? 'تحديثات المنصة' : 'Platform Updates', desc: language === 'ar' ? 'إشعارات حول الميزات والتغييرات الجديدة' : 'Alerts about new features and changes' },
                              { key: 'info', title: language === 'ar' ? 'معلومات ونصائح' : 'Info & Tips', desc: language === 'ar' ? 'شروحات ومعلومات ونصائح قد تهمك' : 'Tips, guides, and useful information' },
                              { key: 'promotion', title: language === 'ar' ? 'رسائل ترويجية' : 'Promotional', desc: language === 'ar' ? 'عروض ورسائل ترويجية وتخفيضات' : 'Offers, promotions, and discounts' },
                              { key: 'alerts', title: language === 'ar' ? 'تنبيهات هامة' : 'Critical Alerts', desc: language === 'ar' ? 'تنبيهات أمنية هامة (دائماً نشطة)' : 'Important security alerts (always active)', isFixed: true }
                            ].map((item) => {
                              const isActive = item.isFixed ? true : prefs[item.key as keyof typeof prefs];

                              return (
                                <div key={item.key} className="flex items-center justify-between py-1 text-start">
                                    <div>
                                      <div className={`text-xs font-medium ${item.isFixed ? 'text-red-400' : 'text-white/85'}`}>{item.title}</div>
                                      <div className="text-white/40 text-[10px] mt-0.5">{item.desc}</div>
                                    </div>
                                    <button 
                                      onClick={() => !item.isFixed && togglePref(item.key as keyof typeof prefs)}
                                      disabled={savingPrefs || item.isFixed}
                                      className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isActive ? (item.isFixed ? 'bg-red-500/40' : 'bg-cyan-500/80') : 'bg-white/10'} ${(savingPrefs || item.isFixed) ? 'cursor-not-allowed' : ''}`}
                                    >
                                      <span 
                                        className="pointer-events-none absolute h-3 w-3 rounded-full bg-white shadow transition-transform duration-200 ease-in-out" 
                                        style={{
                                          transform: isActive ? (dir === 'rtl' ? 'translateX(-12px)' : 'translateX(12px)') : 'translateX(0)',
                                          [dir === 'rtl' ? 'right' : 'left']: '2px'
                                        }}
                                      />
                                    </button>
                                </div>
                              );
                            })}
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* ACCORDION 2: Security & Safety */}
                 <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl overflow-hidden transition-all duration-300">
                    <button 
                      onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                      className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] active:bg-white/[0.01] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-white/60">
                           <Key className="w-5 h-5 stroke-[1.5]" />
                        </div>
                        <span className="text-white text-sm font-medium">{language === 'ar' ? 'الأمان والحماية' : 'Security & Safety'}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-300 ${isSecurityExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    <div className={`transition-all duration-300 ease-in-out ${isSecurityExpanded ? 'max-h-[300px] border-t border-white/5 opacity-100' : 'max-h-0 opacity-0 overflow-hidden pointer-events-none'}`}>
                       <div className="p-5 space-y-4">
                          {/* Change Password */}
                          <div className="flex items-center justify-between py-1 text-start opacity-45">
                             <div>
                                <div className="text-white/80 text-xs font-medium">{language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</div>
                                <div className="text-white/40 text-[10px] mt-0.5">{language === 'ar' ? 'تحديث كلمة السر لحسابك' : 'Modify account password'}</div>
                             </div>
                             <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] text-white/45 tracking-wider font-semibold">
                                {language === 'ar' ? 'قريباً' : 'SOON'}
                             </span>
                          </div>

                          {/* Delete Account */}
                          <div className="flex items-center justify-between py-1 text-start opacity-45">
                             <div>
                                <div className="text-red-400/80 text-xs font-medium">{language === 'ar' ? 'حذف الحساب بصفة نهائية' : 'Delete Account Permanently'}</div>
                                <div className="text-white/40 text-[10px] mt-0.5">{language === 'ar' ? 'إزالة كافة البيانات المخزنة لدينا' : 'Erase all personal metadata'}</div>
                             </div>
                             <span className="bg-red-500/10 px-2 py-0.5 rounded text-[9px] text-red-400/50 tracking-wider font-semibold">
                                {language === 'ar' ? 'قريباً' : 'SOON'}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>

              </div>

              {/* Minimalist Log Out Button */}
              <button 
                 onClick={() => setIsLogoutModalOpen(true)}
                 className="w-full p-4 bg-[#0a0a0a]/85 border border-white/5 rounded-3xl text-sm font-medium text-red-400/80 hover:text-red-300 hover:bg-red-500/[0.03] active:bg-red-500/[0.01] transition-all flex items-center justify-center gap-2"
              >
                 <LogOut className="w-4 h-4 stroke-[1.5]" />
                 <span>{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              {/* Guest Profile Card */}
              <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-white/[0.02] border border-white/10 rounded-full flex items-center justify-center text-white/50 mb-3 shadow-inner">
                   <UserCircle2 className="w-8 h-8 opacity-75" />
                 </div>
                 <h3 className="text-lg font-medium text-white tracking-tight mb-1">
                   {isSignUp ? (language === 'ar' ? 'إنشاء حساب جديد' : 'Create New Account') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                 </h3>
                 <p className="text-white/40 text-xs max-w-[280px]">
                   {language === 'ar' ? 'سجل دخولك للوصول إلى خطوطك المفضلة وإعداداتك الخاصة.' : 'Sign in to access your favorite fonts and custom settings.'}
                 </p>
              </div>

              {/* Minimalist Google Auth Card (Moved up) */}
              <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl p-4 flex items-center justify-between opacity-40 cursor-not-allowed select-none">
                <div className="flex items-center gap-3">
                  <GoogleIcon />
                  <span className="text-white text-xs font-medium">{language === 'ar' ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}</span>
                </div>
                <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] text-white/45 tracking-wider font-semibold">
                   {language === 'ar' ? 'قريباً' : 'SOON'}
                </span>
              </div>

              {/* Login/Signup Core Card */}
              <div className="bg-[#0a0a0a]/85 border border-white/5 rounded-3xl p-6 space-y-4">
                {error && (
                  <div className="bg-red-500/10 text-red-400 text-xs p-3 rounded-2xl text-center border border-red-500/10">
                    {error}
                  </div>
                )}

                <form onSubmit={handleEmailAuth} className="space-y-3">
                  <div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/10 focus:border-cyan-500/30 focus:bg-[#0c0c0c] focus:ring-0 outline-none transition-all text-sm"
                      placeholder={language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full px-4 py-3 rounded-2xl border border-white/5 bg-white/[0.02] text-white placeholder:text-white/30 hover:border-white/10 focus:border-cyan-500/30 focus:bg-[#0c0c0c] focus:ring-0 outline-none transition-all text-sm ${dir === 'rtl' ? 'pl-11 pr-4' : 'pr-11 pl-4'}`}
                      placeholder={language === 'ar' ? 'كلمة المرور' : 'Password'}
                      required
                    />
                    {password.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5 ${dir === 'rtl' ? 'left-3.5' : 'right-3.5'}`}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-white hover:bg-white/95 text-black py-3 rounded-2xl font-medium text-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {isSignUp ? (language === 'ar' ? 'إنشاء الحساب' : 'Create Account') : (language === 'ar' ? 'تسجيل الدخول' : 'Sign In')}
                  </button>
                </form>

                <div className="text-center pt-2 border-t border-white/5">
                  <button
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-white/40 hover:text-white/60 text-[11px] transition-colors flex items-center justify-center gap-1 mx-auto"
                  >
                    <span>{isSignUp ? (language === 'ar' ? 'تمتلك حساباً بالفعل؟' : 'Have an account?') : (language === 'ar' ? 'ليس لديك حساب؟' : 'Don\'t have an account?')}</span>
                    <span className="underline underline-offset-2">{isSignUp ? (language === 'ar' ? 'سجل دخولك' : 'Sign In') : (language === 'ar' ? 'أنشئ حساباً' : 'Sign Up')}</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Language Switcher for Guest */}
            <div className="flex justify-center mt-6">
              <div className="relative flex bg-[#0a0a0a]/85 border border-white/5 p-1 rounded-2xl shadow-xl w-[180px]" dir="ltr">
                <div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md"
                  style={{
                    transform: language === 'en' ? 'translateX(0)' : 'translateX(calc(100% + 4px))',
                    left: '2px'
                  }}
                />
                <button 
                  onClick={() => setLanguage('en')}
                  className={`relative z-10 flex-1 py-1.5 text-xs font-medium transition-colors duration-300 cursor-pointer ${language === 'en' ? 'text-black font-semibold' : 'text-white opacity-50 hover:opacity-100'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('ar')}
                  className={`relative z-10 flex-1 py-1.5 text-xs font-medium transition-colors duration-300 cursor-pointer ${language === 'ar' ? 'text-black font-semibold' : 'text-white opacity-50 hover:opacity-100'}`}
                >
                  عربي
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title={t('auth.logout') || 'Sign Out'}
        message={t('auth.logout_confirm') || 'Are you sure you want to sign out?'}
        confirmText={t('auth.logout') || 'Sign Out'}
        variant="danger"
      />
    </div>
  );
};