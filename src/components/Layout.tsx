import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { Upload, AlertTriangle, Info, Check, X, LogIn, Beaker } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobal } from '../contexts/GlobalContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppNotifications } from '../contexts/NotificationContext';
import { Logo } from './Logo';
import { AccountLogo } from './AccountLogo';
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
  const { dir, t } = useLanguage();
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
        <header 
          className={`fixed top-0 left-0 right-0 z-[100] h-24 px-6 flex items-center justify-between transition-colors duration-300 bg-[#080808] border-b ${
            isScrolled ? 'border-white/20' : 'border-transparent'
          }`}
        >
          {/* Left Spacer (only for mobile) */}
          <div className="w-24 lg:hidden"></div>

          <div className="flex-1 lg:flex-none flex justify-center lg:justify-start pointer-events-none">
            {location.pathname.startsWith('/account') ? (
              <Link to="/" className="inline-block relative z-10 mt-2 pointer-events-auto">
                <AccountLogo className="w-[130px] h-auto text-white transition-colors" />
              </Link>
            ) : (
              <Link to="/" className="inline-block relative z-[10] pointer-events-auto mt-2">
                <div className="w-[130px] h-fit flex items-center justify-center">
                  <Logo className="w-full h-auto text-white" />
                </div>
              </Link>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-1 justify-center pointer-events-auto items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition-colors ${location.pathname === '/' ? 'text-white' : 'text-white/50 hover:text-white'}`}>{t('nav.home')}</Link>
            <Link to="/fonts" className={`text-sm font-medium transition-colors ${location.pathname === '/fonts' ? 'text-white' : 'text-white/50 hover:text-white'}`}>{t('nav.public_fonts')}</Link>
            <Link to="/lab" className={`text-sm font-medium transition-colors ${location.pathname === '/lab' ? 'text-white' : 'text-white/50 hover:text-white'}`}>{t('nav.lab')}</Link>
            <Link to="/my-fonts" className={`text-sm font-medium transition-colors ${location.pathname === '/my-fonts' ? 'text-white' : 'text-white/50 hover:text-white'}`}>{t('nav.my_fonts')}</Link>
            <Link to="/account" className={`text-sm font-medium transition-colors ${location.pathname === '/account' ? 'text-white' : 'text-white/50 hover:text-white'}`}>{t('nav.account')}</Link>
          </div>

          {/* Right Action Area */}
          <div className="w-24 flex justify-end items-center gap-2 pointer-events-auto">
            {!user && !location.pathname.startsWith('/account') && (
              <Link 
                to="/account" 
                className="flex items-center gap-2 text-xs font-medium text-white hover:bg-white hover:text-black transition-all px-4 py-2 rounded-full border border-white/20 hover:border-white bg-black"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{dir === 'rtl' ? 'دخول' : 'Login'}</span>
              </Link>
            )}
            <NotificationsDropdown 
               isAdmin={isAdmin} 
               onOpenNotification={(n) => setSelectedAppNotification(n)} 
               onOpenAdminPanel={() => setIsAdminModalOpen(true)}
            />
          </div>
        </header>
      
      {/* Main Content */}
      <main 
        className={`flex-1 pt-32 pb-12 w-full ${dir === 'rtl' ? 'max-lg:landscape:pr-[56px]' : 'max-lg:landscape:pl-[56px]'}`}
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
      <footer className="border-t border-white/10 py-8 pb-32 mt-auto">
        <div className="mx-auto px-4 w-full xl:max-w-[1600px] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/50">
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link to="/about" className={`transition-colors ${location.pathname === '/about' ? 'text-white font-bold' : 'hover:text-white'}`}>{dir === 'rtl' ? 'من نحن؟' : 'About Us'}</Link>
            <Link to="/privacy" className={`transition-colors ${location.pathname === '/privacy' ? 'text-white font-bold' : 'hover:text-white'}`}>{dir === 'rtl' ? 'سياسة الخصوصية' : 'Privacy Policy'}</Link>
            <Link to="/terms" className={`transition-colors ${location.pathname === '/terms' ? 'text-white font-bold' : 'hover:text-white'}`}>{dir === 'rtl' ? 'شروط الاستخدام' : 'Terms of Service'}</Link>
          </div>
          <div className="flex items-center gap-2">
            <span dir="ltr">© {new Date().getFullYear()} FONTAT. All rights reserved.</span>
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
