import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Upload, X, ArrowUpDown, Check, ChevronDown, RotateCcw } from 'lucide-react';
import { Group } from '../../types';
import { SortOption, SortOptionList } from '../../utils/sortUtils';
import { useLanguage } from '../../contexts/LanguageContext';

interface GroupToolbarProps {
  isPublicAllFonts: boolean;
  group: Group | null;
  publicTagFilters: string[];
  setIsTagModalOpen: (v: boolean) => void;
  dir: 'rtl' | 'ltr' | 'auto';
  isOwner: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onTagClick?: (tag: string) => void;
  onClearTagFilter?: () => void;
  toolbarTextareaRef: React.RefObject<HTMLTextAreaElement | null>;
  globalPreviewText: string;
  setGlobalPreviewText: (text: string) => void;
  setFontPreviews: (previews: Record<string, string>) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  t: (key: string) => string;
  sortBy: SortOption;
  setSortBy: (option: SortOption) => void;
}

export const GroupToolbar: React.FC<GroupToolbarProps> = ({
  isPublicAllFonts,
  group,
  publicTagFilters,
  setIsTagModalOpen,
  dir,
  isOwner,
  fileInputRef,
  handleFileUpload,
  onTagClick,
  onClearTagFilter,
  toolbarTextareaRef,
  globalPreviewText,
  setGlobalPreviewText,
  setFontPreviews,
  fontSize,
  setFontSize,
  t,
  sortBy,
  setSortBy
}) => {
  const { language } = useLanguage();
  const defaultPreviewText = language === 'ar' ? 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)' : 'The quick brown fox jumps over the lazy dog';
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
    <div className="pb-2 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col gap-4">
        {isPublicAllFonts ? (
          // PUBLIC FONTS LAYOUT: Title -> Preview -> Filters & Sort
          <>
            {/* Title Section */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
                  {t('nav.public_fonts')}
                </h1>
              </div>
              
              {isOwner && (
                <div className="relative flex items-center shrink-0 group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2.5 px-5 h-10 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 font-bold text-xs tracking-wide group/btn active:scale-95 text-right font-sans focus:outline-none shrink-0 cursor-pointer"
                    title={t('font.upload') || 'رفع خط'}
                  >
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 transition-transform duration-300" />
                    <span>{t('font.upload') || 'رفع خطوط جديدة'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative block ml-0.5">
                      <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
                    </span>
                  </button>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 bg-[#0f0f0f] border border-white/5 py-1 px-2.5 rounded-xl text-[10px] text-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap scale-95 group-hover:scale-100 font-light font-sans tracking-wide">
                    {dir === 'rtl' ? 'الحد الأقصى لكل دفعة: ١٠ ملفات' : 'Batch limit: 10 files max'}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Box FIRST (under the Title) */}
            <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.preview_text')}</span>
                  <div className="flex items-center gap-1.5">
                    <AnimatePresence>
                      {(globalPreviewText !== defaultPreviewText || fontSize !== 35) && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { 
                            setGlobalPreviewText(defaultPreviewText); 
                            setFontSize(35);
                            setFontPreviews({}); 
                          }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer flex items-center justify-center"
                          title={dir === 'rtl' ? 'إعادة ضبط تلقائي' : 'Reset defaults'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                      {globalPreviewText && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { setGlobalPreviewText(''); setFontPreviews({}); }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                          title={dir === 'rtl' ? 'مسح نص المعاينة' : 'Clear preview text'}
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

              <div className="w-full md:w-px md:h-auto h-px bg-white/5 shrink-0" />

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

            {/* Filter and Sort buttons row (above first font card): Filter on Right, Sort on Left */}
            <div className={`flex items-center justify-between w-full gap-4 pt-1 pb-1 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Right Side: Filter Button & Active Tags list */}
              <div className="flex items-center gap-2 flex-wrap">
                <button 
                  onClick={() => setIsTagModalOpen(true)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-md relative cursor-pointer shrink-0
                    ${publicTagFilters.length > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' : 'bg-[#080808] text-white/80 border-white/20 hover:border-white/40 hover:text-white hover:bg-[#121212]'}
                  `}
                  title={publicTagFilters.length > 0 ? (dir === 'rtl' ? `مصنف حسب: #${publicTagFilters.join(', #')}` : `Filtered by: #${publicTagFilters.join(', #')}`) : (dir === 'rtl' ? 'تصنيف بالهاشتاغات' : 'Filter by Tags')}
                >
                  <Filter className="w-4 h-4" />
                  {publicTagFilters.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-400 border border-[#0a0a0a] text-[10px] text-black font-bold flex items-center justify-center -translate-y-0.5">
                      {publicTagFilters.length}
                    </span>
                  )}
                </button>

                {publicTagFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {publicTagFilters.map((filterTag, idx) => (
                      <div key={`${filterTag}-${idx}`} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-[11px] text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <span className="opacity-50 font-mono">#</span>
                        <span className="font-medium">{filterTag}</span>
                        {onTagClick && (
                          <button 
                            onClick={() => onTagClick(filterTag)}
                            className="ml-1 p-0.5 rounded-full hover:bg-cyan-500/25 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    ))}
                    {onClearTagFilter && publicTagFilters.length > 1 && (
                      <button 
                        onClick={onClearTagFilter}
                        className="text-[10px] bg-red-500/10 text-red-400 hover:bg-red-500/20 px-2.5 py-1 rounded-full transition-colors font-medium border border-red-500/20 cursor-pointer"
                      >
                        {dir === 'rtl' ? 'مسح الكل' : 'Clear All'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Left Side: Sort Dropdown */}
              <div className="relative shrink-0" ref={sortDropdownRef}>
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
                      className="absolute top-12 z-50 w-48 bg-[#121214] border border-white/15 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl left-0"
                    >
                      <div className="text-[11px] font-semibold text-white/40 px-3 py-1.5 uppercase tracking-wider">
                        {dir === 'rtl' ? 'ترتيب الخطوط' : 'Sort Fonts'}
                      </div>
                      {SortOptionList.OPTIONS.map((opt, idx) => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={`sort1-${opt.id || idx}-${idx}`}
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
          </>
        ) : (
          // MY FONTS LAYOUT: Title -> Preview -> Buttons (Sort & Upload)
          <>
            {/* Title & Description Section */}
            <div className="flex items-center justify-between gap-4 pb-1">
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
                  {group?.name}
                </h1>
                {group?.description && (
                  <p className="text-sm text-white opacity-50 font-light leading-relaxed max-w-3xl whitespace-pre-wrap">
                    {group.description}
                  </p>
                )}
              </div>
              
              {isOwner && (
                <div className="relative flex items-center shrink-0 group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2.5 px-5 h-10 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 font-bold text-xs tracking-wide group/btn active:scale-95 text-right font-sans focus:outline-none shrink-0 cursor-pointer"
                    title={t('font.upload') || 'رفع خط'}
                  >
                    <Upload className="w-4 h-4 text-cyan-400 shrink-0 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 transition-transform duration-300" />
                    <span>{t('font.upload') || 'رفع خطوط جديدة'}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative block ml-0.5">
                      <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
                    </span>
                  </button>
                  <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 bg-[#0f0f0f] border border-white/5 py-1 px-2.5 rounded-xl text-[10px] text-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap scale-95 group-hover:scale-100 font-light font-sans tracking-wide">
                    {dir === 'rtl' ? 'الحد الأقصى لكل دفعة: ١٠ ملفات' : 'Batch limit: 10 files max'}
                  </div>
                </div>
              )}
            </div>

            {/* Preview Box */}
            <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.preview_text')}</span>
                  <div className="flex items-center gap-1.5">
                    <AnimatePresence>
                      {(globalPreviewText !== defaultPreviewText || fontSize !== 35) && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { 
                            setGlobalPreviewText(defaultPreviewText); 
                            setFontSize(35);
                            setFontPreviews({}); 
                          }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer flex items-center justify-center"
                          title={dir === 'rtl' ? 'إعادة ضبط تلقائي' : 'Reset defaults'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                      {globalPreviewText && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { setGlobalPreviewText(''); setFontPreviews({}); }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                          title={dir === 'rtl' ? 'مسح نص المعاينة' : 'Clear preview text'}
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

              <div className="w-full md:w-px md:h-auto h-px bg-white/5 shrink-0" />

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

            {/* Action buttons row (above first font card): Sort on Left */}
            <div className={`flex items-center justify-between w-full gap-4 pt-1 pb-1 ${dir === 'rtl' ? 'flex-row' : 'flex-row-reverse'}`}>
              {/* Spacer on Right so Sort stays on Left */}
              <div />

              {/* Left Side: Sort Dropdown */}
              <div className="relative shrink-0" ref={sortDropdownRef}>
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
                      className="absolute top-12 z-50 w-48 bg-[#121214] border border-white/15 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl left-0"
                    >
                      <div className="text-[11px] font-semibold text-white/40 px-3 py-1.5 uppercase tracking-wider">
                        {dir === 'rtl' ? 'ترتيب الخطوط' : 'Sort Fonts'}
                      </div>
                      {SortOptionList.OPTIONS.map((opt, idx) => {
                        const isSelected = sortBy === opt.id;
                        return (
                          <button
                            key={`sort2-${opt.id || idx}-${idx}`}
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
          </>
        )}
      </div>
    </div>
  );
};
