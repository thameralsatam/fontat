import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { formatFontName } from '../utils/text';

export interface SearchResult {
  id: string;
  name: string;
  group_name: string;
  metadata?: any;
  download_url?: string;
  total_count: number;
  group_id?: string;
  tags?: string[];
}

interface SmartSearchProps {
  mode: 'public' | 'private';
  onSelect: (result: SearchResult | { type: 'tag', tag: string }) => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ mode, onSelect }) => {
  const { t, dir } = useLanguage();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadedFontIds, setLoadedFontIds] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ✅ FIX: Map بدل array — نتتبع كل FontFace بـ id لمنع التراكم
  const loadedFontsMapRef = useRef<Map<string, FontFace>>(new Map());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchTerm = query.trim().startsWith('#') ? query.trim().substring(1) : query.trim();
        const { data, error } = await supabase.rpc('smart_search', {
          search_term: searchTerm || ' ',
          p_mode: mode
        });

        if (error) {
          console.error('Error in smart_search:', error);
          setResults([]);
        } else {
          setResults(data || []);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Error in smart_search:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query, mode]);

  // ✅ FIX: نستخدم Map لتتبع الخطوط — نحمّل فقط اللي مو محمّل، ونمسح اللي مو مطلوب
  useEffect(() => {
    if (results.length === 0) {
      // مسح كل الخطوط المحمّلة عند إخلاء النتائج
      loadedFontsMapRef.current.forEach(font => {
        try { document.fonts.delete(font); } catch (_) {}
      });
      loadedFontsMapRef.current.clear();
      setLoadedFontIds(new Set());
      return;
    }

    let cancelled = false;

    const loadFonts = async () => {
      const currentIds = new Set(results.map(r => r.id).filter(Boolean));
      const newIds = new Set<string>();

      // مسح الخطوط اللي ما عادت في النتائج
      loadedFontsMapRef.current.forEach((font, id) => {
        if (!currentIds.has(id)) {
          try { document.fonts.delete(font); } catch (_) {}
          loadedFontsMapRef.current.delete(id);
        }
      });

      for (const result of results) {
        if (cancelled) break;
        if (!result.download_url || !result.id) continue;
        // تخطي اللي محمّل مسبقاً
        if (loadedFontsMapRef.current.has(result.id)) {
          newIds.add(result.id);
          continue;
        }

        try {
          const fontName = `search-preview-${result.id}`;
          const font = new FontFace(fontName, `url(${result.download_url})`);
          await font.load();
          if (cancelled) break;
          document.fonts.add(font);
          loadedFontsMapRef.current.set(result.id, font);
          newIds.add(result.id);
        } catch (_) {
          // فشل تحميل الخط — نتجاهل بصمت
        }
      }

      if (!cancelled) {
        setLoadedFontIds(new Set(newIds));
      }
    };

    loadFonts();

    return () => {
      cancelled = true;
    };
  }, [results]);

  // ✅ Cleanup عند unmount — مسح كل الخطوط
  useEffect(() => {
    return () => {
      loadedFontsMapRef.current.forEach(font => {
        try { document.fonts.delete(font); } catch (_) {}
      });
      loadedFontsMapRef.current.clear();
    };
  }, []);

  const handleSelect = useCallback((result: SearchResult | { type: 'tag', tag: string }) => {
    setIsOpen(false);
    setQuery('');
    onSelect(result);
  }, [onSelect]);

  const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
  const additionalCount = totalCount > 5 ? totalCount - results.length : 0;

  const isHashtagSearch = query.trim().startsWith('#');
  const hashtagSearchTerm = query.trim().substring(1).trim().toLowerCase();

  const uniqueTags = new Set<string>();
  if (mode === 'public' && isHashtagSearch) {
    results.forEach(result => {
      const resultTags = Array.isArray(result.tags) ? result.tags : (result.metadata?.tags || []);
      if (Array.isArray(resultTags)) {
        resultTags.forEach(tag => {
          if (tag && typeof tag === 'string') {
            const cleanedTag = tag.trim();
            if (!hashtagSearchTerm || cleanedTag.toLowerCase().includes(hashtagSearchTerm)) {
              uniqueTags.add(cleanedTag);
            }
          }
        });
      }
    });
  }
  const tagsList = Array.from(uniqueTags).slice(0, 15);

  return (
    <div ref={wrapperRef} className="relative w-full mx-auto z-50" dir={dir}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder={t('search.placeholder')}
          className={`w-full bg-[#141414] border border-white/10 rounded-full py-3 text-white placeholder-white/40 outline-none focus:border-white/20 transition-all font-light ${dir === 'rtl' ? 'pr-12 pl-12' : 'pl-12 pr-12'}`}
        />
        <div className={`absolute pointer-events-none ${dir === 'rtl' ? 'right-4' : 'left-4'}`}>
          {loading ? (
            <Loader2 className="w-5 h-5 text-white opacity-40 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-white opacity-40" />
          )}
        </div>

        {query.length > 0 && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setResults([]);
            }}
            className={`absolute inset-y-0 flex items-center text-white opacity-40 hover:text-white transition-colors ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
            title={t('common.clear')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-14 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col z-50 ring-1 ring-white/5">
          {((isHashtagSearch && tagsList.length > 0) || (!isHashtagSearch && results.length > 0)) ? (
            <>
              {isHashtagSearch ? (
                <div className="flex flex-col overflow-y-auto w-full divide-y divide-white/[0.04] p-2">
                  <div className="text-[10px] text-white/30 px-4 py-2 uppercase font-medium tracking-wider mb-1 font-sans">
                    {t('search.filter_by_tags')} ({tagsList.length})
                  </div>
                  {tagsList.map((tag, idx) => (
                    <button
                      key={`${tag}-${idx}`}
                      onClick={() => handleSelect({ type: 'tag', tag })}
                      className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-white/[0.04] rounded-xl transition-all text-right group border-0"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-cyan-400 font-mono text-lg font-light">#</span>
                        <span className="text-white text-sm font-light group-hover:text-cyan-400 transition-colors">{tag}</span>
                      </div>
                      <span className="text-xs text-white/30 group-hover:text-white/50 transition-colors font-light">
                        {t('search.filter_public')}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex flex-col overflow-y-auto w-full p-2">
                    <div className="text-[10px] text-white/30 px-4 py-2 uppercase font-medium tracking-wider mb-1 font-sans">
                      {t('search.matching_fonts')} ({results.length})
                    </div>
                    {results.map((result, idx) => (
                      <button
                        key={`res-${result.id || idx}-${idx}`}
                        onClick={() => handleSelect(result)}
                        className="flex flex-col items-start w-full px-4 py-3 hover:bg-white/[0.04] rounded-xl transition-all text-right group mb-0.5 last:mb-0"
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <div className="flex flex-wrap items-center text-white opacity-40 text-[11px] font-light gap-x-1.5">
                            {mode === 'private' ? (
                              <>
                                <span className="text-white opacity-80">{result.group_name}</span>
                                {result.name && (
                                  <>
                                    <span className="text-[10px] opacity-60">/</span>
                                    <span>{formatFontName(result.name)}</span>
                                  </>
                                )}
                              </>
                            ) : (
                              <span className="text-white opacity-80">{formatFontName(result.name)}</span>
                            )}
                          </div>
                          {result.metadata?.weight && (
                            <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-white opacity-50 tracking-widest uppercase ml-2 shrink-0">
                              {result.metadata.weight}
                            </span>
                          )}
                        </div>
                        <span
                          className="text-white text-[14px] overflow-hidden text-ellipsis whitespace-nowrap w-full text-right transition-opacity duration-300"
                          style={{
                            fontFamily: loadedFontIds.has(result.id) ? `"search-preview-${result.id}", sans-serif` : 'sans-serif',
                            fontWeight: 'normal',
                            opacity: loadedFontIds.has(result.id) ? 1 : 0.3
                          }}
                        >
                          اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)
                        </span>
                      </button>
                    ))}
                  </div>
                  {additionalCount > 0 && (
                    <div className="px-5 py-2.5 text-center text-white/40 text-[11px] font-light border-t border-white/[0.03] shrink-0 bg-white/[0.01]">
                      + {additionalCount} {t('search.additional_results')}
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <div className="px-5 py-6 text-center text-white opacity-40 font-light text-sm bg-transparent">
              {t('search.no_results')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};