import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Download, ExternalLink, Beaker, Copy, Layout, BookOpen, Edit3, Sliders, Sparkles, ChevronDown, Plus, X, Dices } from 'lucide-react';
import { FontPreviewSandbox } from './FontPreviewSandbox';
import { Font } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadGlyphAsSvg } from '../../utils/svgExport';

interface DetailedFontViewProps {
  selectedFontDetail: Font | null;
  setSelectedFontDetail: (font: Font | null) => void;
  activeTheme: any;
  dir: 'rtl' | 'ltr' | 'auto';
  navigate: ReturnType<typeof import('react-router-dom').useNavigate>;
  isPublicAllFonts: boolean;
  id: string | undefined;
  setSelectedGlyphZoom: (zoom: any) => void;
  isDetailScrolled: boolean;
  setIsDetailScrolled: (val: boolean) => void;
  handleDownload: (url: string, name: string) => void;
  isExternalMenuOpen: boolean;
  setIsExternalMenuOpen: (val: boolean) => void;
  isTransferring: boolean;
  handleTransferToLab: (font: Font) => void;
  handleOpenSaveModal: () => void;
  detailLayoutMode: 'poem' | 'paragraph' | 'glyphs' | 'poster';
  setDetailLayoutMode: (mode: 'poem' | 'paragraph' | 'glyphs' | 'poster') => void;
  setRenderedGlyphCount: React.Dispatch<React.SetStateAction<number>>;
  getFontFormat: (url: string | undefined) => string;
  selectedFontWeights: any[];
  isWeightsMenuOpen: boolean;
  setIsWeightsMenuOpen: (val: boolean) => void;
  activeParentFontId: string | null;
  dbFonts: Font[];
  isOwner: boolean;
  setUploadingWeightFor: (id: string | null) => void;
  weightInputRef: React.RefObject<HTMLInputElement | null>;
  detectedLangs: string[];
  getSupportedLanguages: () => string;
  baseFontForMetadata: Font | null;
  setTagEditModal: React.Dispatch<React.SetStateAction<{isOpen: boolean, fontId: string|null, tagsText: string}>>;
  onTagClick?: (tag: string) => void;
  backdropChars: { char: string; className: string; fontSize?: string }[];
  selectedPoemIndex: number;
  setSelectedPoemIndex: (index: number) => void;
  getPoemText: (id: string) => string;
  handlePoemChange: (id: string, text: string) => void;
  getPreviewText: (id: string) => string;
  handlePreviewChange: (id: string, text: string) => void;
  glyphSearch: string;
  setGlyphSearch: (text: string) => void;
  loadingGlyphs: boolean;
  filteredGlyphs: any[];
  renderedGlyphCount: number;
  selectedGlyphZoom: any;
  addNotification: (type: 'success'|'error'|'info', message: string) => void;
  truncateTwoDots: (str: string, len: number) => string;
  formatFontName: (name: string) => string;
}

export const DetailedFontView: React.FC<DetailedFontViewProps> = ({
  selectedFontDetail,
  setSelectedFontDetail,
  activeTheme,
  dir,
  navigate,
  isPublicAllFonts,
  id,
  setSelectedGlyphZoom,
  isDetailScrolled,
  setIsDetailScrolled,
  handleDownload,
  isExternalMenuOpen,
  setIsExternalMenuOpen,
  isTransferring,
  handleTransferToLab,
  handleOpenSaveModal,
  detailLayoutMode,
  setDetailLayoutMode,
  setRenderedGlyphCount,
  getFontFormat,
  selectedFontWeights,
  isWeightsMenuOpen,
  setIsWeightsMenuOpen,
  activeParentFontId,
  dbFonts,
  isOwner,
  setUploadingWeightFor,
  weightInputRef,
  detectedLangs,
  getSupportedLanguages,
  baseFontForMetadata,
  setTagEditModal,
  onTagClick,
  backdropChars,
  selectedPoemIndex,
  setSelectedPoemIndex,
  getPoemText,
  handlePoemChange,
  getPreviewText,
  handlePreviewChange,
  glyphSearch,
  setGlyphSearch,
  loadingGlyphs,
  filteredGlyphs,
  renderedGlyphCount,
  selectedGlyphZoom,
  addNotification,
  truncateTwoDots,
  formatFontName
}) => {
  const { t } = useLanguage();
  if (!selectedFontDetail) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-[155] ${activeTheme.bg} transition-colors duration-700 flex flex-col font-sans select-none overflow-hidden`}
        dir={dir}
      >
        {/* Background Aesthetic Atmosphere Mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.06] ${activeTheme.accentGlow} animate-pulse duration-[8s]`} />
          <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.04] ${activeTheme.accentGlow} animate-pulse duration-[12s]`} />
          {/* Thin Blueprint Grid Overlay in Dark Themes */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
        </div>

        {/* Top Navigation & Action Header */}
        <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${isDetailScrolled ? 'border-white/20 bg-[#080808]/80' : 'border-transparent bg-transparent'} relative z-[200] backdrop-blur-md`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                navigate(isPublicAllFonts ? '/fonts' : `/my-fonts${id ? `?group=${id}` : ''}`);
                setSelectedFontDetail(null);
                setSelectedGlyphZoom(null);
                setIsDetailScrolled(false);
              }}
              className={`flex items-center gap-2 h-11 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 font-display`}
              title={dir === 'rtl' ? 'العودة للخلف' : 'Back'}
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4 text-white" /> : <ArrowLeft className="w-4 h-4 text-white" />}
              <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
            </button>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5">
            {/* Direct Download in Header */}
            {selectedFontDetail.download_url && (
              <button
                onClick={() => handleDownload(selectedFontDetail.download_url!, selectedFontDetail.name)}
                className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95 shadow-md shadow-white/5 focus:outline-none shrink-0 border border-white/10`}
                title={dir === 'rtl' ? 'تحميل ملف الخط مباشرة' : 'Download font directly'}
              >
                <Download className="w-5 h-5" />
              </button>
            )}

            {/* External Actions Dropdown */}
            <div className="relative external-menu-container">
              <button
                onClick={() => setIsExternalMenuOpen(!isExternalMenuOpen)}
                className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${isExternalMenuOpen ? 'bg-white text-black' : 'bg-white hover:bg-gray-200 text-black'} transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:outline-none shrink-0`}
                title={dir === 'rtl' ? 'إجراءات إضافية' : 'More actions'}
              >
                <ExternalLink className="w-5 h-5" />
              </button>

              <AnimatePresence>
                {isExternalMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className={`absolute top-[calc(100%+8px)] ${dir === 'rtl' ? 'left-0' : 'right-0'} w-[200px] bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 p-1.5`}
                  >
                    <button
                      disabled={isTransferring}
                      onClick={() => {
                        setIsExternalMenuOpen(false);
                        handleTransferToLab(selectedFontDetail);
                      }}
                      className={`flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer group disabled:opacity-50`}
                    >
                      {isTransferring ? (
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                      ) : (
                        <Beaker className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-amber-400 transition-colors" />
                      )}
                      <span className="text-xs font-bold leading-none">{dir === 'rtl' ? 'الفتح بالمختبر' : 'Open in Lab'}</span>
                    </button>
                    
                    <div className="h-[1px] w-full bg-white/5 my-0.5" />

                    <button
                      onClick={() => {
                        setIsExternalMenuOpen(false);
                        handleOpenSaveModal();
                      }}
                      className={`flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 text-white transition-colors cursor-pointer group`}
                    >
                      <Copy className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 transition-colors" />
                      <span className="text-xs font-bold leading-none shrink-0">{dir === 'rtl' ? 'الحفظ بمساحتي' : 'Save to Workspace'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Workspace - Vertical Stack, single-column */}
        <main 
          onScroll={(e) => {
            const target = e.currentTarget;
            setIsDetailScrolled(target.scrollTop > 10);
            
            if (detailLayoutMode === 'glyphs' && target.scrollHeight - target.scrollTop <= target.clientHeight + 800) {
              setRenderedGlyphCount(prev => prev + 200);
            }
          }}
          className="flex-1 overflow-y-auto w-full max-w-[1240px] mx-auto flex flex-col gap-6 p-4 md:p-6 pb-24 relative z-10 custom-scrollbar"
        >
          
          {/* TOP DASHBOARD CONTROL AREA (Stacked side-by-side on wide screens) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none shrink-0">
            
            {/* 1. LAYOUT COMPASS - CHOOSE MODE */}
            <div className={`${activeTheme.cardBg} rounded-3xl p-5 border ${activeTheme.borderColor} flex flex-col gap-4`}>
              <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
                <Layout className="w-4 h-4 text-white/80" />
                <span className={`text-[11px] uppercase tracking-wider font-bold ${activeTheme.textSecondary}`}>
                  {t('font_detail.preview_layout_mode')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'poem', label: t('font_detail.classical_poem'), icon: BookOpen },
                  { id: 'paragraph', label: t('font_detail.extended_text'), icon: Edit3 },
                  { id: 'glyphs', label: t('font_detail.glyph_explorer'), icon: Sliders },
                  { id: 'poster', label: t('font_detail.artistic_poster'), icon: Sparkles }
                ].map(mode => {
                  const Icon = mode.icon;
                  const isActive = detailLayoutMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setDetailLayoutMode(mode.id as any)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer text-xs select-none text-right transition-all duration-300 border ${
                        isActive 
                          ? 'bg-white/10 border-white/20 text-white font-bold shadow-lg shadow-white/5'
                          : 'bg-white/[0.02] border-white/5 text-white/50 font-normal hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                      <span>{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SPEC SHEET & METADATA info */}
            <div className={`${activeTheme.cardBg} rounded-3xl p-5 border ${activeTheme.borderColor} flex flex-col gap-3.5 relative z-30`}>
              <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30 pb-1.5 border-b border-white/[0.03] font-display">
                <span>{t('font_detail.tech_specs')}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[11px]">
                <div className="flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center">
                  <span className={activeTheme.textSecondary}>{t('font_detail.format')}</span>
                  <span className={`${activeTheme.text} font-bold font-mono mt-1 uppercase`}>
                    {getFontFormat(selectedFontDetail.download_url)}
                  </span>
                </div>
                <div className={`flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center relative group/weights weights-menu-container ${isWeightsMenuOpen ? 'z-50' : 'z-10'}`}>
                  <span className={activeTheme.textSecondary}>{t('font_detail.weights')}</span>
                  
                  {selectedFontWeights.length > 0 ? (
                    <div className="relative mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsWeightsMenuOpen(!isWeightsMenuOpen);
                        }}
                        className={`w-full bg-white/[0.05] border border-white/10 ${activeTheme.text} hover:bg-white/10 font-bold text-[10px] rounded px-2 py-1 transition-colors flex items-center justify-between gap-1`}
                      >
                        <span className="flex-1 text-center font-mono">
                          {selectedFontDetail?.id === activeParentFontId 
                            ? t('font_detail.base')
                            : truncateTwoDots(formatFontName(selectedFontWeights.find(w => w.child_font_id === selectedFontDetail?.id)?.child_font?.name || selectedFontDetail?.name || ''), 10)}
                        </span>
                        <ChevronDown className="w-3 h-3 shrink-0" />
                      </button>
                      
                      <AnimatePresence>
                        {isWeightsMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-1/2 -translate-x-1/2 min-w-[140px] md:min-w-[170px] mt-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[100] max-h-[160px] overflow-y-auto custom-scrollbar font-sans"
                          >
                            <button
                              onClick={() => {
                                const parentFont = dbFonts.find(f => f.id === activeParentFontId);
                                if (parentFont) setSelectedFontDetail(parentFont);
                                setIsWeightsMenuOpen(false);
                              }}
                              className={`w-full text-center px-3 py-2 text-[10px] font-bold transition-colors ${selectedFontDetail?.id === activeParentFontId ? 'bg-cyan-500/20 text-cyan-400 font-mono' : 'text-white/80 hover:bg-white/10 font-mono'}`}
                            >
                              {t('font_detail.base')}
                            </button>
                            {selectedFontWeights.map(w => (
                              <button
                                key={w.child_font_id}
                                onClick={() => {
                                  if (w.child_font) {
                                    setSelectedFontDetail(w.child_font as Font);
                                  }
                                  setIsWeightsMenuOpen(false);
                                }}
                                className={`w-full text-center px-3 py-2 text-[10px] font-bold transition-colors ${selectedFontDetail?.id === w.child_font_id ? 'bg-cyan-500/20 text-cyan-400 font-mono' : 'text-white/80 hover:bg-white/10 font-mono'}`}
                              >
                                {truncateTwoDots(formatFontName(w.child_font?.name || ''), 10)}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <span className={`${activeTheme.text} font-bold mt-1 text-[11px] truncate`}>
                      -
                    </span>
                  )}

                  {isOwner && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeParentFontId) {
                          setUploadingWeightFor(activeParentFontId);
                          weightInputRef.current?.click();
                        }
                      }}
                      className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/weights:opacity-100 bg-cyan-500/90 text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-cyan-400 transition-all hover:bg-cyan-400 whitespace-nowrap shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                    >
                      + {dir === 'rtl' ? 'إضافة وزن' : 'Add weight'}
                    </button>
                  )}
                </div>
                <div className="flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center">
                  <span className={activeTheme.textSecondary}>{t('font_detail.languages')}</span>
                  <span className={`${activeTheme.text} font-bold mt-1 truncate`} title={detectedLangs.length > 0 ? detectedLangs.join(', ') : getSupportedLanguages()}>
                    {getSupportedLanguages()}
                  </span>
                </div>
              </div>

              {/* Isolated Tag view within details */}
              <div className="flex flex-col gap-1.5 mt-1 border-t border-white/[0.03] pt-3">
                <div className="flex items-center justify-between">
                  <span className={`${activeTheme.textSecondary} text-[11px] font-bold`}>{t('font_detail.tags')}</span>
                  {isOwner && baseFontForMetadata && (
                    <button 
                      onClick={() => setTagEditModal({ isOpen: true, fontId: baseFontForMetadata.id, tagsText: baseFontForMetadata.tags?.join(', ') || '' })}
                      className="hover:bg-white/10 p-1 rounded transition-colors text-white/50 hover:text-white"
                      title={t('font_detail.edit_tags')}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {(!baseFontForMetadata?.tags || baseFontForMetadata.tags.length === 0) ? (
                  <span className={`font-light ${activeTheme.textSecondary} opacity-40 text-xs`}>{t('font_detail.no_tags')}</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {baseFontForMetadata.tags.map(tag => (
                      <button 
                        key={tag} 
                        onClick={(e) => {
                           e.stopPropagation();
                           navigate(isPublicAllFonts ? '/fonts' : `/my-fonts${id ? `?group=${id}` : ''}`);
                           setSelectedFontDetail(null);
                           setSelectedGlyphZoom(null);
                           setIsDetailScrolled(false);
                           onTagClick?.(tag);
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border ${activeTheme.accentBg} hover:bg-white/10 transition-colors select-none font-medium cursor-pointer flex items-center gap-1`}
                      >
                        <span className="opacity-50 font-mono text-cyan-400">#</span>
                        <span>{tag}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* PRIMARY INTERACTIVE PREVIEW SANDBOX (THE LONG TEXT SPACE - ثابت عادي بالشاشة) */}
          <FontPreviewSandbox
            selectedFontDetail={selectedFontDetail}
            detailLayoutMode={detailLayoutMode}
            activeTheme={activeTheme}
            backdropChars={backdropChars}
            selectedPoemIndex={selectedPoemIndex}
            setSelectedPoemIndex={setSelectedPoemIndex}
            getPoemText={getPoemText}
            handlePoemChange={handlePoemChange}
            getPreviewText={getPreviewText}
            handlePreviewChange={handlePreviewChange}
            glyphSearch={glyphSearch}
            setGlyphSearch={setGlyphSearch}
            loadingGlyphs={loadingGlyphs}
            filteredGlyphs={filteredGlyphs}
            renderedGlyphCount={renderedGlyphCount}
            setSelectedGlyphZoom={setSelectedGlyphZoom}
            dir={dir as "rtl" | "ltr" | "auto"}
          />

        </main>

        {/* Giant ZOOM LENS Portal overlay for calligraphic glyph zoom */}
        <AnimatePresence>
          {selectedGlyphZoom && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedGlyphZoom(null)}
                className="absolute inset-0 bg-[#020202]/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                className="relative bg-[#0d0d0d] border border-cyan-400/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center gap-6 z-10 text-center"
              >
                <div className="absolute top-5 right-5">
                  <button 
                    onClick={() => setSelectedGlyphZoom(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30">
                  {t('lab.macro_geometry')}
                </div>

                {/* Character Lens display */}
                <div 
                  className="text-[110px] select-all leading-none py-10 text-white cursor-help select-text font-serif"
                  style={{
                    fontFamily: `"${selectedFontDetail.name}", sans-serif`
                  }}
                  title={t('lab.drag_or_copy')}
                >
                  {selectedGlyphZoom?.svgPath ? (
                    <svg viewBox={selectedGlyphZoom.svgViewBox} className="w-[120px] h-[120px] fill-current">
                      <path d={selectedGlyphZoom.svgPath} />
                    </svg>
                  ) : (
                    selectedGlyphZoom?.char
                  )}
                </div>

                {/* Metadata detail & Copy / Insert / Export Actions */}
                <div className="w-full flex flex-col gap-2.5 pb-2 mt-4 font-sans">
                  {selectedGlyphZoom?.name && (
                    <div className="text-white/40 text-xs font-mono">{selectedGlyphZoom.name}</div>
                  )}
                  
                  {/* 1. Copy character string */}
                  {selectedGlyphZoom?.char && (
                    <button
                      onClick={() => {
                        if (selectedGlyphZoom?.char) {
                          navigator.clipboard.writeText(selectedGlyphZoom.char);
                          addNotification('success', t('lab.char_copied'));
                        }
                      }}
                      className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-lg shadow-cyan-400/10"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{t('lab.copy_char_text')}</span>
                    </button>
                  )}

                  {/* 2. Add to preview */}
                  {selectedGlyphZoom?.char && (
                    <button
                      onClick={() => {
                        if (selectedGlyphZoom?.char && selectedFontDetail) {
                          const currentText = getPreviewText(selectedFontDetail.id);
                          handlePreviewChange(selectedFontDetail.id, currentText + selectedGlyphZoom.char);
                          addNotification('success', t('lab.char_added'));
                          setSelectedGlyphZoom(null);
                        }
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs border border-white/5"
                    >
                      <Plus className="w-4 h-4 text-cyan-400" />
                      <span>{t('lab.add_to_preview')}</span>
                    </button>
                  )}

                  {/* 3. Export as SVG */}
                  {(selectedGlyphZoom?.char || selectedGlyphZoom?.svgPath) && (
                    <button
                      onClick={async () => {
                        const success = await downloadGlyphAsSvg(selectedGlyphZoom, selectedFontDetail?.name || 'font', selectedFontDetail?.download_url);
                        if (success) {
                          addNotification('success', t('lab.svg_exported'));
                        }
                      }}
                      className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs border border-white/10"
                    >
                      <Download className="w-4 h-4 text-cyan-400" />
                      <span>{t('lab.export_svg')}</span>
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Hyperdrive Digital Portal Portal Animation Overlay */}
        <AnimatePresence>
          {isTransferring && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center text-center p-6 select-none"
            >
              <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                {/* Ring Animations */}
                {[1, 2, 3].map(ringIdx => (
                  <motion.div
                    key={ringIdx}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 2.5], opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: ringIdx * 0.9, ease: 'easeOut' }}
                    className="absolute inset-0 m-auto w-[250px] h-[250px] border border-cyan-400/20 rounded-full"
                  />
                ))}
                {/* Glowing Stars */}
                <div className="absolute inset-0 bg-[radial-gradient(#22d3ee08_1px,transparent_1px)] [background-size:24px_24px]" />
              </div>

              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-cyan-400/10 border-2 border-cyan-400/40 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                  <Dices className="w-8 h-8 text-cyan-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                    {t('font_detail.digitizing')}
                  </h2>
                  <p className="text-[#94a3b8] text-sm font-light leading-relaxed max-w-sm mx-auto">
                    {dir === 'rtl' 
                      ? 'يتم أخذ عينة فيزيائية ثنائية وتجهيز كود التحميل الفوري للمحاكاة ثلاثية الأبعاد.' 
                      : 'Preparing vectors and layout coordinates for advanced multi-axis rendering in the Lab.'}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AnimatePresence>
  );
};
