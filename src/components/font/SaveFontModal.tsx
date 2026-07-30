import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Copy } from 'lucide-react';
import { Group } from '../../types';

interface SaveFontModalProps {
  isOpen: boolean;
  onClose: () => void;
  dir: 'rtl' | 'ltr' | 'auto';
  saveToGroupId: string;
  setSaveToGroupId: (v: string) => void;
  userGroups: Group[];
  newSaveGroupName: string;
  setNewSaveGroupName: (v: string) => void;
  executeFontSave: () => void;
  isSavingFont: boolean;
  selectedFontWeightsCount: number;
}

export const SaveFontModal: React.FC<SaveFontModalProps> = ({
  isOpen,
  onClose,
  dir,
  saveToGroupId,
  setSaveToGroupId,
  userGroups,
  newSaveGroupName,
  setNewSaveGroupName,
  executeFontSave,
  isSavingFont,
  selectedFontWeightsCount
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans"
          dir={dir}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-[#0f1115] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col gap-5"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">
                {dir === 'rtl' ? 'حفظ الخط في حسابي' : 'Save to my account'}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-white/60" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-white/60 text-xs font-semibold px-1">
                  {dir === 'rtl' ? 'أين تريد حفظ هذا الخط؟' : 'Where to save this font?'}
                </label>
                <select
                  className="w-full bg-[#16191f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/40 appearance-none cursor-pointer"
                  value={saveToGroupId}
                  onChange={(e) => setSaveToGroupId(e.target.value)}
                >
                  <option value="new" className="bg-[#16191f] font-bold text-cyan-400">
                    {dir === 'rtl' ? ' إنشاء مجموعة جديدة...' : ' Create new group...'}
                  </option>
                  {userGroups.map((g, idx) => (
                    <option key={`user-grp-${g.id || idx}-${idx}`} value={g.id} className="bg-[#16191f]">
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              {saveToGroupId === 'new' && (
                <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-white/60 text-xs font-semibold px-1">
                    {dir === 'rtl' ? 'اسم المجموعة الجديدة' : 'New group name'}
                  </label>
                  <input
                    type="text"
                    className="w-full bg-[#16191f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/40"
                    placeholder={dir === 'rtl' ? 'مثال: خطوطي المفضلة' : 'e.g. My Favorites'}
                    value={newSaveGroupName}
                    onChange={(e) => setNewSaveGroupName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') executeFontSave();
                    }}
                    autoFocus
                  />
                </div>
              )}
              
              {selectedFontWeightsCount > 0 && (
                 <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-400/80 flex flex-col gap-1">
                   <div className="flex items-center gap-2 font-bold mb-1">
                     <Check className="w-3.5 h-3.5" />
                     {dir === 'rtl' ? 'حفظ الأوزان' : 'Weights Inclusion'}
                   </div>
                   <p>
                      {dir === 'rtl' 
                        ? `هذا الخط يحتوي على ${selectedFontWeightsCount} وزن، سيتم حفظها وربطها بالخط الأساسي تلقائياً.` 
                        : `This font has ${selectedFontWeightsCount} weights, they will be saved and linked automatically.`}
                   </p>
                 </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
              >
                {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={executeFontSave}
                disabled={isSavingFont}
                className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingFont ? (
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : <Copy className="w-4 h-4" />}
                {dir === 'rtl' ? 'تأكيد الحفظ' : 'Confirm Save'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
