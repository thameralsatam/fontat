import { AnimatePresence, motion } from 'framer-motion';
import { X, Copy, Plus, Download } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useGlobal } from '../../contexts/GlobalContext';
import { downloadGlyphAsSvg } from '../../utils/svgExport';
import { cssString } from '../../utils/text';

export interface ZoomGlyph {
  char?: string;
  name?: string;
  unicode?: string;
  index?: number;
  svgPath?: string;
  svgViewBox?: string;
}

interface Props {
  glyph: ZoomGlyph | null;
  onClose: () => void;
  /** appends the character to the preview text */
  onInsert?: (char: string) => void;
  fontName: string;
  /** blob / url used by the SVG export */
  fontSource?: Blob | ArrayBuffer | string | null;
  /** CSS family used when a glyph has no outline path */
  fontFamily?: string;
}

export default function GlyphZoomModal({ glyph, onClose, onInsert, fontName, fontSource, fontFamily }: Props) {
  const { t } = useLanguage();
  const { addNotification } = useGlobal();

  return (
    <AnimatePresence>
      {glyph && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-[#020202]/90 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, y: 15 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 15 }}
            className="relative bg-[#0d0d0d] border border-cyan-400/10 rounded-[2.5rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(6,182,212,0.15)] flex flex-col justify-center items-center gap-6 z-10 text-center"
          >
            <div className="absolute top-5 end-5">
              <button
                onClick={onClose}
                aria-label={t('common.close')}
                className="p-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30 font-sans">{t('lab.macro_geometry')}</div>

            <div
              className="min-h-[140px] flex justify-center items-center py-6 w-full max-w-[200px] mx-auto select-text"
              title={t('lab.drag_or_copy')}
            >
              {glyph.svgPath ? (
                <svg viewBox={glyph.svgViewBox} className="w-full h-auto fill-current text-white max-h-[180px]">
                  <path d={glyph.svgPath} />
                </svg>
              ) : (
                <span
                  className="text-[110px] leading-none text-white"
                  style={{ fontFamily: fontFamily ? `"${cssString(fontFamily)}", sans-serif` : undefined }}
                >
                  {glyph.char}
                </span>
              )}
            </div>

            <div className="w-full flex flex-col gap-2.5 pb-2 mt-2 font-sans">
              <div className="text-white/40 text-[11px] font-mono text-center pb-2 flex flex-col gap-0.5" dir="ltr">
                {glyph.name && <span>{glyph.name}</span>}
                <span>
                  {glyph.unicode ? `U+${glyph.unicode}` : t('lab.no_unicode')}
                  {glyph.index !== undefined ? ` · #${glyph.index}` : ''}
                </span>
              </div>

              {glyph.char && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(glyph.char!);
                    addNotification('success', t('lab.char_copied'));
                  }}
                  className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-lg shadow-cyan-400/10"
                >
                  <Copy className="w-4 h-4" />
                  <span>{t('lab.copy_char_text')}</span>
                </button>
              )}

              {glyph.char && onInsert && (
                <button
                  onClick={() => {
                    onInsert(glyph.char!);
                    addNotification('success', t('lab.char_added'));
                    onClose();
                  }}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs border border-white/5"
                >
                  <Plus className="w-4 h-4 text-cyan-400" />
                  <span>{t('lab.add_to_preview')}</span>
                </button>
              )}

              {(glyph.char || glyph.svgPath) && (
                <button
                  onClick={async () => {
                    if (await downloadGlyphAsSvg(glyph, fontName, fontSource)) addNotification('success', t('lab.svg_exported'));
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
  );
}
