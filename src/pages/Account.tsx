import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogOut, Settings, Globe, Loader2, Send, Instagram, Mail, Eye, EyeOff, Bell } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Modal } from '../components/ui/Modal';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { FadeSection } from '../components/FadeSection';
import { truncateEmail } from '../utils/text';
import { getUserNotificationPreferences, updateUserNotificationPreferences } from '../services/notificationService';

const PREFS_KEY = 'fontat_notification_prefs';

export const Account = () => {
  const { user } = useAuth();
  const { setLanguage, language, t, dir } = useLanguage();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // Login State
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

  const handleAuth = async (e: React.FormEvent) => {
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
    <FadeSection className="pt-4 pb-20">
      <div className="w-full max-w-2xl lg:max-w-4xl mx-auto mt-10 px-4">
        {user ? (
          <>
            <div className="bg-[#141414] rounded-[2rem] p-6 border border-white/5 text-center mb-4">
              <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-4xl font-bold text-white border border-white/10 mx-auto mb-4">
                <Mail className="w-10 h-10 opacity-70" />
              </div>
              <h3 className="text-xl font-bold text-white mb-1 px-4" title={user.email}>
                {user.email ? truncateEmail(user.email) : ''}
              </h3>
              <p className="text-white/40 text-sm flex items-center justify-center gap-1.5">
                <span>{language === 'ar' ? 'تاريخ الانضمام:' : 'Joined:'}</span>
                <span dir="ltr" className="font-mono mt-0.5">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-GB') : '...'}</span>
              </p>
            </div>

            <div className="space-y-3 mb-8">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-[#141414] border border-white/5 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/5 p-2.5 rounded-xl text-white/70 group-hover:text-white transition-all">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium text-white/70 group-hover:text-white transition-colors">{t('settings.title')}</span>
                </div>
              </button>

              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-[#141414] border border-white/5 hover:bg-red-500/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-red-500/10 p-2.5 rounded-xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <LogOut className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium text-white/70 group-hover:text-red-400 transition-colors">Sign Out</span>
                </div>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="bg-[#141414] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl mb-8">
              <h3 className="text-xl font-bold text-white mb-6 text-center">
                {isSignUp ? t('login.signup') : t('login.submit')}
              </h3>
              
              {error && (
                <div className="bg-red-500/10 text-red-500 p-3 rounded-xl text-sm mb-4 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleAuth} className="space-y-4">
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all text-sm"
                    placeholder={t('login.email_placeholder')}
                    required
                  />
                </div>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all text-sm ${dir === 'rtl' ? 'pl-12 pr-5' : 'pr-12 pl-5'}`}
                    placeholder={t('login.password_placeholder')}
                    required
                  />
                  {password.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center text-white/50 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10 ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black py-3 rounded-2xl font-bold text-base hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSignUp ? t('login.signup') : t('login.submit')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-white/40 hover:text-white text-xs transition-colors flex items-center justify-center gap-1 mx-auto"
                >
                  <span>{isSignUp ? t('login.have_account_text') : t('login.no_account_text')}</span>
                  <span className="underline underline-offset-2">{isSignUp ? t('login.login_action') : t('login.register_action')}</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-8">
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-[#141414] border border-white/5 hover:bg-white/5 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/5 p-2.5 rounded-xl text-white/70 group-hover:text-white transition-all">
                    <Settings className="w-5 h-5" />
                  </div>
                  <span className="text-base font-medium text-white/70 group-hover:text-white transition-colors">{t('settings.title')}</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* Telegram CTA */}
        <div className="mt-8">
          <a href="https://t.me/ElgharibFonts" target="_blank" rel="noopener noreferrer" className="group block w-full bg-[#141414] border border-white/10 p-4 rounded-2xl text-center font-medium text-white/80 hover:border-white/20 hover:text-white transition-all">
            <div className="flex items-center justify-center gap-2">
              <Send className="w-5 h-5 text-cyan-400" />
              <span>{language === 'ar' ? 'انضم لقناتنا على تليجرام' : 'Join our Telegram Channel'}</span>
            </div>
          </a>
        </div>

        {/* Social Icons */}
        <div className="mt-8 flex justify-center gap-6 opacity-70">
          <a href="#" className="hover:text-cyan-400 transition-colors">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="#" className="hover:text-cyan-400 transition-colors"><Instagram className="w-6 h-6" /></a>
          <a href="mailto:your@email.com" className="hover:text-cyan-400 transition-colors"><Mail className="w-6 h-6" /></a>
        </div>
      </div>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title={t('settings.title')}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-white/60" />
              <span className="text-white font-medium">{t('settings.language')}</span>
            </div>
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
            >
              {language === 'ar' ? 'English' : 'العربية'}
            </button>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/5 overflow-hidden">
             <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-black/20">
                <Bell className="w-5 h-5 text-white/60" />
                <span className="text-white font-medium">إعدادات الإشعارات</span>
             </div>
             
             <div className="p-2">
                {[
                  { key: 'updates', title: 'تحديثات المنصة (Updates)', desc: 'تغييرات وميزات جديدة في الموقع' },
                  { key: 'alerts', title: 'تنبيهات هامة (Alerts)', desc: 'إشعارات هامة وتنبيهات أمنية' },
                  { key: 'info', title: 'معلومات ونصائح (Info)', desc: 'أخبار وشروحات تهمك' }
                ].map((item) => (
                   <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div>
                         <div className="text-white text-sm font-medium">{item.title}</div>
                         <div className="text-white/40 text-xs mt-0.5">{item.desc}</div>
                      </div>
                      <button 
                         onClick={() => togglePref(item.key as keyof typeof prefs)}
                         disabled={savingPrefs}
                         className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${prefs[item.key as keyof typeof prefs] ? 'bg-blue-500' : 'bg-white/20'} ${savingPrefs ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                         <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${prefs[item.key as keyof typeof prefs] ? (dir === 'rtl' ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'}`} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-white/20 text-xs">Version 1.0.0</p>
          </div>
        </div>
      </Modal>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        title={t('auth.logout') || 'Sign Out'}
        message={t('auth.logout_confirm') || 'Are you sure you want to sign out?'}
        confirmText={t('auth.logout') || 'Sign Out'}
        variant="danger"
      />
    </FadeSection>
  );
};
