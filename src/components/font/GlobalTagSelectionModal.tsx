import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X } from 'lucide-react';

interface GlobalTagSelectionModalProps {
  isTagModalOpen: boolean;
  setIsTagModalOpen: (isOpen: boolean) => void;
  dir: 'ltr' | 'rtl' | 'auto';
  availableTags: string[];
  publicTagFilters: string[];
  onTagClick?: (tag: string) => void;
  onClearTagFilter?: () => void;
}

export const GlobalTagSelectionModal: React.FC<GlobalTagSelectionModalProps> = ({
  isTagModalOpen,
  setIsTagModalOpen,
  dir,
  availableTags,
  publicTagFilters,
  onTagClick,
  onClearTagFilter
}) => {
  return createPortal(
    <AnimatePresence>
      {isTagModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir={dir}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setIsTagModalOpen(false)} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 15 }} 
            transition={{ type: "spring", damping: 25, stiffness: 350 }} 
            className="bg-[#0f0f0f]/95 border border-white/10 w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[80vh] flex flex-col font-sans"
          >
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <Filter className="w-4 h-4" />
                </div>
                <h3 className="text-md font-bold text-white tracking-tight font-display">{dir === 'rtl' ? 'تصنيف الخطوط حسب الهاشتاغ' : 'Filter Fonts by Tag'}</h3>
              </div>
              <button 
                onClick={() => setIsTagModalOpen(false)} 
                className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                title="إغلاق / Close"
              >
                <X className="w-4 h-4 text-white opacity-70" />
              </button>
            </div>

            <div className="overflow-y-auto pr-1 custom-scrollbar flex-1 mb-5">
              {availableTags.length === 0 ? (
                <div className="text-sm text-white/40 py-8 text-center font-light">{dir === 'rtl' ? 'لا توجد هاشتاغات متاحة حالياً للتصنيف' : 'No tags available for filtering'}</div>
              ) : (
                <div className="flex flex-wrap gap-2 pt-1" dir="rtl">
                  {availableTags.map((tag, tagIdx) => (
                    <button
                      key={`${tag}-${tagIdx}`}
                      onClick={() => {
                        onTagClick?.(tag);
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 border font-light cursor-pointer
                        ${publicTagFilters.includes(tag) 
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-105' 
                          : 'bg-white/[0.03] text-white/70 border-white/5 hover:border-white/20 hover:text-white'
                        }
                      `}
                    >
                      <span className="opacity-40 font-mono">#</span>
                      <span>{tag}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {publicTagFilters.length > 0 && (
              <button
                onClick={() => {
                  onClearTagFilter?.();
                  setIsTagModalOpen(false);
                }}
                className="w-full py-2.5 rounded-xl text-xs text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all font-light mt-auto cursor-pointer"
              >
                {dir === 'rtl' ? 'إلغاء التصفية النشطة' : 'Clear active filters'}
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
