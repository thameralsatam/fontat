import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Trash2, Check, Plus, Layers } from 'lucide-react';
import { Font } from '../../types';
import { formatFontName } from '../../utils/text';

export interface FontCardProps {
  item: Font & { sessionLocalUrl?: string };
  index: number;
  pulseFontId: string | null;
  setShowFuturisticHint: (v: boolean) => void;
  navigate: (path: string) => void;
  isPublicAllFonts: boolean;
  groupId?: string;
  setSelectedFontDetail: (font: Font) => void;
  setActiveParentFontId: (id: string) => void;
  dir: 'rtl' | 'ltr' | 'auto';
  handleDownload: (url: string, name: string) => void;
  isOwner: boolean;
  setDeleteFontModal: (modal: { isOpen: boolean; fontId: string | null }) => void;
  getPreviewText: (id: string) => string;
  handlePreviewChange: (id: string, text: string) => void;
  fontSize: number;
  parentFontIds: Set<string>;
  isAdmin: boolean;
  onTagClick?: (tag: string) => void;
  setTagEditModal: (modal: { isOpen: boolean; fontId: string | null; tagsText: string }) => void;
  openWeightsModal: (font: Font) => void;
}

export const FontCard: React.FC<FontCardProps> = ({
  item,
  index,
  pulseFontId,
  setShowFuturisticHint,
  navigate,
  isPublicAllFonts,
  groupId,
  setSelectedFontDetail,
  setActiveParentFontId,
  dir,
  handleDownload,
  isOwner,
  setDeleteFontModal,
  getPreviewText,
  handlePreviewChange,
  fontSize,
  parentFontIds,
  isAdmin,
  onTagClick,
  setTagEditModal,
  openWeightsModal,
}) => {
  const [showSuccessCheck, setShowSuccessCheck] = useState(false);

  useEffect(() => {
    if (item.metadata?.status === 'success') {
      const completedAt = item.metadata.completedAt || Date.now();
      const elapsed = Date.now() - completedAt;
      const remaining = 5000 - elapsed;
      if (remaining > 0) {
        setShowSuccessCheck(true);
        const timer = setTimeout(() => {
          setShowSuccessCheck(false);
        }, remaining);
        return () => clearTimeout(timer);
      } else {
        setShowSuccessCheck(false);
      }
    } else {
      setShowSuccessCheck(false);
    }
  }, [item.metadata?.status, item.metadata?.completedAt]);
  return (
    <motion.div
      id={`font-card-${item.id}`}
      data-index={index}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.15, delay: index * 0.02 }}
      className={`group font-card-item bg-[#141414] p-4 rounded-2xl border transition-all duration-500 flex flex-col gap-3 relative overflow-hidden border-white/5 hover:border-white/10 hover:shadow-[0_0_30px_rgba(255,255,255,0.02)] cursor-pointer ${
        pulseFontId === item.id
          ? 'ring-1 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.15)]'
          : 'ring-0 ring-transparent shadow-none'
      }`}
      onClick={() => {
        localStorage.setItem('fontinfo_hint_dismissed', 'true');
        setShowFuturisticHint(false);
        navigate(
          isPublicAllFonts
            ? `/fonts/${item.name}`
            : `/my-fonts/${item.id}${groupId ? `?group=${groupId}` : ''}`
        );
        setSelectedFontDetail(item);
        setActiveParentFontId(item.id);
      }}
    >
      <div className="flex items-center justify-between w-full gap-4 relative">
        <div
          className="flex items-center gap-4 min-w-0 relative z-10"
          title={dir === 'rtl' ? 'انقر لعرض تفاصيل الخط' : 'Click to view font details'}
        >
          <div className="bg-white/5 w-10 h-10 rounded-xl text-white opacity-60 group-hover:text-white group-hover:bg-white/15 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all shrink-0 flex items-center justify-center overflow-hidden">
            {(!item.metadata?.isUploading || item.download_url || item.sessionLocalUrl) && (
              <span
                style={{
                  fontFamily: `"${item.name}", sans-serif`,
                  fontSize: '22px',
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {dir === 'rtl' ? 'ع' : 'a'}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 relative group/title">
            <div className="flex items-center gap-3">
              <div className="font-medium text-base text-white/50 group-hover:text-white flex-1 flex flex-wrap items-center gap-2 min-w-0 transition-colors duration-300">
                <span dir="ltr" className="truncate text-left block">
                  {formatFontName(item.name || '')}
                </span>
                {showSuccessCheck && (
                  <Check className="w-3.5 h-3.5 text-white/50 group-hover:text-white flex-shrink-0 transition-colors" />
                )}
                <span className="text-[10px] uppercase font-bold text-transparent bg-clip-text bg-gradient-to-r from-white/40 to-white/20 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 group-hover:mr-2 rtl:group-hover:-translate-x-0 rtl:group-hover:translate-x-2 rtl:translate-x-2 rtl:-mr-2 transition-all duration-300">
                  {dir === 'rtl' ? 'التفاصيل' : 'Details'}
                </span>
              </div>
              {item.metadata?.error && (
                <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                  Failed
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center shrink-0 gap-1.5 relative z-10 transition-all duration-300">
          {item.download_url && !item.metadata?.isUploading && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (item.download_url) handleDownload(item.download_url, item.name);
              }}
              className="w-9 h-9 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-400 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-90 cursor-pointer shadow-sm"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
          {isOwner && !item.metadata?.isUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteFontModal({ isOpen: true, fontId: item.id });
              }}
              className="w-9 h-9 bg-white/[0.03] hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-white/50 hover:text-red-400 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-90 cursor-pointer shadow-sm"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="w-full relative group/textarea">
        <textarea
          value={getPreviewText(item.id)}
          onChange={(e) => {
            handlePreviewChange(item.id, e.target.value);
          }}
          onFocus={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="w-full bg-transparent border-none outline-none text-white font-light resize-none -ml-3 p-3 overflow-hidden whitespace-nowrap"
          style={{
            fontFamily: `"${item.name}", sans-serif`,
            fontSize: `${fontSize}px`,
            lineHeight: '1.6',
            height: `${fontSize * 1.6 * 1 + 24}px`,
            minHeight: `${fontSize * 1.6 * 1 + 24}px`,
            maxHeight: `${fontSize * 1.6 * 1 + 24}px`,
            fontFeatureSettings: 'normal',
            fontVariantLigatures: 'normal',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            whiteSpace: 'nowrap',
          }}
        />
      </div>

      {/* Bottom Hashtags & Weights Section */}
      {!item.metadata?.isUploading && (
        <div
          className="mt-auto pt-2 bg-transparent flex items-center gap-1 relative z-20 border-t border-white/[0.02]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-full bg-black/40 backdrop-blur-md rounded-xl p-1 flex items-center justify-between border border-white/5 relative overflow-hidden h-[34px]">
            {/* Tags Slider Area */}
            <div className="flex-1 overflow-hidden relative h-full flex items-center">
              <div
                className={`flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 ${
                  dir === 'rtl' ? 'pl-8' : 'pr-8'
                }`}
              >
                {(item.tags || item.metadata?.tags || []).map((tag: string) => (
                  <button
                    key={tag}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTagClick?.(tag);
                    }}
                    className="text-[10px] bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 px-2.5 py-1 rounded-lg text-white/60 cursor-pointer transition-all duration-300 flex items-center gap-1 font-sans font-light shrink-0"
                  >
                    <span className="text-cyan-400 opacity-50 font-mono">#</span>
                    <span>{tag}</span>
                  </button>
                ))}
                {(isOwner || (isPublicAllFonts && isAdmin)) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setTagEditModal({ isOpen: true, fontId: item.id, tagsText: '' });
                    }}
                    className="w-6 h-6 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0"
                    title={dir === 'rtl' ? 'إضافة هاشتاغ جديد' : 'Add new tag'}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Fade Mask */}
              <div
                className={`absolute top-0 bottom-0 pointer-events-none z-10 w-8 ${
                  dir === 'rtl'
                    ? 'left-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent'
                    : 'right-0 bg-gradient-to-l from-black/80 via-black/50 to-transparent'
                }`}
              />

              {/* Weights action */}
              <div
                className={`absolute z-20 top-1/2 -translate-y-1/2 px-1.5 ${
                  dir === 'rtl' ? 'left-0' : 'right-0'
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openWeightsModal(item);
                  }}
                  className={`w-6 h-6 cursor-pointer transition-all duration-300 flex items-center justify-center rounded-lg shrink-0 ${
                    parentFontIds.has(item.id)
                      ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 hover:scale-110 shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                      : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                  title={dir === 'rtl' ? 'أوزان الخط' : 'Font Weights'}
                >
                  <Layers className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
