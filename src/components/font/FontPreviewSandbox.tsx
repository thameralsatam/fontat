import React from 'react';
import { Font } from '../../types';
import { formatFontName } from '../../utils/text';
import { POEMS } from '../../constants/poems';

interface FontPreviewSandboxProps {
  selectedFontDetail: Font;
  detailLayoutMode: 'poem' | 'paragraph' | 'glyphs' | 'poster';
  activeTheme: {
    bg: string;
    cardBg: string;
    text: string;
    textSecondary: string;
    accentBg: string;
    btnAccent: string;
    accentGlow: string;
    borderColor: string;
    inputBg: string;
  };
  backdropChars: { char: string; className: string; fontSize?: string }[];
  selectedPoemIndex: number;
  setSelectedPoemIndex: (idx: number) => void;
  getPoemText: (id: string) => string;
  handlePoemChange: (id: string, val: string) => void;
  getPreviewText: (id: string) => string;
  handlePreviewChange: (id: string, val: string) => void;
  glyphSearch: string;
  setGlyphSearch: (val: string) => void;
  loadingGlyphs: boolean;
  filteredGlyphs: any[];
  renderedGlyphCount: number;
  setSelectedGlyphZoom: (glyph: any) => void;
  dir: 'rtl' | 'ltr' | 'auto';
}

export const FontPreviewSandbox: React.FC<FontPreviewSandboxProps> = ({
  selectedFontDetail,
  detailLayoutMode,
  activeTheme,
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
  setSelectedGlyphZoom,
  dir
}) => {
  return (
    <div 
      className={`min-h-[420px] flex flex-col rounded-3xl border ${activeTheme.borderColor} ${activeTheme.cardBg} transition-all duration-300 relative overflow-hidden shadow-2xl p-6 md:p-8 shrink-0`}
    >
      {/* Absolute subtle background decorative seal */}
      {backdropChars.map((item, idx) => (
        <div
          key={idx}
          className={item.className}
          style={{ 
            fontFamily: `"${selectedFontDetail.name}", sans-serif`,
            fontSize: item.fontSize || '280px'
          }}
        >
          {item.char}
        </div>
      ))}

      {/* RENDERING MODE: CLASSICAL POEM (أبيات الشعر) */}
      {detailLayoutMode === 'poem' && (
        <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">
          {/* Sub-Selection: Visual Preset Poetry Switcher */}
          <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar border-b border-white/[0.03] shrink-0">
            {POEMS.map((poem, idx) => (
              <button
                key={poem.title}
                onClick={() => setSelectedPoemIndex(idx)}
                className={`px-4 py-2 rounded-2xl cursor-pointer text-xs font-bold whitespace-nowrap transition-all flex flex-col items-start gap-1 border ${
                  selectedPoemIndex === idx
                    ? 'bg-white/10 border-white/20 text-white font-bold'
                    : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5'
                }`}
              >
                <span className="leading-none">{poem.title}</span>
                <span className="text-[9px] opacity-60 font-light font-sans">{poem.author}</span>
              </button>
            ))}
          </div>

          {/* Main Poem Textarea Wrapper - FIXED size to 15px directly */}
          <div className="flex-1 overflow-y-auto pr-1 min-h-[250px]">
            <textarea
              value={getPoemText(selectedFontDetail.id)}
              onChange={(e) => handlePoemChange(selectedFontDetail.id, e.target.value)}
              className={`w-full h-full min-h-[240px] bg-transparent border-none outline-none resize-none leading-loose focus:ring-0 text-center select-text font-serif ${activeTheme.text} transition-all`}
              style={{
                fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                fontSize: '15px',
                lineHeight: '1.9',
                fontFeatureSettings: 'normal',
                fontVariantLigatures: 'normal'
              }}
              placeholder={dir === 'rtl' ? 'ضع أبيات قصيدتك وعش سحر الكلمة...' : 'Write your classical poetry lines here...'}
            />
          </div>

          {/* Designer seal watermark */}
          <div className={`mt-auto pt-2 border-t border-white/[0.02] flex items-center justify-end ${activeTheme.textSecondary} text-[10px]`}>
            <div className="font-sans text-white/80 font-medium">
              {POEMS[selectedPoemIndex].author}
            </div>
          </div>
        </div>
      )}

      {/* RENDERING MODE: PARAGRAPH (الكتابة النثرية الحرة) */}
      {detailLayoutMode === 'paragraph' && (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
          {/* Short helper note */}
          <div className={`border-b border-white/[0.03] pb-2 text-[10px] uppercase font-bold tracking-widest ${activeTheme.textSecondary} select-none`}>
            {dir === 'rtl' ? 'معمل النثر الحر (اكتب أوعدّل بحرية)' : 'Prose Creative Sandbox (Fully Editable)'}
          </div>

          {/* Main Paragraph Textarea - FIXED size to 15px directly */}
          <div className="flex-1 overflow-y-auto min-h-[250px]">
            <textarea
              value={getPreviewText(selectedFontDetail.id)}
              onChange={(e) => handlePreviewChange(selectedFontDetail.id, e.target.value)}
              className={`w-full h-full min-h-[240px] bg-transparent border-none outline-none resize-none px-2 focus:ring-0 ${activeTheme.text} transition-all font-light`}
              style={{
                fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                fontSize: '15px',
                lineHeight: '1.8'
              }}
              placeholder={dir === 'rtl' ? 'ابدأ بصنع عباراتك البديعة هنا...' : 'Type anything dynamically to check the flow...'}
            />
          </div>

          {/* Tiny status metric */}
          <div className={`mt-auto pt-2 border-t border-white/[0.02] flex justify-end ${activeTheme.textSecondary} text-[9px] font-sans`}>
            <span>
              {getPreviewText(selectedFontDetail.id).length} {dir === 'rtl' ? 'حرف' : 'chars'}
            </span>
          </div>
        </div>
      )}

      {/* RENDERING MODE: GLYPHS MAP (خارطة الحروف للجغرافيين) */}
      {detailLayoutMode === 'glyphs' && (
        <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/[0.03] pb-3 select-none">
            <div className="flex flex-col font-sans">
              <span className="text-cyan-400 text-xs font-bold leading-none">
                {dir === 'rtl' ? 'اضغط على المحرف واستمتع!!' : 'Press on glyph and enjoy!!'}
              </span>
            </div>
            
            {/* Search input inside glyph map */}
            <div className="relative w-full md:w-56 shrink-0 font-sans">
              <input
                type="text"
                placeholder={dir === 'rtl' ? 'ابحث عن محرف معين...' : 'Search for glyph...'}
                value={glyphSearch}
                onChange={(e) => setGlyphSearch(e.target.value)}
                className={`w-full bg-white/[0.02] border border-white/5 rounded-xl py-1.5 px-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/30 transition-colors`}
              />
            </div>
          </div>

          {/* Characters Explorer Grid */}
          <div 
            className="flex-1 pr-1 flex flex-col gap-4 select-none min-h-[250px]"
          >
            {loadingGlyphs ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 font-sans">
                <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-white/40">{dir === 'rtl' ? 'جاري استخراج خارطة المحارف للخط...' : 'Extracting glyphs map...'}</span>
              </div>
            ) : filteredGlyphs.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-12 text-xs text-white/30 font-sans">
                {dir === 'rtl' ? 'لم يتم العثور على محارف تطابق البحث' : 'No matching glyphs found'}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-1.5 sm:gap-2 pb-8 p-1">
                {filteredGlyphs.slice(0, renderedGlyphCount).map((glyph, idx) => (
                  <button
                    key={`${glyph.unicode || idx}-${glyph.index}`}
                    onClick={() => setSelectedGlyphZoom({ char: glyph.char, name: glyph.name, svgPath: glyph.svgPath, svgViewBox: glyph.svgViewBox })}
                    className="h-[40px] md:h-[45px] p-2 rounded-xl bg-white/[0.02] border border-white/5 text-white/90 hover:border-white hover:text-white hover:bg-white/5 hover:scale-[1.12] flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-lg shadow-black/30"
                    style={{
                      gridColumn: `span ${Math.min(glyph.colSpan || 1, 6)}`
                    }}
                    title={(glyph.unicode ? `U+${glyph.unicode}` : '') + (glyph.name ? ` (${glyph.name})` : '')}
                  >
                    {glyph.svgPath ? (
                      <svg viewBox={glyph.svgViewBox} className="w-full h-full fill-current">
                        <path d={glyph.svgPath} />
                      </svg>
                    ) : (
                      <span className="text-center overflow-visible whitespace-nowrap leading-none" style={{ fontFamily: `"${selectedFontDetail.name}", sans-serif`, fontSize: '18px' }}>
                        {glyph.char}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer characters description */}
          <div className={`mt-auto pt-2 border-t border-white/[0.02] flex justify-end ${activeTheme.textSecondary} text-[9px] font-sans`}>
            <span>{selectedFontDetail.name}</span>
          </div>
        </div>
      )}

      {/* RENDERING MODE: EDITORIAL POSTER (ملصق احترافي دعائي) */}
      {detailLayoutMode === 'poster' && (
        <div className="flex-1 flex flex-col justify-between h-full relative p-4 border border-white/5 rounded-3xl overflow-hidden bg-gradient-to-br from-[#101010]/95 via-transparent to-transparent">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-white/10 rounded-tr-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-white/10 rounded-bl-3xl" />
          
          <div className="flex flex-col mt-0 relative z-10 text-right">
            {/* Large Headline Quote */}
            <div className="flex flex-col gap-4 text-right">
              <h2 
                className={`font-extrabold leading-tight tracking-tight ${activeTheme.text}`}
                style={{
                  fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                  fontSize: '28px'
                }}
              >
                خطوطنا تعبر عن مشاعرنا، وترسم بجمالها لوحة أفكارنا
              </h2>
              <p 
                className={`text-xs ${activeTheme.textSecondary} max-w-lg leading-relaxed mt-1`}
                style={{
                  fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                  fontSize: '14px'
                }}
              >
                {dir === 'rtl' 
                  ? 'صمم من أجل كتابة عربية فصحى تتمتع بالرقي والأصالة والخطوط المنسابة، هذا الخط هو رفيق مثالي لتجسيد المخطوطات والملصقات البديعة الراقية.'
                  : 'Specially engineered for Arabic typography, highlighting flow, elegance and historic heritage in modern UI compositions.'}
              </p>
            </div>
          </div>

          {/* Editorial Watermark Footer */}
          <div className="flex flex-row justify-between items-center mt-auto pt-4 pb-1 border-t border-white/[0.05] bg-black/40 rounded-b-3xl -mx-4 px-4 -mb-4 relative z-10 shrink-0 select-none gap-4">
            <div className="flex flex-col gap-1 text-right sm:text-left">
              <span className={`text-[10px] tracking-widest ${activeTheme.textSecondary} uppercase font-mono`}>
                {formatFontName(selectedFontDetail.name)}
              </span>
            </div>
            <div className="text-right font-display select-none pb-1">
              <span className="text-sm font-bold tracking-widest text-white leading-none">
                Fontat
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
