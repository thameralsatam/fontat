import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Upload, AlertTriangle, Info, Check, X, LogIn, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../contexts/GlobalContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppNotifications } from '../contexts/NotificationContext';
import { Logo } from './Logo';
import { AdminNotificationModal } from './ui/AdminNotificationModal';
import { AppNotificationModal } from './ui/AppNotificationModal';
import { NotificationsDropdown } from './ui/NotificationsDropdown';
import { Notification } from '../types';

const NotificationItem = ({ notification, onToggle, onRemove }: { notification: any, onToggle: () => void, onRemove: () => void }) => {
  const isExpanded = notification.isExpanded;
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 20 }}
      className={`
        relative overflow-hidden backdrop-blur-xl border transition-all duration-300 cursor-pointer shadow-2xl
        ${isExpanded ? 'w-64 p-4 rounded-2xl' : 'w-10 h-10 rounded-full flex items-center justify-center'}
        ${notification.type === 'upload' ? 'bg-blue-500/10 border-blue-500/20 text-blue-500' : 
          notification.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
          notification.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' :
          notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
          'bg-white/10 border-white/20 text-white'}
      `}
      onClick={onToggle}
    >
      {/* Icon View (Collapsed) */}
      {!isExpanded && (
        <div className="absolute inset-0 flex items-center justify-center">
          {notification.type === 'upload' && <Upload className="w-4 h-4 animate-pulse" />}
          {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
          {notification.type === 'info' && <Info className="w-4 h-4" />}
          {notification.type === 'success' && <Check className="w-4 h-4" />}
          {notification.type === 'error' && <X className="w-4 h-4" />}
        </div>
      )}

      {/* Expanded View */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="flex flex-col gap-2"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                {notification.type === 'upload' && <Upload className="w-4 h-4" />}
                {notification.type === 'warning' && <AlertTriangle className="w-4 h-4" />}
                {notification.type === 'info' && <Info className="w-4 h-4" />}
                {notification.type === 'success' && <Check className="w-4 h-4" />}
                {notification.type === 'error' && <X className="w-4 h-4" />}
                <span>
                  {notification.type === 'upload' ? 'Uploading' : 
                   notification.type === 'warning' ? 'Warning' : 
                   notification.type === 'success' ? 'Success' :
                   notification.type === 'error' ? 'Error' : 'Info'}
                </span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="opacity-50 hover:opacity-100 p-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            
            {notification.message && notification.message !== 'Error' && notification.message !== 'خطأ' && (
              <p className="text-xs opacity-80 leading-relaxed">
                {notification.message}
              </p>
            )}
            {notification.details && notification.message !== 'Error' && notification.message !== 'خطأ' && (
              <p className="text-[10px] opacity-50 mt-1 font-mono">
                {notification.details}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const { dir, t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const { notifications, toggleNotification, removeNotification } = useGlobal();
  const { reloadNotifications } = useAppNotifications();
  const { user } = useAuth();
  
  // Notification Modals state
  const [selectedAppNotification, setSelectedAppNotification] = useState<Notification | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const isAdmin = user?.email === 'thameralsatam@gmail.com' || user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';
  
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              onToggle={() => toggleNotification(notification.id)}
              onRemove={() => removeNotification(notification.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Header - Minimal & Centered */}
      {!location.pathname.startsWith('/account') && (
        <header 
          className={`fixed top-0 left-0 right-0 z-[100] h-24 px-6 flex items-center justify-between transition-colors duration-300 bg-[#080808] border-b ${
            isScrolled ? 'border-white/20' : 'border-transparent'
          }`}
        >
          {/* Left Container (Logo + Login) */}
          <div className="flex-1 flex items-center justify-start gap-4 lg:gap-6 pointer-events-none">
            {/* Desktop Logo */}
            <div className="hidden lg:block">
              <Link to="/" className="inline-block relative z-[10] pointer-events-auto mt-2">
                <div className="w-[130px] h-fit flex items-center justify-center">
                  <Logo className="w-full h-auto text-white" />
                </div>
              </Link>
            </div>

            {/* Login Button */}
            {!user && (
              <div className="pointer-events-auto">
                <Link 
                  to="/account" 
                  className="flex items-center justify-center sm:px-4 sm:py-2 gap-2 text-xs font-medium text-white hover:bg-white hover:text-black transition-all w-9 h-9 sm:w-auto sm:h-auto rounded-full bg-black/50 sm:bg-black border border-white/10 sm:border-white/20 hover:border-white"
                >
                  <LogIn className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  <span className="hidden sm:block">{dir === 'rtl' ? 'دخول' : 'Login'}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Center Container (Mobile Logo / Desktop Nav) */}
          <div className="flex items-center justify-center pointer-events-none lg:pointer-events-auto shrink-0 px-4">
            {/* Mobile Logo */}
            <div className="lg:hidden">
              <Link to="/" className="inline-block relative z-[10] pointer-events-auto mt-2">
                <div className="w-[130px] h-fit flex items-center justify-center">
                  <Logo className="w-full h-auto text-white" />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-white opacity-50 hover:text-white'}`}>{t('nav.home')}</Link>
              <Link to="/fonts" className={`text-sm font-medium transition-colors ${location.pathname === '/fonts' ? 'text-white' : 'text-white opacity-50 hover:text-white'}`}>{t('nav.public_fonts')}</Link>
              <Link to="/lab" className={`text-sm font-medium transition-colors ${location.pathname === '/lab' ? 'text-white' : 'text-white opacity-50 hover:text-white'}`}>{t('nav.lab')}</Link>
              <Link to="/my-fonts" className={`text-sm font-medium transition-colors ${location.pathname === '/my-fonts' ? 'text-white' : 'text-white opacity-50 hover:text-white'}`}>{t('nav.my_fonts')}</Link>
              <Link to="/account" className={`text-sm font-medium transition-colors ${location.pathname === '/account' ? 'text-white' : 'text-white opacity-50 hover:text-white'}`}>{t('nav.account')}</Link>
            </div>
          </div>

          {/* Right Container (Language + Notifications) */}
          <div className="flex-1 flex justify-end items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
              className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 sm:bg-black border border-white/10 sm:border-white/20 hover:border-white hover:bg-white hover:text-black transition-all"
            >
              <span className="text-sm font-medium leading-none">{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
            <NotificationsDropdown 
               isAdmin={isAdmin} 
               onOpenNotification={(n) => setSelectedAppNotification(n)} 
               onOpenAdminPanel={() => setIsAdminModalOpen(true)}
            />
          </div>
        </header>
      )}
      
      {/* Main Content */}
      <main 
        className={`flex-1 ${location.pathname.startsWith('/account') ? 'pt-8' : 'pt-32'} pb-12 w-full ${dir === 'rtl' ? 'max-lg:landscape:pr-[56px]' : 'max-lg:landscape:pl-[56px]'}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="pt-16 pb-32 mt-auto relative overflow-hidden bg-black/40 border-t border-white/5">
        <div className="mx-auto px-6 w-full max-w-4xl flex flex-col items-center text-center">
          
          <p className="text-white opacity-40 text-sm font-light leading-relaxed max-w-2xl mb-6">
            {dir === 'rtl' ? 'مبادرة رقمية تهدف لتوفير أدوات وخطوط عربية أصيلة لتعزيز المحتوى العربي باحترافية وسهولة.' : 'A digital initiative aiming to provide authentic Arabic tools and fonts to enhance Arabic content professionally and easily.'}
          </p>

          <p className="text-white opacity-40 text-sm font-light mb-10">
            <span dir="ltr">© {new Date().getFullYear()} FONTAT.</span> {dir === 'rtl' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>

          {/* Social Icons - Free floating pill design */}
          <div className="inline-flex items-center p-1.5 rounded-full bg-[#080808] border border-white/5 shadow-2xl relative mb-12">
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-white opacity-40 hover:opacity-100 hover:bg-white/5 transition-all duration-300" aria-label="X (Twitter)">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            
            <a href="#" className="flex items-center justify-center w-10 h-10 rounded-full text-white opacity-40 hover:opacity-100 hover:bg-white/5 transition-all duration-300" aria-label="Instagram">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            
            <a href="mailto:your@email.com" className="flex items-center justify-center w-10 h-10 rounded-full text-white opacity-40 hover:opacity-100 hover:bg-white/5 transition-all duration-300" aria-label="Support Email">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </a>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-sm text-white opacity-40 group-hover:opacity-100 transition-opacity">
            <Link to="/about" className="hover:text-white transition-colors">{dir === 'rtl' ? 'عن مبادرة فونتات' : 'About Fontat'}</Link>
            
            <div className="hidden sm:block w-1.5 h-1.5 bg-white/20 transform rotate-45"></div>

            <Link to="/privacy" className="hover:text-white transition-colors">{dir === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
            
            <div className="hidden sm:block w-1.5 h-1.5 bg-white/20 transform rotate-45"></div>

            <Link to="/terms" className="hover:text-white transition-colors">{dir === 'rtl' ? 'شروط الاستخدام' : 'Terms of Service'}</Link>
          </div>
          
          <div className="flex items-center justify-center w-full max-w-[200px] mt-10 opacity-20">
            <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-white/50"></div>
            <div className="mx-3 transform rotate-45 w-1 h-1 bg-white/50"></div>
            <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-white/50"></div>
          </div>
        </div>
      </footer>

      {/* شريط التنقل السفلي الجديد */}
      <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#080808]/90 to-transparent z-[999] pointer-events-none lg:hidden landscape:hidden"></div>
      <nav 
        className={`fixed z-[1000] bg-[#0d0d0d] border border-white/15 p-[12px_18px] flex justify-around items-center gap-1 transition-all duration-300 lg:hidden
        bottom-[max(2.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[420px] rounded-[30px]
        landscape:bottom-auto landscape:top-[55%] landscape:-translate-y-1/2 landscape:flex-col landscape:w-auto landscape:h-fit landscape:rounded-[30px] landscape:p-1.5 landscape:gap-1.5
        ${dir === 'rtl' ? 'landscape:right-4 landscape:translate-x-0 landscape:left-auto' : 'landscape:left-4 landscape:translate-x-0'}
        `}
        dir={dir}
      >
        
        {/* الرئيسية */}
        <Link 
          to="/" 
          className={`flex flex-row items-center gap-0 p-[9px_12px] rounded-[20px] bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:w-9 landscape:h-9 landscape:!p-0 landscape:justify-center ${location.pathname === '/' ? 'bg-white gap-[6px] p-[9px_16px] landscape:!gap-0' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={location.pathname === '/' ? '#0d0d0d' : '#ffffff'} className="opacity-70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>
            <polyline points="9,21 9,14 15,14 15,21"/>
          </svg>
          <span className={`text-[11px] font-normal transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:hidden ${location.pathname === '/' ? 'text-[#0d0d0d] max-w-[80px]' : 'text-transparent max-w-0 overflow-hidden'}`}>{t('nav.home')}</span>
        </Link>

        {/* خطوط عامة */}
        <Link 
          to="/fonts" 
          className={`flex flex-row items-center gap-0 p-[9px_12px] rounded-[20px] bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:w-9 landscape:h-9 landscape:!p-0 landscape:justify-center ${location.pathname === '/fonts' ? 'bg-white gap-[6px] p-[9px_16px] landscape:!gap-0' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={location.pathname === '/fonts' ? '#0d0d0d' : '#ffffff'} className="opacity-70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6"/>
            <line x1="4" y1="10" x2="20" y2="10"/>
            <line x1="4" y1="14" x2="14" y2="14"/>
            <line x1="4" y1="18" x2="10" y2="18"/>
          </svg>
          <span className={`text-[11px] font-normal transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:hidden ${location.pathname === '/fonts' ? 'text-[#0d0d0d] max-w-[80px]' : 'text-transparent max-w-0 overflow-hidden'}`}>{t('nav.public_fonts')}</span>
        </Link>

        {/* المختبر */}
        <Link 
          to="/lab" 
          className={`flex flex-row items-center gap-0 p-[9px_12px] rounded-[20px] bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:w-9 landscape:h-9 landscape:!p-0 landscape:justify-center ${location.pathname === '/lab' ? 'bg-white gap-[6px] p-[9px_16px] landscape:!gap-0' : ''}`}
        >
          <Beaker size={16} className={`opacity-70 ${location.pathname === '/lab' ? 'text-[#0d0d0d]' : 'text-white'}`} strokeWidth="1.6" />
          <span className={`text-[11px] font-normal transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:hidden ${location.pathname === '/lab' ? 'text-[#0d0d0d] max-w-[80px]' : 'text-transparent max-w-0 overflow-hidden'}`}>{t('nav.lab')}</span>
        </Link>

        {/* خطوطي */}
        <Link 
          to="/my-fonts" 
          className={`flex flex-row items-center gap-0 p-[9px_12px] rounded-[20px] bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:w-9 landscape:h-9 landscape:!p-0 landscape:justify-center ${location.pathname === '/my-fonts' ? 'bg-white gap-[6px] p-[9px_16px] landscape:!gap-0' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={location.pathname === '/my-fonts' ? '#0d0d0d' : '#ffffff'} className="opacity-70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/>
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/>
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/>
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>
          </svg>
          <span className={`text-[11px] font-normal transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:hidden ${location.pathname === '/my-fonts' ? 'text-[#0d0d0d] max-w-[80px]' : 'text-transparent max-w-0 overflow-hidden'}`}>{t('nav.my_fonts')}</span>
        </Link>

        {/* حسابي */}
        <Link 
          to="/account" 
          className={`flex flex-row items-center gap-0 p-[9px_12px] rounded-[20px] bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:w-9 landscape:h-9 landscape:!p-0 landscape:justify-center ${location.pathname === '/account' ? 'bg-white gap-[6px] p-[9px_16px] landscape:!gap-0' : ''}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={location.pathname === '/account' ? '#0d0d0d' : '#ffffff'} className="opacity-70" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="7" r="4"/>
            <path d="M5 21c0-3.87 3.13-7 7-7s7 3.13 7 7"/>
          </svg>
          <span className={`text-[11px] font-normal transition-all duration-200 ease-[cubic-bezier(.4,0,.2,1)] landscape:hidden ${location.pathname === '/account' ? 'text-[#0d0d0d] max-w-[80px]' : 'text-transparent max-w-0 overflow-hidden'}`}>{t('nav.account')}</span>
        </Link>

      </nav>

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
