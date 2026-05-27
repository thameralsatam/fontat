import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, Settings, Loader2, Mail, Eye, EyeOff, Bell, ChevronDown, ChevronUp, Shield, Key, Trash2, UserCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../services/notificationService';

const PREFS_KEY = 'fontat_notification_prefs';

const CRYSTAL_CSS = `
  @keyframes shimmer-sweep {
    0%   { left: -55%; }
    100% { left: 155%; }
  }
  @keyframes float-lock {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-4px); }
  }
  @keyframes soon-shimmer {
    0%   { background-position: -200% center; }
    100% { background-position:  200% center; }
  }
  @keyframes shake {
    0%,100% { transform: translateX(0);    }
    18%      { transform: translateX(-7px); }
    36%      { transform: translateX( 7px); }
    54%      { transform: translateX(-5px); }
    72%      { transform: translateX( 4px); }
    90%      { transform: translateX(-2px); }
  }
  @keyframes aurora {
    0%   { transform: translate(-50%,-50%) rotate(0deg)   scale(1);   }
    50%  { transform: translate(-50%,-50%) rotate(180deg) scale(1.4); }
    100% { transform: translate(-50%,-50%) rotate(360deg) scale(1);   }
  }
`;

const CustomLockIcon = () => (
  <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
    <rect x="2" y="11" width="18" height="12" rx="4" stroke="#ffffff" strokeWidth="1.5" fill="rgba(255,255,255,0.2)" />
    <path d="M6 11V8a5 5 0 0 1 10 0v3" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="11" cy="16.5" r="1.8" fill="#ffffff" />
    <rect x="10.2" y="16.5" width="1.6" height="2.8" rx="0.8" fill="#ffffff" />
  </svg>
);

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.251 17.64 11.945 17.64 9.2z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
  </svg>
);

const CrystalLockedGoogleButton = ({ language }: { language: string }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [shaking, setShaking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      const r = containerRef.current?.getBoundingClientRect();
      if (!r) return;
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      setTilt({ x: -dy * 15, y: dx * 15 });
    });
  }, []);

  const onMouseLeave = useCallback(() => setTilt({ x: 0, y: 0 }), []);

  const onClick = useCallback(() => {
    if (shaking) return;
    setShaking(true);
    setTimeout(() => setShaking(false), 560);
  }, [shaking]);

  const hue = 210 + tilt.y * 5;
  const iridescent = `radial-gradient(ellipse at ${50 + tilt.y * 9}% ${50 + tilt.x * 9}%, hsla(${hue},65%,68%,0.08) 0%, transparent 65%)`;

  return (
    <>
      <style>{CRYSTAL_CSS}</style>
      <div
        ref={containerRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onClick}
        style={{ position: "relative", cursor: "not-allowed", width: "100%", height: "54px" }}
      >
        <div style={{
          position: "absolute", inset: 0,
          borderRadius: "24px",
          zIndex: 10
        }}>
          <div style={{
            width: "100%", height: "100%",
            ...(shaking && { animation: "shake 0.56s ease" }),
          }}>
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "12px", padding: "14px 24px", width: "100%", height: "100%",
              background: "rgba(255, 255, 255, 0.7)",
              borderRadius: "24px",
              color: "#111111",
              fontSize: "15px", fontWeight: "700",
              userSelect: "none", pointerEvents: "none",
            }}>
              <GoogleIcon />
              {language === 'ar' ? 'المتابعة باستخدام جوجل' : 'Continue with Google'}
            </div>

            <div style={{
              position: "absolute", inset: 0,
              borderRadius: "24px",
              overflow: "hidden",
              background: "rgba(8,9,14,0.15)",
              backdropFilter: "blur(1.5px) saturate(1.2)",
              WebkitBackdropFilter: "blur(1.5px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.35), 0 14px 48px rgba(0,0,0,0.75), 0 2px 10px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
            }}>
              <div style={{
                position: "absolute", inset: 0,
                background: iridescent,
                transition: "background 0.18s ease",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute",
                width: "220px", height: "220px",
                top: "50%", left: "50%",
                background: "radial-gradient(circle, rgba(100,118,210,0.07) 0%, transparent 65%)",
                animation: "aurora 12s linear infinite",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", top: 0,
                left: "22%", right: "22%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)",
                pointerEvents: "none",
              }} />
              <div style={{
                position: "absolute", top: 0, bottom: 0,
                width: "32%",
                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.11) 50%, rgba(255,255,255,0.05) 60%, transparent)",
                transform: "skewX(-9deg)",
                animation: "shimmer-sweep 4.8s cubic-bezier(0.4,0,0.6,1) infinite",
                animationDelay: "1.8s",
                pointerEvents: "none",
              }} />
              
              <div style={{
                animation: "float-lock 3.6s ease-in-out infinite",
                position: "relative", zIndex: 2,
                filter: "drop-shadow(0 0 7px rgba(255,255,255,0.25))",
                transform: "scale(0.85)"
              }}>
                <CustomLockIcon />
              </div>
              <div style={{
                position: "relative", zIndex: 2,
                fontSize: "9px", fontWeight: 700,
                letterSpacing: "0.32em",
                background: "linear-gradient(90deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,1) 35%, rgba(255,255,255,1) 50%, rgba(255,255,255,1) 65%, rgba(255,255,255,0.5) 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: "soon-shimmer 2.6s linear infinite",
                marginTop: "2px"
              }}>
                 {language === 'ar' ? 'قريباً' : 'S O O N'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export const Account = () => {
  const { user } = useAuth();
  const { language, t, dir, setLanguage } = useLanguage();
  
  // Settings State
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const [isNotificationSettingsExpanded, setIsNotificationSettingsExpanded] = useState(false);
  const [isSecurityExpanded, setIsSecurityExpanded] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  
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
                  {user.user_metadata?.role === 'admin' ? (language === 'ar' ? 'مدير النظام' : 'Admin') : (language === 'ar' ? 'مستخدم' : 'Member')}
                </span>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-semibold backdrop-blur-md border border-cyan-500/20">
                  {user?.created_at ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(user.created_at)) : '2024'}
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
                {/* Google Login - Crystal Locked */}
                <CrystalLockedGoogleButton language={language} />

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

                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${showEmailLogin ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
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