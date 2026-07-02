import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Upload, X } from 'lucide-react';
import { Group } from '../../types';

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
  t
}) => {
  return (
    <div className="pb-8 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-5 border-b border-white/5 pb-6">
          {/* Title and Description Grouped Together */}
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
              {isPublicAllFonts ? 'الخطوط العامة' : group?.name}
            </h1>
            {!isPublicAllFonts && group?.description && (
              <p className="text-sm text-white opacity-50 font-light leading-relaxed max-w-3xl whitespace-pre-wrap">
                {group.description}
              </p>
            )}
          </div>

          {/* Actions & Filters row below description */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            {/* Tag Filters display */}
            <div className="flex-1">
              {isPublicAllFonts && publicTagFilters.length > 0 ? (
                <div className="flex flex-wrap items-center gap-2">
                  {publicTagFilters.map(filterTag => (
                    <div key={filterTag} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      <span className="opacity-50 font-mono">#</span>
                      <span className="font-medium">{filterTag}</span>
                      {onTagClick && (
                        <button 
                          onClick={() => onTagClick(filterTag)}
                          className="ml-1.5 p-0.5 rounded-full hover:bg-cyan-500/25 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  {onClearTagFilter && publicTagFilters.length > 1 && (
                    <button 
                      onClick={onClearTagFilter}
                      className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors font-medium border border-red-500/20 cursor-pointer"
                    >
                      {dir === 'rtl' ? 'مسح الكل' : 'Clear All'}
                    </button>
                  )}
                </div>
              ) : (
                <div />
              )}
            </div>

            {/* Buttons (Tags Filter & Upload) */}
            <div className="flex items-center gap-3 shrink-0">
              {isPublicAllFonts && (
                <button 
                  onClick={() => setIsTagModalOpen(true)}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-md relative cursor-pointer
                    ${publicTagFilters.length > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'}
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
              )}

              {isOwner && (
                <div className="relative flex items-center shrink-0 group">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="flex items-center gap-2.5 px-5 h-10 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 font-bold text-xs tracking-wide group/btn active:scale-95 text-right font-sans focus:outline-none shrink-0 cursor-pointer animate-fade-in"
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
          </div>
        </div>

        <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
          
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
      </div>
    </div>
  );
};
