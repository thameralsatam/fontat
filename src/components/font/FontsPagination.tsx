import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface FontsPaginationProps {
  currentPage: number;
  setCurrentPage: (page: number) => void;
  displayFontsLength: number;
  itemsPerPage: number;
  dir: 'ltr' | 'rtl' | 'auto';
}

export const FontsPagination: React.FC<FontsPaginationProps> = ({
  currentPage,
  setCurrentPage,
  displayFontsLength,
  itemsPerPage,
  dir
}) => {
  const totalPages = Math.ceil(displayFontsLength / itemsPerPage);
  
  if (totalPages <= 1) return null;

  const isRtl = dir === 'rtl';

  return (
    <div className="flex flex-col items-center justify-center gap-4 mt-12 pt-6 border-t border-white/5 font-sans mb-8 select-none">
      <div className="flex items-center justify-center gap-2">
        {/* FIRST PAGE BUTTON */}
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage <= 1}
          className={`w-10 h-10 bg-white/[0.02] border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300 text-white/50 hover:scale-105 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-95 cursor-pointer ${
            currentPage > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isRtl ? 'الصفحة الأولى' : 'First Page'}
        >
          {isRtl ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
        </button>

        {/* PREVIOUS PAGE BUTTON */}
        <button
          onClick={() => setCurrentPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className={`w-10 h-10 bg-white/[0.02] border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300 text-white/70 hover:scale-105 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-95 cursor-pointer ${
            currentPage > 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isRtl ? 'الصفحة السابقة' : 'Previous Page'}
        >
          {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {/* MIDDLE TEXT: Page X of Y */}
        <div className="px-5 h-10 bg-[#0d0d10]/60 border border-white/5 rounded-xl flex items-center justify-center text-sm font-medium text-white/80 min-w-[110px] shadow-inner">
          {isRtl ? (
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-300 font-semibold">{currentPage}</span>
              <span className="text-[#5d5d6a] font-normal leading-none">من</span>
              <span className="text-white font-semibold">{totalPages}</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-cyan-300 font-semibold">{currentPage}</span>
              <span className="text-[#5d5d6a] font-normal leading-none">of</span>
              <span className="text-white font-semibold">{totalPages}</span>
            </span>
          )}
        </div>

        {/* NEXT PAGE BUTTON */}
        <button
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={`w-10 h-10 bg-white/[0.02] border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300 text-white/70 hover:scale-105 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-95 cursor-pointer ${
            currentPage < totalPages ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isRtl ? 'الصفحة التالية' : 'Next Page'}
        >
          {isRtl ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </button>

        {/* LAST PAGE BUTTON */}
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage >= totalPages}
          className={`w-10 h-10 bg-white/[0.02] border border-white/5 hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-300 text-white/50 hover:scale-105 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-95 cursor-pointer ${
            currentPage < totalPages ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title={isRtl ? 'الصفحة الأخيرة' : 'Last Page'}
        >
          {isRtl ? <ChevronsLeft className="w-5 h-5" /> : <ChevronsRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
};
