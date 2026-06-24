import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FontsPaginationProps {
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  displayFontsLength: number;
  itemsPerPage: number;
  dir: 'ltr' | 'rtl' | 'auto';
  t: (key: string) => string;
}

export const FontsPagination: React.FC<FontsPaginationProps> = ({
  currentPage,
  setCurrentPage,
  displayFontsLength,
  itemsPerPage,
  dir,
  t
}) => {
  const totalPages = Math.ceil(displayFontsLength / itemsPerPage);
  
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-8 pt-6 border-t border-white/5 font-sans mb-8">
      <div className="text-sm text-white/50 w-full sm:w-auto text-center sm:text-left">
        {t('pagination.page')} <span className="font-semibold text-white mx-2">{currentPage}</span> {t('pagination.of')} <span className="font-semibold text-white mx-2">{totalPages}</span>
      </div>
      
      <div className="flex items-center justify-center flex-wrap gap-2 w-full sm:w-auto">
        <button
          onClick={() => {
            if (currentPage > 1) {
              setCurrentPage(prev => prev - 1);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 50);
            }
          }}
          disabled={currentPage === 1}
          className="h-10 px-4 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 text-white/70 rounded-xl transition-all duration-300 flex items-center gap-1.5 active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:scale-100 cursor-pointer text-sm"
        >
          {dir === 'rtl' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          <span>{t('pagination.prev')}</span>
        </button>

        <div className="hidden sm:flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            // Only show current page, 1, last page, and pages close to current
            if (totalPages > 6 && p !== 1 && p !== totalPages && Math.abs(p - currentPage) > 1) {
              if (p === 2 && currentPage > 3) {
                return <span key="dots-prev" className="text-white/30 px-1 font-light">...</span>;
              }
              if (p === totalPages - 1 && currentPage < totalPages - 2) {
                return <span key="dots-next" className="text-white/30 px-1 font-light">...</span>;
              }
              return null;
            }

            return (
              <button
                key={p}
                onClick={() => {
                  setCurrentPage(p);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }, 50);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-medium transition-all duration-300 cursor-pointer text-sm
                  ${currentPage === p 
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' 
                    : 'bg-white/[0.02] border border-white/5 text-white/55 hover:bg-white/5 hover:border-white/10 hover:text-white active:scale-95'}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => {
            if (currentPage < totalPages) {
              setCurrentPage(prev => prev + 1);
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 50);
            }
          }}
          disabled={currentPage === totalPages}
          className="h-10 px-4 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 text-white/70 rounded-xl transition-all duration-300 flex items-center gap-1.5 active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:scale-100 cursor-pointer text-sm"
        >
          <span>{t('pagination.next')}</span>
          {dir === 'rtl' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
