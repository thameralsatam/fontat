import { forwardRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cssString } from '../../utils/text';
import type { ZoomGlyph } from './GlyphZoomModal';

export interface GridGlyph extends ZoomGlyph {
  isLigature?: boolean;
  isMapped?: boolean;
  colSpan?: number;
}

interface Props {
  glyphs: GridGlyph[];
  visibleCount: number;
  onSelect: (glyph: ZoomGlyph) => void;
  /** CSS family used for glyphs without an outline path */
  fontFamily?: string;
  /** detailed: scrolling panel with code / index / name labels (Lab). compact: small tiles (font details). */
  variant?: 'detailed' | 'compact';
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  id?: string;
}

const GlyphGrid = forwardRef<HTMLDivElement, Props>(function GlyphGrid(
  { glyphs, visibleCount, onSelect, fontFamily, variant = 'detailed', onScroll, id },
  ref,
) {
  const { t } = useLanguage();
  const family = fontFamily ? `"${cssString(fontFamily)}", sans-serif` : undefined;
  const detailed = variant === 'detailed';

  return (
    <div
      id={id}
      ref={ref}
      onScroll={onScroll}
      className={
        detailed
          ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 max-h-[350px] overflow-y-auto p-4 bg-black/40 rounded-2xl border border-white/5 custom-scrollbar'
          : 'grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-1.5 sm:gap-2 pb-8 p-1'
      }
    >
      {glyphs.slice(0, visibleCount).map((glyph) => {
        const pick = () =>
          onSelect({ char: glyph.char, name: glyph.name, unicode: glyph.unicode, index: glyph.index, svgPath: glyph.svgPath, svgViewBox: glyph.svgViewBox });
        const title = (glyph.unicode ? `U+${glyph.unicode}` : '') + (glyph.name ? ` (${glyph.name})` : '');
        const shape = glyph.svgPath ? (
          <svg viewBox={glyph.svgViewBox} className={`w-full h-full fill-current ${detailed ? 'text-[#cbd5e1]' : ''}`}>
            <path d={glyph.svgPath} />
          </svg>
        ) : (
          <span className="text-center whitespace-nowrap leading-none" style={{ fontFamily: family, fontSize: detailed ? '40px' : '18px' }}>
            {glyph.char}
          </span>
        );

        if (!detailed) {
          return (
            <button
              key={glyph.index}
              onClick={pick}
              aria-label={title || String(glyph.index)}
              className="h-[40px] md:h-[45px] p-2 rounded-xl bg-white/[0.02] border border-white/5 text-white/90 hover:border-white hover:text-white hover:bg-white/5 hover:scale-[1.12] flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-lg shadow-black/30"
              title={title}
            >
              {shape}
            </button>
          );
        }

        return (
          <button
            key={glyph.index}
            onClick={pick}
            title={title}
            className="gl-cell flex flex-col items-center justify-between p-2 cursor-pointer bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors h-full text-[#cbd5e1]"
          >
            <div className="w-full flex flex-col items-center justify-center flex-1 min-h-[60px] max-h-[80px]">{shape}</div>
            <div className="w-full flex flex-col items-center text-center mt-2 space-y-[2px] overflow-hidden" dir="ltr">
              <span className="text-[9px] text-white opacity-60 font-mono leading-tight truncate px-1">
                {glyph.unicode ? `U+${glyph.unicode}` : t('lab.no_unicode')}
              </span>
              <span className="text-[9px] text-white opacity-40 leading-tight">
                {t('lab.glyph_index')}: {glyph.index}
              </span>
              <span className="text-[9px] text-white opacity-80 truncate w-full px-1 leading-tight">{glyph.name || t('lab.unnamed')}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
});

export default GlyphGrid;
