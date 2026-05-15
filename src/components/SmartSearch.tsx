import React, { useState, useEffect, useRef } from 'react';
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
  group_id?: string; // fallback if available
}

interface SmartSearchProps {
  mode: 'public' | 'private';
  onSelect: (result: SearchResult) => void;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ mode, onSelect }) => {
  const { t, dir } = useLanguage();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loadedFontIds, setLoadedFontIds] = useState<Set<string>>(new Set());
  const wrapperRef = useRef<HTMLDivElement>(null);

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
        const { data, error } = await supabase.rpc('smart_search', {
          search_term: query,
          p_mode: mode
        });

        if (error) {
          console.error('Error searching fonts:', error);
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

  // Handle dynamic font loading for previews
  useEffect(() => {
    let active = true;
    const loadedFonts: FontFace[] = [];

    const loadFonts = async () => {
      const ids = new Set<string>();
      
      for (const result of results) {
        if (!active) break;
        if (result.download_url && result.id) {
          const fontName = `search-preview-${result.id}`;
          const font = new FontFace(fontName, `url(${result.download_url})`);
          try {
            await font.load();
            if (active) {
              document.fonts.add(font);
              loadedFonts.push(font);
              ids.add(result.id);
            }
          } catch (err) {
            console.error('Failed to load font demo for', result.name, err);
          }
        }
      }

      if (active && ids.size > 0) {
        setLoadedFontIds(ids);
      }
    };

    if (results.length > 0) {
      loadFonts();
    } else {
      setLoadedFontIds(new Set());
    }

    return () => {
      active = false;
      loadedFonts.forEach(font => {
        try {
          document.fonts.delete(font);
        } catch (e) {
          // Ignore delete errors
        }
      });
    };
  }, [results]);

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    onSelect(result);
  };

  const totalCount = results.length > 0 ? Number(results[0].total_count) : 0;
  const additionalCount = totalCount > 5 ? totalCount - results.length : 0;

  return (
    <div ref={wrapperRef} className="relative w-full mx-auto z-50" dir={dir}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (query.trim()) setIsOpen(true); }}
          placeholder={t('search.placeholder') || "ابحث عن خط أو مجموعة..."}
          className={`w-full bg-[#141414] border border-white/10 rounded-full py-3 text-white placeholder-white/40 outline-none focus:border-white/20 transition-all font-light ${dir === 'rtl' ? 'pr-12 pl-12' : 'pl-12 pr-12'}`}
        />
        <div className={`absolute pointer-events-none ${dir === 'rtl' ? 'right-4' : 'left-4'}`}>
          {loading ? (
            <Loader2 className="w-5 h-5 text-white opacity-40 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-white opacity-40" />
          )}
        </div>
        
        {/* Clear Button */}
        {query.length > 0 && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              setResults([]);
            }}
            className={`absolute inset-y-0 flex items-center text-white opacity-40 hover:text-white transition-colors ${dir === 'rtl' ? 'left-4' : 'right-4'}`}
            title={t('common.clear') || 'Clear'}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-14 left-0 right-0 bg-[#0d0d0d] border border-white/10 rounded-3xl overflow-hidden shadow-2xl max-h-[80vh] flex flex-col">
          {results.length > 0 ? (
            <>
              <div className="flex flex-col overflow-y-auto">
                {results.map((result, idx) => (
                  <button
                    key={result.id || idx}
                    onClick={() => handleSelect(result)}
                    className="flex flex-col items-start w-full px-5 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 text-right group"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className="flex flex-wrap items-center text-white opacity-40 text-[11px] font-light gap-x-1.5">
                        <span className="text-white opacity-80">{result.group_name}</span>
                        {result.name && (
                          <>
                            <span className="text-[10px] opacity-60">/</span>
                            <span>{formatFontName(result.name)}</span>
                          </>
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
                <div className="px-5 py-2.5 text-center bg-[#1c1c1c] text-white opacity-50 text-[11px] font-light border-t border-white/10 shrink-0">
                   + {additionalCount} نتائج إضافية
                </div>
              )}
            </>
          ) : (
            <div className="px-5 py-6 text-center text-white opacity-40 font-light text-sm">
              لم نعثر على نتيجة تطابق بحثك :(
            </div>
          )}
        </div>
      )}
    </div>
  );
};
