import React from 'react';
import { ArrowRight, ArrowLeft, Edit3, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GlobalTagFilterBannerProps {
  publicTagFilters: string[];
  displayFontsLength: number;
  isAdmin: boolean;
  onClearTagFilter: () => void;
  setTagRenameModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; oldTag: string; newTag: string; }>>;
  setTagDeleteGlobalModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; tag: string; }>>;
  globalPreviewText: string;
  setGlobalPreviewText: (text: string) => void;
  setFontPreviews: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fontSize: number;
  setFontSize: (size: number) => void;
  toolbarTextareaRef: React.RefObject<HTMLTextAreaElement>;
  dir: 'ltr' | 'rtl' | 'auto';
  t: (key: string) => string;
}

export const GlobalTagFilterBanner: React.FC<GlobalTagFilterBannerProps> = ({
  publicTagFilters,
  displayFontsLength,
  isAdmin,
  onClearTagFilter,
  setTagRenameModal,
  setTagDeleteGlobalModal,
  globalPreviewText,
  setGlobalPreviewText,
  setFontPreviews,
  fontSize,
  setFontSize,
  toolbarTextareaRef,
  dir,
  t
}) => {
  return (
    <div className="pb-8 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans" key="hashtag-isolate">
      <div className="flex flex-col gap-6">
        {/* Top Navigation Row */}
        <div className="flex items-center justify-between">
          <button 
            onClick={onClearTagFilter}
            className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white hover:text-white border border-white/10 hover:border-white/20 hover:shadow-lg transition-all cursor-pointer active:scale-95 select-none shrink-0"
            title={dir === 'rtl' ? 'العودة للخطوط العامة' : 'Back to public fonts'}
          >
            {dir === 'rtl' ? (
              <ArrowRight className="w-5 h-5 text-cyan-400" />
            ) : (
              <ArrowLeft className="w-5 h-5 text-cyan-400" />
            )}
          </button>
          
          <span className="text-[10px] tracking-wider uppercase font-bold text-cyan-400 bg-cyan-400/5 px-2.5 py-1 rounded-md border border-cyan-400/10">
            {dir === 'rtl' ? 'التصفية المتعددة' : 'Multiple Filter'}
          </span>
        </div>

        {/* Huge Beautiful Hashtag Banner with Pencil/Trash Admin controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-7 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
          {/* Dynamic decorative backdrop blur anchor */}
          <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
          
          <div className="flex flex-col gap-5 relative z-10 w-full">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                {publicTagFilters.map(filterTag => (
                  <div key={filterTag} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <span className="font-mono text-xl font-bold leading-none">#</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none font-display">
                      {filterTag}
                    </h2>
                    {/* Controls placed RIGHT BY the Hashtag as requested */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 select-none mr-2">
                        <button
                          onClick={() => setTagRenameModal({ isOpen: true, oldTag: filterTag, newTag: filterTag })}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/35 text-white/60 hover:text-cyan-400 transition-all cursor-pointer"
                          title={dir === 'rtl' ? 'تعديل هذا الهاشتاغ عالمياً' : 'Edit this globally'}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTagDeleteGlobalModal({ isOpen: true, tag: filterTag })}
                          className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/35 text-white/60 hover:text-red-400 transition-all cursor-pointer"
                          title={dir === 'rtl' ? 'حذف هذا الهاشتاغ عالمياً' : 'Delete this globally'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-1 font-light">
                {dir === 'rtl' ? (
                  <>تم العثور على <span className="text-cyan-400 font-bold font-mono">{displayFontsLength}</span> خطوط مرتبطة بهذا التصنيف</>
                ) : (
                  <>Found <span className="text-cyan-400 font-bold font-mono">{displayFontsLength}</span> fonts related to this filter</>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Consolidated Controls Container in Hashtag view */}
        <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
          
          {/* Preview input */}
          <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.preview_text')}</span>
              <div className="flex items-center gap-1.5">
                <AnimatePresence>
                  {globalPreviewText && (
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      onClick={() => { setGlobalPreviewText(''); setFontPreviews({}); }}
                      className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>
            <textarea
              ref={toolbarTextareaRef}
              value={globalPreviewText}
              onChange={(e) => {
                setGlobalPreviewText(e.target.value);
                setFontPreviews({});
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              className="w-full bg-transparent border-0 p-0 text-white text-base md:text-lg focus:ring-0 outline-none resize-none placeholder:text-white/15 transition-all duration-300 leading-normal font-light text-right"
              placeholder={t('toolbar.placeholder') || "اكتب نصاً للمعاينة..."}
              rows={1}
              style={{ minHeight: '32px', fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }}
            />
          </div>

          {/* Slider splitter */}
          <div className="w-full md:w-px md:h-auto h-px bg-white/5 shrink-0" />

          {/* Slider component */}
          <div className="w-full md:w-[220px] shrink-0 flex flex-col justify-between gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.font_size')}</span>
              <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded-lg text-[10px] border border-cyan-400/10 font-medium">{fontSize}px</span>
            </div>
            <div className="relative w-full h-8 flex items-center">
              <input 
                type="range" 
                min="20" 
                max="50" 
                value={fontSize} 
                onChange={(e) => setFontSize(Number(e.target.value))} 
                className="w-full h-1 bg-[#222] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 focus:outline-none focus:ring-0" 
                dir="ltr"
                style={{
                  background: `linear-gradient(to right, rgb(34, 211, 238) ${((fontSize - 20) / 30) * 100}%, #222 ${((fontSize - 20) / 30) * 100}%)`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
