import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TagRenameModalProps {
  tagRenameModal: { isOpen: boolean; oldTag: string; newTag: string };
  setTagRenameModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; oldTag: string; newTag: string }>>;
  dir: 'rtl' | 'ltr' | 'auto';
  t: (key: string) => string;
  handleRenameHashtagGlobally: (oldTag: string, newTag: string) => void;
}

export const TagRenameModal: React.FC<TagRenameModalProps> = ({
  tagRenameModal,
  setTagRenameModal,
  dir,
  t,
  handleRenameHashtagGlobally
}) => {
  return (
    <AnimatePresence>
      {tagRenameModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans" dir={dir}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' })} 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }} 
            animate={{ opacity: 1, scale: 1, y: 0 }} 
            exit={{ opacity: 0, scale: 0.95, y: 15 }} 
            className="relative bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 z-10"
          >
            <div>
               <h3 className="text-white font-bold text-lg mb-1 font-display">{dir === 'rtl' ? 'تعديل الهاشتاغ العام' : 'Edit Global Tag'}</h3>
               <p className="text-white/40 text-xs font-light">{dir === 'rtl' ? 'سيتم تعديل هذا الهاشتاغ عند' : 'This will modify the tag for'} <span className="text-cyan-400 font-bold">{dir === 'rtl' ? 'كل الخطوط المرتبطة به' : 'all associated fonts'}</span> {dir === 'rtl' ? 'في قاعدة البيانات' : 'in the database'}</p>
            </div>

            <div className="text-xs text-white/50 bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
              <span>{dir === 'rtl' ? 'الهاشتاغ القديم:' : 'Old Tag:'}</span>
              <span className="text-sm font-bold text-red-400 font-mono">#{tagRenameModal.oldTag}</span>
            </div>

            {/* Rename Tag Input with frozen `#` prefix */}
            <div className="space-y-2">
              <label className="text-white/60 text-xs font-medium">{dir === 'rtl' ? 'الاسم الجديد للهاشتاغ:' : 'New Tag Name:'}</label>
              <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/50 rounded-2xl px-4 py-3.5 transition-all duration-300">
                <span className="text-cyan-400 font-bold select-none text-base mr-1 font-mono">#</span>
                <input 
                  type="text" 
                  value={tagRenameModal.newTag} 
                  autoFocus
                  onChange={(e) => {
                    const val = e.target.value;
                    const cleaned = val
                      .replace(/\s+/g, '_')
                      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                    setTagRenameModal(p => ({ ...p, newTag: cleaned }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRenameHashtagGlobally(tagRenameModal.oldTag, tagRenameModal.newTag);
                    }
                  }}
                  className="w-full bg-transparent border-none p-0 text-white text-sm outline-none focus:ring-0 leading-none placeholder:text-white/20 font-sans"
                  placeholder="الاسم_الجديد"
                  dir="ltr"
                />
              </div>
              <p className="text-[10px] text-white/30 font-light pr-1">{dir === 'rtl' ? 'يقبل فقط الحروف والأرقام والشرطة السفلية _' : 'Only accepts letters, numbers, and underscores _'}</p>
            </div>

            <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4">
              <button 
                onClick={() => setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' })} 
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={() => handleRenameHashtagGlobally(tagRenameModal.oldTag, tagRenameModal.newTag)} 
                className="px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
              >
                {dir === 'rtl' ? 'تعديل الاسم' : 'Rename'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
