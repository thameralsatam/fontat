import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Edit3, Trash2, X, ArrowUpDown, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SortOption, SortOptionList } from '../../utils/sortUtils';

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
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
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
  t,
  sortBy,
  setSortBy
}) => {
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

          <div className="flex items-center gap-3">
            <span className="text-[10px] tracking-wider uppercase font-bold text-cyan-400 bg-cyan-400/5 px-2.5 py-1 rounded-md border border-cyan-400/10">
              {dir === 'rtl' ? 'التصفية المتعددة' : 'Multiple Filter'}
            </span>

            {/* Sort Dropdown */}
            <div className="relative" ref={sortDropdownRef}>
              <button 
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="h-10 px-4 rounded-full border border-white/20 hover:border-white/40 bg-[#080808] hover:bg-[#121212] text-white/80 hover:text-white flex items-center gap-2 text-xs font-semibold transition-all duration-300 backdrop-blur-md cursor-pointer active:scale-95"
                title={dir === 'rtl' ? 'ترتيب الخطوط' : 'Sort Fonts'}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline">
                  {dir === 'rtl' 
                    ? (sortBy === 'oldest_first' ? 'الأقدم للأحدث' : sortBy === 'newest_first' ? 'الأحدث للأقدم' : sortBy === 'alpha_az' ? 'A - Z' : 'Z - A')
                    : (sortBy === 'oldest_first' ? 'Oldest' : sortBy === 'newest_first' ? 'Newest' : sortBy === 'alpha_az' ? 'A - Z' : 'Z - A')
                  }
                </span>
                <span className="sm:hidden">{dir === 'rtl' ? 'ترتيب' : 'Sort'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 opacity-70 ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isSortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute top-12 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-[#121214] border border-white/15 rounded-2xl shadow-2xl p-2 backdrop-blur-xl ${
                      dir === 'rtl' ? 'right-0 sm:right-auto sm:left-0' : 'right-0'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-white/40 px-3 py-1.5 uppercase tracking-wider">
                      {dir === 'rtl' ? 'ترتيب الخطوط' : 'Sort Fonts'}
                    </div>
                    {SortOptionList.OPTIONS.map(opt => {
                      const isSelected = sortBy === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all text-start cursor-pointer my-0.5 ${
                            isSelected 
                              ? 'bg-cyan-500/15 text-cyan-400 font-bold border border-cyan-500/20' 
                              : 'text-white/80 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="leading-relaxed">{dir === 'rtl' ? opt.labelAr : opt.labelEn}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ms-2" />}
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
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
