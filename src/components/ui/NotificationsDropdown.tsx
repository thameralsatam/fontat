import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { Bell, Info, ArrowUpCircle, AlertTriangle, Gift, Trash2 } from 'lucide-react';
import { useAppNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Notification } from '../../types';

interface InternalProps {
  onOpenNotification: (notification: Notification) => void;
  isAdmin?: boolean;
  onOpenAdminPanel?: () => void;
}

const NotificationIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'update': return <ArrowUpCircle className="w-5 h-5 text-blue-400" />;
    case 'alert': return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    case 'promotion': return <Gift className="w-5 h-5 text-purple-400" />;
    case 'info':
    default: return <Info className="w-5 h-5 text-green-400" />;
  }
};

// ✅ FIX: دالة خارج الـ component — لا تتعاد إنشاؤها
function computeTimeAgo(dateStr: string, t: (key: string) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} ${t('time.seconds')}`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} ${t('time.minutes')}`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} ${t('time.hours')}`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return date.toLocaleDateString(document.documentElement.lang, { weekday: 'long' });
  }

  return date.toLocaleDateString(document.documentElement.lang);
}

const SwipeableNotification = ({
  n,
  onOpen,
  t
}: {
  n: Notification,
  onOpen: () => void,
  t: (key: string) => string
}) => {
  const { deleteNotification } = useAppNotifications();
  const { dir } = useLanguage();
  const controls = useAnimation();
  const [deleted, setDeleted] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ✅ FIX: useMemo — تحسب الوقت مرة وتحفظه، مو في كل render
  const timeAgo = useMemo(() => computeTimeAgo(n.created_at, t), [n.created_at, t]);

  const handleDragEnd = async (_: any, info: any) => {
    const isRtl = dir === 'rtl';
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    const threshold = 35;

    if (isRtl) {
      if (offset > threshold || velocity > 200) {
        controls.start({ x: 74 });
        setIsRevealed(true);
      } else {
        controls.start({ x: 0 });
        setIsRevealed(false);
        setConfirmDelete(false);
      }
    } else {
      if (offset < -threshold || velocity < -200) {
        controls.start({ x: -74 });
        setIsRevealed(true);
      } else {
        controls.start({ x: 0 });
        setIsRevealed(false);
        setConfirmDelete(false);
      }
    }
  };

  const handleDelete = () => {
    setDeleted(true);
    setTimeout(() => deleteNotification(n.id), 300);
  };

  const handleItemClick = (e: React.MouseEvent) => {
    if (isRevealed) {
      e.stopPropagation();
      controls.start({ x: 0 });
      setIsRevealed(false);
      setConfirmDelete(false);
    } else {
      onOpen();
    }
  };

  if (deleted) return null;

  const isRtl = dir === 'rtl';

  return (
    <div className="relative overflow-hidden border-b border-white/5 last:border-0 hover:bg-white/5 group bg-black/40">
      <div
        className={`absolute inset-y-0 ${isRtl ? 'left-0' : 'right-0'} w-[74px] flex items-center justify-center transition-colors duration-300 z-0 ${confirmDelete ? 'bg-red-700/100' : 'bg-red-600/90 hover:bg-red-600'}`}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!confirmDelete) {
              setConfirmDelete(true);
            } else {
              handleDelete();
            }
          }}
          className="w-full h-full flex flex-col items-center justify-center text-white/90 hover:text-white transition-all cursor-pointer gap-0.5 active:scale-95"
          title={confirmDelete ? (isRtl ? 'تأكيد الحذف' : 'Confirm Delete') : (isRtl ? 'حذف' : 'Delete')}
        >
          <Trash2 className={`w-4 h-4 stroke-[1.8] transition-transform duration-300 ${confirmDelete ? 'scale-110 text-white animate-pulse' : ''}`} />
          <span className="text-[10px] font-semibold tracking-wide transition-all duration-300">
            {confirmDelete ? (isRtl ? 'تأكيد؟' : 'Sure?') : (isRtl ? 'حذف' : 'Delete')}
          </span>
        </button>
      </div>

      <motion.div
        drag="x"
        dragDirectionLock
        dragConstraints={isRtl ? { left: 0, right: 74 } : { left: -74, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={controls}
        initial={{ x: 0 }}
        whileDrag={{ cursor: 'grabbing' }}
        className={`relative z-10 w-full flex gap-3 p-4 text-start transition-colors bg-[#111111] group-hover:bg-[#151515] ${!n.is_read ? 'bg-[#151515]' : ''} cursor-pointer select-none`}
        onClick={handleItemClick}
      >
        <div className="shrink-0 mt-0.5 pointer-events-none">
          <NotificationIcon type={n.type} />
        </div>
        <div className="flex-1 min-w-0 pointer-events-none">
          <h4 className="font-medium text-sm text-white truncate w-full">{n.slides[0]?.title || '...'}</h4>
          <p className="text-xs text-white opacity-50 mt-1 line-clamp-2 leading-relaxed">
            {n.slides[0]?.description || ''}
          </p>
          {/* ✅ يستخدم timeAgo المحسوبة بـ useMemo */}
          <p className="text-[10px] text-white opacity-30 mt-2">{timeAgo}</p>
        </div>
        {!n.is_read && (
          <div className="shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5 pointer-events-none" />
        )}
      </motion.div>
    </div>
  );
};

export const NotificationsDropdown: React.FC<InternalProps> = ({ onOpenNotification, isAdmin, onOpenAdminPanel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const { notifications, unreadCount, markAllAsRead } = useAppNotifications();
  const { t, dir } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-[200]">
      <button
        ref={btnRef}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && unreadCount > 0) markAllAsRead();
        }}
        className="relative w-10 h-10 rounded-full border border-white/20 hover:border-white/40 bg-[#080808] hover:bg-[#121212] transition-all duration-300 flex items-center justify-center text-white focus:outline-none backdrop-blur-sm shadow-sm active:scale-95 group"
      >
        <Bell className="w-4 h-4 stroke-[1.5] transition-transform duration-300 group-hover:scale-110" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 border border-[#090909] rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm">
            {unreadCount > 9 ? '+9' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute top-full mt-2 w-80 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden ${dir === 'rtl' ? 'left-0' : 'right-0'}`}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="font-medium text-white">{t('notifications.title') || 'الإشعارات'}</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <button
                    onClick={() => { setIsOpen(false); setTimeout(() => onOpenAdminPanel?.(), 100); }}
                    className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition-colors"
                  >
                    {t('notifications.create') || 'جديد'}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-white opacity-40 text-sm">
                  {t('notifications.empty') || 'لا توجد إشعارات حالياً'}
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n, idx) => (
                    <SwipeableNotification
                      key={n.id ? `notif-dropdown-${n.id}-${idx}` : `notif-dropdown-idx-${idx}`}
                      n={n}
                      onOpen={() => { setIsOpen(false); onOpenNotification(n); }}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};