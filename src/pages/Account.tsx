import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, Settings, Loader2, Instagram, Mail, Eye, EyeOff, Bell, ChevronDown, ChevronUp, Shield, Key, Trash2, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { FadeSection } from '../components/FadeSection';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../services/notificationService';

const PREFS_KEY = 'fontat_notification_prefs';

export const Account = () => {
  const { user } = useAuth();
  const { language, t, dir, setLanguage } = useLanguage();
  
  // Settings State
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isNotificationSettingsExpanded, setIsNotificationSettingsExpanded] = useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Login State
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Notification Preferences
  const [prefs, setPrefs] = useState({ updates: true, alerts: true, info: true });
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
             if (stored) setPrefs(JSON.parse(stored));
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
    if (user) {
      supabase.from('profiles').select('created_at').eq('id', user.id).single().then(({data}) => {
        setProfile(data);
      });
    }
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="pt-4 pb-20 relative overflow-hidden">
      <div className="w-full max-w-xl mx-auto mt-10 px-4 relative z-10">
        {user ? (
          <>
            {/* Redesigned User Card -> Free float */}
            <div className="relative flex flex-col items-center justify-center text-center mb-8 mt-6">
              {/* Avatar */}
              <div className="relative w-24 h-24 bg-white/[0.02] rounded-full p-1 shadow-2xl border border-white/10 mb-4 backdrop-blur-[40px] backdrop-saturate-[200%]">
                <div className="w-full h-full bg-gradient-to-br from-white/10 to-transparent rounded-full flex items-center justify-center text-white border border-white/5">
                  <Mail className="w-10 h-10 opacity-80" />
                </div>
              </div>

              {/* Info */}
              <h3 className="text-xl font-medium text-white mb-2 break-all px-4 max-w-sm">
                {user.email || ''}
              </h3>

              {/* Ranks / Badges */}
              <div className="flex gap-2 items-center justify-center mt-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-white opacity-80 text-xs font-semibold backdrop-blur-md border border-white/10 uppercase tracking-wider">
                  {user.app_metadata?.role === 'admin' || user.email === 'thameralsatam@gmail.com' ? (language === 'ar' ? 'مدير النظام' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'Member')}
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold backdrop-blur-md border border-cyan-500/20">
                  {profile?.created_at ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(profile.created_at)) : '2024'}
                </span>
              </div>
            </div>

            {/* Curved Separator */}
            <div className="relative w-full h-[40px] flex justify-center overflow-hidden mb-6">
              <svg className="absolute top-0 w-[150%] max-w-[800px] h-[100px] pointer-events-none" viewBox="0 0 1000 100" preserveAspectRatio="none">
                <path d="M0,0 Q500,80 1000,0" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
              </svg>
            </div>

            <div className="relative z-10 mb-10 w-full max-w-md mx-auto flex flex-col gap-1">
              {/* Expandable Settings */}
              <div className="transition-all duration-300">
                <button 
                  onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2.5 rounded-xl text-white opacity-70 group-hover:text-white transition-all">
                      <Settings className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium text-white opacity-70 group-hover:text-white transition-colors">إعدادات الحساب</span>
                  </div>
                  <div className="text-white opacity-40 group-hover:opacity-70 transition-colors">
                    {isSettingsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

            {/* Settings Content */}
                <div className={`transition-all duration-300 ease-in-out ${isSettingsExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-3 pt-0 space-y-1 border-t border-white/5">
                    
                    <div className="h-[1px] w-full bg-white/5 my-1" />

                    {/* Notification Settings Accordion */}
                    <div>
                      <button 
                        onClick={() => setIsNotificationSettingsExpanded(!isNotificationSettingsExpanded)}
                        className="w-full p-3 flex items-center justify-between hover:bg-white/5 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-white opacity-60" />
                          <span className="text-white text-sm font-medium">إعدادات الإشعارات</span>
                        </div>
                        {isNotificationSettingsExpanded ? <ChevronUp className="w-4 h-4 text-white opacity-40" /> : <ChevronDown className="w-4 h-4 text-white opacity-40" />}
                      </button>
                      
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isNotificationSettingsExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <div className="p-2 pl-4 border-l border-white/10 ml-4 space-y-1 mt-1">
                          {[
                            { key: 'updates', title: 'تحديثات المنصة', desc: 'تغييرات وميزات جديدة في الموقع' },
                            { key: 'alerts', title: 'تنبيهات هامة', desc: 'إشعارات هامة وتنبيهات أمنية' },
                            { key: 'info', title: 'معلومات ونصائح', desc: 'أخبار وشروحات تهمك' }
                          ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                                <div>
                                  <div className="text-white opacity-90 text-sm">{item.title}</div>
                                  <div className="text-white opacity-40 text-[11px] mt-0.5">{item.desc}</div>
                                </div>
                                <button 
                                  onClick={() => togglePref(item.key as keyof typeof prefs)}
                                  disabled={savingPrefs}
                                  className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs[item.key as keyof typeof prefs] ? 'bg-cyan-500' : 'bg-white/20'} ${savingPrefs ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[item.key as keyof typeof prefs] ? (dir === 'rtl' ? '-translate-x-4' : 'translate-x-4') : 'translate-x-0'}`} />
                                </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings Accordion */}
              <div className="transition-all duration-300">
                <button 
                  onClick={() => setIsSecurityExpanded(!isSecurityExpanded)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 rounded-2xl transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 p-2.5 rounded-xl text-white opacity-70 group-hover:text-white transition-all">
                      <Shield className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium text-white opacity-70 group-hover:text-white transition-colors">إعدادات الأمان</span>
                  </div>
                  <div className="text-white opacity-40 group-hover:opacity-70 transition-colors">
                    {isSecurityExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* Security Content */}
                <div className={`transition-all duration-300 ease-in-out ${isSecurityExpanded ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                  <div className="p-3 space-y-1 border-t border-white/5">
                    
                    {/* Change Password */}
                    <button className="w-full flex items-center p-3 hover:bg-white/5 rounded-xl transition-colors">
                      <div className="flex items-center gap-3">
                        <Key className="w-4 h-4 text-white opacity-60" />
                        <span className="text-white opacity-90 text-sm">تغيير كلمة المرور</span>
                      </div>
                    </button>

                    <div className="h-[1px] w-full bg-white/5 my-1" />

                    {/* Delete Account */}
                    <button className="w-full flex items-center p-3 hover:bg-red-500/10 rounded-xl transition-colors group">
                      <div className="flex items-center gap-3">
                        <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                        <span className="text-red-400 group-hover:text-red-300 text-sm transition-colors">حذف الحساب</span>
                      </div>
                    </button>
                    
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <div className="transition-all duration-300">
               <button 
                  onClick={() => setIsLogoutModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 rounded-2xl transition-all group"
               >
                  <div className="flex items-center gap-4">
                    <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500/80 group-hover:bg-red-500 group-hover:text-white transition-all">
                      <LogOut className="w-5 h-5" />
                    </div>
                    <span className="text-base font-medium text-red-500/80 group-hover:text-red-500 transition-colors">{language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}</span>
                  </div>
               </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-[#0d0d0d] border border-white/5 p-8 sm:p-12 mb-8 shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
              
              <div className="relative z-10 mb-10 text-center">
                <div className="w-20 h-20 bg-[#121212] rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 shadow-xl relative">
                  <div className="absolute inset-0 rounded-full border border-white/5 animate-[spin_4s_linear_infinite]" style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }}></div>
                  <UserCircle2 className="w-10 h-10 text-white opacity-60" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t('login.submit')}
                </h3>
                <p className="text-white opacity-40 text-sm max-w-[260px] mx-auto">
                  {language === 'ar' ? 'سجل دخولك للوصول إلى خطوطك المفضلة وإعداداتك الخاصة.' : 'Sign in to access your favorite fonts and custom settings.'}
                </p>
              </div>
              
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm mb-6 text-center border border-red-500/20">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Google Login */}
                <button
                  onClick={handleGoogleLogin}
                  className="w-full bg-white text-black py-3.5 rounded-2xl font-bold text-base hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {language === 'ar' ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white opacity-40 text-sm">{language === 'ar' ? 'أو' : 'OR'}</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                {/* Email Login Expandable */}
                <div className="bg-[#080808]/50 border border-white/5 rounded-3xl transition-all duration-300">
                  <button 
                    onClick={() => setShowEmailLogin(!showEmailLogin)}
                    className="w-full py-4 text-white opacity-80 hover:text-white hover:bg-white/5 font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    {language === 'ar' ? 'المتابعة بالبريد الإلكتروني' : 'Continue with Email'}
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showEmailLogin ? 'rotate-180' : ''}`} />
                  </button>

                  <div className={`transition-all duration-300 ease-in-out ${showEmailLogin ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-5 pt-2">
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        <div>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 rounded-2xl border border-white/10 bg-black/50 text-white placeholder:text-white opacity-30 focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all text-sm"
                            placeholder={t('login.email_placeholder')}
                            required
                          />
                        </div>
                        <div className="relative group">
                          <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full px-5 py-3 rounded-2xl border border-white/10 bg-black/50 text-white placeholder:text-white opacity-30 focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all text-sm ${dir === 'rtl' ? 'pl-12 pr-5' : 'pr-12 pl-5'}`}
                            placeholder={t('login.password_placeholder')}
                            required
                          />
                          {password.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white opacity-50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                        
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-white/10 text-white border border-white/20 py-3 rounded-2xl font-medium text-sm hover:bg-white/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                          {isSignUp ? t('login.signup') : t('login.submit')}
                        </button>
                      </form>

                      <div className="mt-4 text-center">
                        <button
                          onClick={() => setIsSignUp(!isSignUp)}
                          className="text-white opacity-40 hover:text-white text-xs transition-colors flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>{isSignUp ? t('login.have_account_text') : t('login.no_account_text')}</span>
                          <span className="underline underline-offset-2">{isSignUp ? t('login.login_action') : t('login.register_action')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Language Switcher for Guest */}
            <div className="flex justify-center mt-6">
              <div className="relative flex bg-[#080808] border border-white/5 p-1 rounded-2xl shadow-xl w-[180px]" dir="ltr">
                <div 
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shadow-md"
                  style={{
                    transform: language === 'en' ? 'translateX(0)' : 'translateX(calc(100% + 4px))',
                    left: '2px'
                  }}
                />
                <button 
                  onClick={() => setLanguage('en')}
                  className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${language === 'en' ? 'text-black leading-none' : 'text-white opacity-50 hover:opacity-100 leading-none'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('ar')}
                  className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300 ${language === 'ar' ? 'text-black' : 'text-white opacity-50 hover:opacity-100'}`}
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