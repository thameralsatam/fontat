import { useState, useEffect, useMemo } from 'react';
import { Font } from '../../types';
import { POEMS } from '../../constants/poems';

export function useFontAnalyzer(selectedFontDetail: Font | null, dir: 'rtl' | 'ltr' | 'auto') {
  const [backdropChars, setBackdropChars] = useState<{ char: string; className: string; fontSize?: string }[]>([]);
  const [parsedGlyphs, setParsedGlyphs] = useState<{ char: string; index: number; unicode?: string; colSpan?: number; name?: string; svgPath?: string; svgViewBox?: string }[]>([]);
  const [renderedGlyphCount, setRenderedGlyphCount] = useState(100);
  const [detectedLangs, setDetectedLangs] = useState<string[]>([]);
  const [loadingGlyphs, setLoadingGlyphs] = useState(false);
  const [glyphSearch, setGlyphSearch] = useState('');
  const [selectedPoemIndex, setSelectedPoemIndex] = useState(0);
  const [customPoemTexts, setCustomPoemTexts] = useState<Record<string, string>>({});

  const getPoemText = (fontId: string) => customPoemTexts[`${fontId}_${selectedPoemIndex}`] || POEMS[selectedPoemIndex].text;

  const handlePoemChange = (fontId: string, text: string) => {
    setCustomPoemTexts(prev => ({ ...prev, [`${fontId}_${selectedPoemIndex}`]: text }));
  };

  // Set random backdrop chars when selectedFontDetail opens
  useEffect(() => {
    if (selectedFontDetail) {
      const CONFIG = [
        { char: '„', className: 'absolute right-[10%] top-[20%] pointer-events-none select-none opacity-[0.03] transform rotate-12 leading-none text-white', fontSize: '280px' }
      ];
      setBackdropChars(CONFIG);
    }
  }, [selectedFontDetail]);

  // Fetch and parse font for actual real glyph map
  useEffect(() => {
    if (!selectedFontDetail || !selectedFontDetail.download_url) {
      setParsedGlyphs([]);
      return;
    }

    let isCancelled = false;
    const fetchAndParseFont = async () => {
      setLoadingGlyphs(true);
      try {
        const response = await fetch(selectedFontDetail.download_url!);
        if (!response.ok) throw new Error('Failed to fetch font file');
        const fontBlob = await response.blob();

        const formData = new FormData();
        formData.append("font", fontBlob, "font.ttf");

        const analyzeResponse = await fetch("https://font-api-0dqe.onrender.com/analyze", {
          method: "POST",
          body: formData,
        });

        if (!analyzeResponse.ok) throw new Error('Failed to analyze font via server');
        const data = await analyzeResponse.json();
        if (!data.success) throw new Error(data.error || 'Server analysis failed');

        const characters = data.metadata.characters || [];
        const glyphsList = characters.map((code: number, idx: number) => {
          const char = String.fromCodePoint(code);
          return {
            char,
            index: idx,
            unicode: code.toString(16).toUpperCase().padStart(4, '0'),
            name: `Glyph ${code}`,
            colSpan: 1
          };
        });
        
        let hasArabic = false;
        let hasLatin = false;
        let hasChinese = false;
        let hasCyrillic = false;
        let hasHebrew = false;
        let hasDevanagari = false;
        let hasThai = false;
        let hasJapanese = false;
        let hasKorean = false;
        
        const nonLatinCandidates: string[] = [];
        const latinCandidates: string[] = [];

        // Scan for specific characters
        for (const g of glyphsList) {
          if (!g.unicode) continue;
          const code = parseInt(g.unicode, 16);
          // Check Arabic block
          if (code >= 0x0600 && code <= 0x06FF) hasArabic = true;
          // Check Latin block
          if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x00FF)) hasLatin = true;
          // Check Chinese block
          if (code >= 0x4E00 && code <= 0x9FFF) hasChinese = true;
          // Check Cyrillic
          if (code >= 0x0400 && code <= 0x04FF) hasCyrillic = true;
          // Check Hebrew
          if (code >= 0x0590 && code <= 0x05FF) hasHebrew = true;
          // Check Devanagari
          if (code >= 0x0900 && code <= 0x097F) hasDevanagari = true;
          // Check Thai
          if (code >= 0x0E00 && code <= 0x0E7F) hasThai = true;
          // Check Japanese (Hiragana/Katakana)
          if ((code >= 0x3040 && code <= 0x309F) || (code >= 0x30A0 && code <= 0x30FF)) hasJapanese = true;
          // Check Korean (Hangul)
          if (code >= 0xAC00 && code <= 0xD7AF) hasKorean = true;

          // Gather candidate chars for backdrop (skip common space, punctuation and math blocks)
          if (g.char && g.char.trim() !== '') {
             const isLatin = (code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A) || (code >= 0x00C0 && code <= 0x00FF);
             
             if (!isLatin && code > 0x00BF) { // Above Basic/Latin-1 mostly
               nonLatinCandidates.push(g.char);
             } else if (isLatin) {
               latinCandidates.push(g.char);
             }
          }
        }
        
        const bestCandidates = nonLatinCandidates.length > 0 ? nonLatinCandidates : latinCandidates;

        const langs = [];
        if (hasArabic) langs.push(dir === 'rtl' ? 'العربية' : 'Arabic');
        if (hasLatin) langs.push(dir === 'rtl' ? 'اللاتينية' : 'Latin');
        if (hasChinese) langs.push(dir === 'rtl' ? 'الصينية' : 'Chinese');
        if (hasCyrillic) langs.push(dir === 'rtl' ? 'السيريلية' : 'Cyrillic');
        if (hasHebrew) langs.push(dir === 'rtl' ? 'العبرية' : 'Hebrew');
        if (hasDevanagari) langs.push(dir === 'rtl' ? 'الديوناكرية' : 'Devanagari');
        if (hasThai) langs.push(dir === 'rtl' ? 'التايلندية' : 'Thai');
        if (hasJapanese) langs.push(dir === 'rtl' ? 'اليابانية' : 'Japanese');
        if (hasKorean) langs.push(dir === 'rtl' ? 'الكورية' : 'Korean');
        
        if (langs.length === 0) langs.push(dir === 'rtl' ? 'غير محدد' : 'Unknown');
        
        if (!isCancelled) {
          if (bestCandidates.length > 0) {
            setBackdropChars([
              { char: '„', className: 'absolute right-[10%] top-[20%] pointer-events-none select-none opacity-[0.03] transform rotate-12 leading-none text-white', fontSize: '280px' }
            ]);
          }
          setDetectedLangs(langs);
          setParsedGlyphs(glyphsList);
          setRenderedGlyphCount(100);
        }
      } catch (err) {
        console.error('Error parsing font in GroupDetails:', err);
        if (!isCancelled) {
          const fallbackChars = 'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن هـ و ي لأ لإ لآ ٠ ١ ٢ ٣ ٤ ٥ ٦ ٧ ٨ ٩ 0 1 2 3 4 5 6 7 8 9 َ ُ ِ ّ ً ٌ ٍ ْ ٰ ~ ، ؛ ؟ . ! : - + = *'.split(' ');
          setParsedGlyphs(fallbackChars.map((char, index) => ({ char, index })));
        }
      } finally {
        if (!isCancelled) {
          setLoadingGlyphs(false);
        }
      }
    };

    fetchAndParseFont();

    return () => {
      isCancelled = true;
    };
  }, [selectedFontDetail]);

  // Search filtered glyph list
  const filteredGlyphs = useMemo(() => {
    if (!glyphSearch.trim()) return parsedGlyphs;
    const query = glyphSearch.toLowerCase().trim();
    return parsedGlyphs.filter(g => 
      g.char.toLowerCase().includes(query) || 
      (g.unicode && g.unicode.toLowerCase().includes(query)) ||
      String(g.index).includes(query)
    );
  }, [parsedGlyphs, glyphSearch]);

  useEffect(() => {
    setRenderedGlyphCount(100);
  }, [glyphSearch, parsedGlyphs]);

  // Dynamic font format extractor
  const getFontFormat = (url?: string) => {
    if (!url) return 'TTF';
    const lower = url.toLowerCase();
    if (lower.includes('.otf')) return 'OTF';
    if (lower.includes('.woff2')) return 'WOFF2';
    if (lower.includes('.woff')) return 'WOFF';
    return 'TTF';
  };

  // Dynamic languages analyzer
  const getSupportedLanguages = () => {
    if (detectedLangs.length > 2) return dir === 'rtl' ? `${detectedLangs.length} لغات مدعومة` : `${detectedLangs.length} Languages`;
    if (detectedLangs.length > 0) return detectedLangs.join('، ');
    if (parsedGlyphs.length === 0) return dir === 'rtl' ? 'جاري الفحص...' : 'Detecting...';
    
    let hasArabic = false;
    let hasLatin = false;
    
    for (const g of parsedGlyphs) {
      if (g.unicode) {
        const code = parseInt(g.unicode, 16);
        if (code >= 0x0600 && code <= 0x06FF) {
          hasArabic = true;
        }
        if ((code >= 0x0041 && code <= 0x005A) || (code >= 0x0061 && code <= 0x007A)) {
          hasLatin = true;
        }
      }
    }
    
    const langs: string[] = [];
    if (hasArabic) langs.push(dir === 'rtl' ? 'العربية' : 'Arabic');
    if (hasLatin) langs.push(dir === 'rtl' ? 'اللاتينية' : 'Latin');
    
    if (langs.length === 0) return dir === 'rtl' ? 'العربية' : 'Arabic';
    return langs.join(' / ');
  };

  return {
    backdropChars,
    parsedGlyphs,
    renderedGlyphCount,
    setRenderedGlyphCount,
    detectedLangs,
    loadingGlyphs,
    glyphSearch,
    setGlyphSearch,
    selectedPoemIndex,
    setSelectedPoemIndex,
    getPoemText,
    handlePoemChange,
    filteredGlyphs,
    getFontFormat,
    getSupportedLanguages
  };
}
