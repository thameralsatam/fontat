import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface FuturisticHintProps {
  showFuturisticHint: boolean;
  setShowFuturisticHint: (show: boolean) => void;
  dir: 'rtl' | 'ltr' | 'auto';
}

export const FuturisticHint: React.FC<FuturisticHintProps> = ({
  showFuturisticHint,
  setShowFuturisticHint,
  dir
}) => {
  return (
    <AnimatePresence>
      {showFuturisticHint && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black/85 backdrop-blur-2xl border border-white/10 px-4 py-3 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.15)] max-w-sm sm:max-w-md w-[calc(100%-2rem)] md:w-auto"
        >
          {/* Cyan Pulse Core */}
          <div className="relative flex h-2 w-2 items-center justify-center shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-400"></span>
          </div>
          
          <p className="text-[11px] md:text-xs text-white/80 font-sans tracking-wide leading-tight text-center flex-grow font-light">
            {dir === 'rtl' 
              ? 'انقر على بطاقة الخط لعرض منصة المعاينة وتفاصيل الأوزان' 
              : 'Tap any font card to explore its dynamic preview & weights'}
          </p>

          {/* Dismiss Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              localStorage.setItem('fontinfo_hint_dismissed', 'true');
              setShowFuturisticHint(false);
            }}
            className="text-white/40 hover:text-white p-1 rounded-full hover:bg-white/5 transition-all text-[10px] shrink-0 font-sans cursor-pointer ml-1 rtl:ml-0 rtl:mr-1"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
