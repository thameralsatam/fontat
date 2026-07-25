import { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Upload, AlertTriangle, Info, Check, X, LogIn, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../contexts/GlobalContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppNotifications } from '../contexts/NotificationContext';
import { Logo } from './Logo';
import { AdminNotificationModal } from './ui/AdminNotificationModal';
import { AppNotificationModal } from './ui/AppNotificationModal';
import { NotificationsDropdown } from './ui/NotificationsDropdown';
import { Notification } from '../types';

const NotificationItem = ({ notification, onRemove }: { notification: any, onRemove: () => void }) => {
  const { t } = useLanguage();
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      className={`
        relative overflow-hidden backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-3 shadow-2xl w-64 sm:w-72 flex flex-col gap-2 transition-all duration-300
        ${notification.type === 'upload' ? 'bg-[#0d0d10]/95 text-blue-400' : 
          notification.type === 'warning' ? 'bg-[#0d0d10]/95 text-amber-400' : 
          notification.type === 'success' ? 'bg-[#0d0d10]/95 text-green-400' :
          notification.type === 'error' ? 'bg-[#0d0d10]/95 text-red-400' :
          'bg-[#0d0d10]/95 text-white'}
      `}
    >
      <div className="flex items-start justify-between gap-2 w-full">
        <div className="flex items-center gap-2 font-bold text-xs tracking-wider">
          <div className="p-1 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
            {notification.type === 'upload' && <Upload className="w-3.5 h-3.5 animate-bounce" />}
            {notification.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5" />}
            {notification.type === 'info' && <Info className="w-3.5 h-3.5" />}
            {notification.type === 'success' && <Check className="w-3.5 h-3.5" />}
            {notification.type === 'error' && <X className="w-3.5 h-3.5" />}
          </div>
          <span className="capitalize font-heading">
            {notification.type === 'upload' ? t('notif.uploading') : 
             notification.type === 'warning' ? t('notif.warning') : 
             notification.type === 'success' ? t('notif.success') :
             notification.type === 'error' ? t('notif.error') : t('notif.info')}
          </span>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="opacity-40 hover:opacity-100 p-1 hover:bg-white/5 rounded-full transition-all cursor-pointer shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
      
      {notification.message && notification.message !== 'Error' && notification.message !== 'خطأ' && (
        <p className="text-[11px] opacity-90 leading-relaxed font-sans font-medium px-0.5">
          {notification.message}
        </p>
      )}
      {notification.details && notification.message !== 'Error' && notification.message !== 'خطأ' && (
        <p className="text-[9px] opacity-60 mt-0.5 font-mono px-0.5 border-t border-white/5 pt-1 whitespace-pre-wrap">
          {notification.details}
        </p>
      )}
    </motion.div>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { dir, t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { notifications, removeNotification } = useGlobal();
  const { reloadNotifications } = useAppNotifications();
  const { user } = useAuth();
  
  // Notification Modals state
  const [selectedAppNotification, setSelectedAppNotification] = useState<Notification | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const isAdmin = user?.user_metadata?.role === 'admin';
  const [isNavHidden, setIsNavHidden] = useState(false);

  useEffect(() => {
    const checkNavState = () => {
      setIsNavHidden(document.body.classList.contains('hide-nav'));
    };
    checkNavState();

    const observer = new MutationObserver(checkNavState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

    window.addEventListener('nav-toggle', checkNavState);
    return () => {
      observer.disconnect();
      window.removeEventListener('nav-toggle', checkNavState);
    };
  }, []);

  const WHITE = "#ffffff";
  const DIM = "rgba(255,255,255,0.28)";

  const navItems = [
    {
      id: '/',
      label: t('nav.home'),
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? WHITE : DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 11L12 3l9 8v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>
        </svg>
      )
    },
    {
      id: '/fonts',
      label: t('nav.public_fonts'),
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? WHITE : DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="7" x2="20" y2="7"/>
          <line x1="4" y1="12" x2="20" y2="12"/>
          <line x1="4" y1="17" x2="14" y2="17"/>
        </svg>
      )
    },
    {
      id: '/lab',
      label: t('nav.lab'),
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? WHITE : DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4.5 3h15M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3M6 14h12"/>
        </svg>
      )
    },
    {
      id: '/my-fonts',
      label: t('nav.my_fonts'),
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? WHITE : DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/>
          <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/>
          <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>
          <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>
        </svg>
      )
    },
    {
      id: '/account',
      label: t('nav.account'),
      icon: (isActive: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={isActive ? WHITE : DIM} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="7" r="4"/>
          <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7"/>
        </svg>
      )
    }
  ];
  
  useEffect(() => {
    window.scrollTo(0, 0);

    // التحقق من وجود تحديثات في الخلفية عند التنقل بين الصفحات لضمان التحديث التلقائي دون إزعاج المستخدم
    const getRunningVersion = () => {
      const script = document.querySelector('script[src*="v="]');
      if (script) {
        const match = script.getAttribute('src')?.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
      }
      const link = document.querySelector('link[href*="v="]');
      if (link) {
        const match = link.getAttribute('href')?.match(/[?&]v=([^&]+)/);
        if (match) return match[1];
      }
      return null;
    };

    const checkAppUpdate = async () => {
      try {
        const runningVersion = getRunningVersion();
        if (!runningVersion) return; // في البيئة المحلية للتطوير لن يكون هناك v= وبالتالي لن يحدث شيء

        // جلب ملف الـ index.html مع تجاوز كاش المتصفح عبر علامة زمنية فريدة
        const res = await fetch(`/index.html?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const html = await res.text();

        // استخراج رقم الإصدار من ملف index.html المجلوب حديثاً من السيرفر بشكل مرن لأي ملف أصول (Assets)
        const match = html.match(/(?:src|href)="[^"]*?\?v=([a-zA-Z0-9._-]+)"/);

        if (match && match[1]) {
          const serverVersion = match[1];
          if (serverVersion !== runningVersion) {
            console.log(`[Update Checker] New version detected: ${serverVersion} (Current: ${runningVersion}). Reloading...`);
            // إعادة تحميل الصفحة بسلاسة لتطبيق التحديث الجديد فوراً للمستخدم أثناء تنقله
            window.location.reload();
          }
        }
      } catch (err) {
        console.error('Error checking for updates:', err);
      }
    };

    // منع تكرار الطلب في غضون 30 ثانية لتوفير استهلاك البيانات والأداء
    const now = Date.now();
    const lastCheck = sessionStorage.getItem('fontat_last_update_check');
    const lastCheckTime = lastCheck ? parseInt(lastCheck, 10) : 0;

    if (now - lastCheckTime > 30000) {
      sessionStorage.setItem('fontat_last_update_check', now.toString());
      checkAppUpdate();
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="min-h-screen bg-[#080808] text-white flex flex-col font-sans selection:bg-white/20 overflow-x-hidden" 
      dir={dir}
    >
      
       {/* Persistent Notifications - Top Corner */}
       <div className={`fixed top-4 z-[999] flex flex-col gap-2 pointer-events-auto ${dir === 'rtl' ? 'left-4' : 'right-4'}`}>
         <AnimatePresence>
           {notifications.map(notification => (
             <NotificationItem 
               key={notification.id} 
               notification={notification} 
               onRemove={() => removeNotification(notification.id)}
             />
           ))}
         </AnimatePresence>
       </div>

      {/* Header - Fixed Glass Header with Desktop Floating Dock */}
      <header 
        className={`fixed top-0 left-0 right-0 z-[100] h-20 px-6 sm:px-8 flex items-center justify-between transition-all duration-300 bg-[#080808]/90 backdrop-blur-xl border-b ${
          isScrolled ? 'border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.6)]' : 'border-transparent'
        } ${isNavHidden ? 'hidden' : ''}`}
      >
        {/* Left Container (Logo + Login) */}
        <div className="flex-1 flex items-center justify-start gap-4 lg:gap-6 pointer-events-none">
          {/* Logo - Always shown on desktop, and shown on mobile when in LTR */}
          <div className={dir === 'ltr' ? 'block' : 'hidden lg:block'}>
            <Link to="/" className="block relative z-[10] pointer-events-auto transition-transform hover:scale-105 active:scale-95">
              <div className="w-[125px] h-fit flex items-center justify-center">
                <Logo className="w-full h-auto text-white" id="header-logo-desktop" />
              </div>
            </Link>
          </div>

          {/* Login Button */}
          {!user && (
            <div className="pointer-events-auto">
              <Link 
                to="/account" 
                className="flex items-center justify-center h-10 w-10 sm:w-auto sm:px-4 gap-2 text-xs font-semibold text-white bg-[#080808] hover:bg-[#121212] border border-white/20 hover:border-white/40 rounded-full transition-all duration-300 backdrop-blur-sm shadow-sm active:scale-95"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:block">{dir === 'rtl' ? 'دخول' : 'Login'}</span>
              </Link>
            </div>
          )}
        </div>

        {/* Center Container (Mobile Logo / Desktop Nav Dock) */}
        <div className="flex items-center justify-center pointer-events-none lg:pointer-events-auto shrink-0 px-2">
          {/* Mobile Logo (Only shown in RTL layout) */}
          <div className={`lg:hidden ${dir === 'ltr' ? 'hidden' : 'block'}`}>
            <Link to="/" className="block relative z-[10] pointer-events-auto">
              <div className="w-[120px] h-fit flex items-center justify-center">
                <Logo className="w-full h-auto text-white" id="header-logo-mobile" />
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Floating Dock */}
          <nav className="hidden lg:flex items-center p-1.5 rounded-full bg-[#121217]/85 border border-white/10 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] gap-1 relative">
            {navItems.map(({ id, label, icon }) => {
              const isActive = location.pathname === id;
              return (
                <Link
                  key={id}
                  to={id}
                  className={`relative px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all duration-200 select-none group ${
                    isActive
                      ? 'text-white font-semibold'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="desktop-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                      className="absolute inset-0 bg-white/10 border border-white/20 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                    {icon(isActive)}
                  </span>
                  <span className="relative z-10 whitespace-nowrap">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Container (Language Switcher + Notifications) */}
        <div className="flex-1 flex justify-end items-center gap-3 pointer-events-auto">
          {/* Language Toggle Button */}
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="hidden sm:flex items-center justify-center h-10 px-3.5 gap-1.5 rounded-full bg-[#080808] hover:bg-[#121212] border border-white/20 hover:border-white/40 text-xs font-medium text-white/90 hover:text-white transition-all duration-300 cursor-pointer active:scale-95 shadow-sm backdrop-blur-sm"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          <NotificationsDropdown 
             isAdmin={isAdmin} 
             onOpenNotification={(n) => setSelectedAppNotification(n)} 
             onOpenAdminPanel={() => setIsAdminModalOpen(true)}
          />
        </div>
      </header>
      
      {/* Main Content */}
      <main 
        className="flex-1 pt-28 pb-24 w-full"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="pt-8 pb-32 mt-auto relative overflow-hidden bg-black/40 border-t border-white/5">
        <div className="mx-auto px-6 w-full max-w-4xl flex flex-col items-center text-center">

          <p className="text-white opacity-40 text-sm font-light leading-relaxed max-w-xl mb-8 mt-2">
            {t('layout.initiative_desc')}
          </p>

          <div className="flex items-center justify-center w-full max-w-[240px] mb-8 opacity-20">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/50"></div>
            <div className="mx-4 transform rotate-45 w-1.5 h-1.5 bg-white/50"></div>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/50"></div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-white opacity-50 mb-10">
            <Link to="/about" className="hover:text-white hover:opacity-100 transition-colors">{t('layout.about_initiative')}</Link>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20"></div>
            <Link to="/terms" className="hover:text-white hover:opacity-100 transition-colors">{t('layout.terms')}</Link>
            <div className="hidden sm:block w-1 h-1 rounded-full bg-white/20"></div>
            <Link to="/privacy" className="hover:text-white hover:opacity-100 transition-colors">{t('layout.privacy')}</Link>
          </div>

          <p className="text-white opacity-30 text-xs font-light">
            <span dir="ltr">© {new Date().getFullYear()} FONTAT.</span> {t('layout.rights')}
          </p>
        </div>
      </footer>

       {/* CSS Animations for New Bottom Nav - Sleek elegant Frosted Glass */}
       <style>{`
         @keyframes bn-icon-enter {
           0%   { transform: scale(0.7); opacity: 0; }
           60%  { transform: scale(1.15); opacity: 1; }
           100% { transform: scale(1);    opacity: 1; }
         }
         @keyframes bn-active-bg-in {
           0% { opacity: 0; transform: scale(0.8) translateY(4px); }
           100% { opacity: 1; transform: scale(1) translateY(0); }
         }
         @keyframes bn-dot-expand {
           0%   { width: 3px;  opacity: 0; }
           60%  { width: 20px; opacity: 1; }
           100% { width: 16px; opacity: 1; }
         }
         @keyframes liquid-sweep {
           0% { transform: translateX(-150%) skewX(-15deg); }
           100% { transform: translateX(300%) skewX(-15deg); }
         }
         .bn-liquid-glass {
           position: absolute;
           top: 0; left: 0; right: 0; bottom: 0;
           border-radius: 24px;
         }
 
         .bn-liquid-glass::before {
           content: '';
           position: absolute;
           inset: 0;
           z-index: 0;
           overflow: hidden;
           border-radius: 24px;
           border: 1px solid rgba(255, 255, 255, 0.08);
           box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.4);
         }
 
         .bn-liquid-glass::after {
           content: '';
           position: absolute;
           z-index: -1;
           inset: 0;
           border-radius: 24px;
           backdrop-filter: blur(28px) saturate(180%);
           -webkit-backdrop-filter: blur(28px) saturate(180%);
           background-color: rgba(12, 12, 14, 0.15);
           overflow: hidden;
           isolation: isolate;
         }
       `}</style>
      
      {/* ── NAV WRAPPER ──────────────────────────────────────── */}
      {!isNavHidden && (
        <>
          <div className="fixed bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-[#080808] to-transparent z-[999] pointer-events-none lg:hidden"></div>
          <div 
            className="fixed z-[1000] lg:hidden left-1/2 -translate-x-1/2 w-full max-w-[420px] landscape:max-w-[480px] transition-all duration-300 outline-none px-4 pb-4 landscape:pb-1.5 bottom-0"
            style={{ paddingBottom: "max(10px, env(safe-area-inset-bottom))" }}
            dir={dir}
          >
            <div style={{ position: "relative", overflow: "visible" }}>

              {/* ── Bar liquid glass background ── */}
              <div className="bn-liquid-glass" />

              {/* ── Tabs row ── */}
              <div style={{
                position: "relative",
                display:  "flex",
                padding:  "8px 6px",
              }}>
                {navItems.map(({ id, icon, label }) => {
                  const isActive  = location.pathname === id;

                  return (
                    <Link
                      to={id}
                      key={id}
                      style={{
                        flex: 1,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "8px 4px 6px",
                        borderRadius: "9999px",
                        position: "relative",
                      }}
                      className="group outline-none"
                    >
                      {/* Active bg glow */}
                      {isActive && (
                        <div style={{
                          position: "absolute",
                          inset: "2px",
                          borderRadius: "9999px",
                          background: "rgba(255, 255, 255, 0.08)",
                          animation: "bn-active-bg-in 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards",
                        }} />
                      )}

                      {/* Icon */}
                      <div style={{
                        position: "relative", zIndex: 1,
                        filter: isActive
                          ? `drop-shadow(0 0 7px rgba(255,255,255,0.35))`
                          : "none",
                        transition: "filter 0.3s ease",
                        animation: isActive
                          ? "bn-icon-enter 0.42s cubic-bezier(0.34,1.4,0.64,1)"
                          : undefined,
                      }}>
                        {icon(isActive)}
                      </div>

                      {/* White indicator dot */}
                      <div style={{
                        height: "3px",
                        borderRadius: "2px",
                        background: isActive ? WHITE : "transparent",
                        boxShadow: isActive
                          ? `0 0 6px ${WHITE}, 0 0 14px rgba(255,255,255,0.35)`
                          : "none",
                        transition: "background 0.3s ease, box-shadow 0.3s ease",
                        animation: isActive ? "bn-dot-expand 0.42s cubic-bezier(0.34,1.4,0.64,1) forwards" : undefined,
                        width: isActive ? "16px" : "0px",
                      }} />
                      
                      {/* Hidden label for accessibility / semantics */}
                      <span className="sr-only">{label}</span>
                    </Link>
                  );
                })}
              </div>

            </div>
          </div>
        </>
      )}
      {/* ─────────────────────────────────────────────────────── */}

      {/* App Notification view modal */}
      <AppNotificationModal 
         isOpen={!!selectedAppNotification} 
         onClose={() => setSelectedAppNotification(null)}
         notification={selectedAppNotification}
         dir={dir}
      />

      {/* Admin Create Notification modal */}
      <AdminNotificationModal 
         isOpen={isAdminModalOpen}
         onClose={() => setIsAdminModalOpen(false)}
         onSuccess={() => reloadNotifications()}
      />
    </div>
  );
};
