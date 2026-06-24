import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Font } from '../../types';
import { formatFontName } from '../../utils/text';

interface TagsEditModalProps {
  tagEditModal: { isOpen: boolean; fontId: string | null; tagsText: string };
  setTagEditModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; fontId: string | null; tagsText: string }>>;
  dbFonts: Font[];
  dir: 'rtl' | 'ltr' | 'auto';
  t: (key: string) => string;
  newSingleTag: string;
  setNewSingleTag: (v: string) => void;
  handleRemoveTag: (fontId: string, tag: string) => void;
  handleUpdateTags: () => void;
}

export const TagsEditModal: React.FC<TagsEditModalProps> = ({
  tagEditModal,
  setTagEditModal,
  dbFonts,
  dir,
  t,
  newSingleTag,
  setNewSingleTag,
  handleRemoveTag,
  handleUpdateTags
}) => {
  return (
    <AnimatePresence>
      {tagEditModal.isOpen && (() => {
        const currentFont = dbFonts.find(f => f.id === tagEditModal.fontId);
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans" dir={dir}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => {
                setTagEditModal({ isOpen: false, fontId: null, tagsText: '' });
                setNewSingleTag('');
              }} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
            >
              <div>
                 <h3 className="text-white font-bold text-lg mb-1 font-display">{dir === 'rtl' ? 'إدارة هاشتاغات الخط' : 'Manage Font Tags'}</h3>
                 <p className="text-white/40 text-xs font-light">{dir === 'rtl' ? 'لخط:' : 'For font:'} <span className="text-cyan-400 font-mono text-xs">{formatFontName(currentFont?.name || '')}</span></p>
              </div>

              {/* Existing Tags Chips list */}
              <div>
                <h4 className="text-white/60 text-xs font-medium mb-2.5">{dir === 'rtl' ? 'الهاشتاغات الحالية المضافة:' : 'Current added tags:'}</h4>
                {(!currentFont?.tags || currentFont.tags.length === 0) ? (
                  <div className="text-white/30 text-xs py-2 font-light">{dir === 'rtl' ? 'لا توجد هاشتاغات مضافة بعد لهذا الخط' : 'No tags added yet for this font'}</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {currentFont.tags.map(tag => (
                      <div 
                        key={tag} 
                        className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 text-cyan-400 text-xs font-light transition-colors"
                      >
                        <span className="opacity-50 font-mono">#</span>
                        <span>{tag}</span>
                        <button 
                          onClick={() => handleRemoveTag(currentFont.id, tag)}
                          className="p-0.5 rounded-md hover:bg-cyan-500/20 text-cyan-400/50 hover:text-cyan-300 transition-colors cursor-pointer"
                          title={dir === 'rtl' ? 'إزالة الهاشتاغ' : 'Remove tag'}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new Tag Input with frozen `#` prefix */}
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-medium">{dir === 'rtl' ? 'إضافة هاشتاغ جديد:' : 'Add new tag:'}</label>
                <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/50 rounded-2xl px-4 py-3.5 transition-all duration-300">
                  <span className="text-cyan-400 font-bold select-none text-base mr-1 font-mono">#</span>
                  <input 
                    type="text" 
                    value={newSingleTag} 
                    autoFocus
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val
                        .replace(/\s+/g, '_')
                        .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                      setNewSingleTag(cleaned);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleUpdateTags();
                      }
                    }}
                    className="w-full bg-transparent border-none p-0 text-white text-sm outline-none focus:ring-0 leading-none placeholder:text-white/20 font-sans"
                    placeholder={dir === 'rtl' ? 'اكتب_الهاشتاغ' : 'type_tag'}
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-white/30 font-light pr-1">{dir === 'rtl' ? 'يبدأ بالرمز # تلقائياً. المسافات تتحول تلقائياً إلى شرطة سفلية _' : 'Auto prepended with #. Spaces turn into underscores _'}</p>
              </div>

              <div className="flex justify-end gap-2.5 mt-2 border-t border-white/5 pt-4">
                <button 
                  onClick={() => {
                    setTagEditModal({ isOpen: false, fontId: null, tagsText: '' });
                    setNewSingleTag('');
                  }} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={handleUpdateTags} 
                  className="px-6 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {dir === 'rtl' ? 'إضافة الهاشتاغ' : 'Add Tag'}
                </button>
              </div>
            </motion.div>
          </div>
        );
      })()}
    </AnimatePresence>
  );
};
