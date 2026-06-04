import { useState, useRef, useEffect } from 'react';
import { Upload, Beaker, Download, Settings, Type, Search, Clock, ArrowRight, X, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// @ts-ignore
import opentype from 'opentype.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useGlobal } from '../contexts/GlobalContext';
import { saveFontHistory, getFontHistoryList, getFontHistoryItem, FontHistoryItem, clearFontHistory } from '../lib/db';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { formatFontName } from '../utils/text';

export const Lab = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useGlobal();
  const [font, setFont] = useState<any>(null);
  const [originalFontBlob, setOriginalFontBlob] = useState<Blob | null>(null);
  const [axes, setAxes] = useState<any[]>([]);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});
  const [previewText, setPreviewText] = useState(t('lab.preview_placeholder'));
  const [fontSize, setFontSize] = useState<number | ''>('');
  const [lineHeight, setLineHeight] = useState<number | ''>('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#080808');
  const [openTypeFeatures, setOpenTypeFeatures] = useState<Record<string, boolean>>({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [glyphSearch, setGlyphSearch] = useState('');
  const [history, setHistory] = useState<Omit<FontHistoryItem, 'blob'>[]>([]);
  const [currentFontId, setCurrentFontId] = useState<string | null>(null);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [selectedGlyphZoom, setSelectedGlyphZoom] = useState<{char?: string, name?: string, svgPath?: string, svgViewBox?: string} | null>(null);
  const [parsedGlyphs, setParsedGlyphs] = useState<any[]>([]);
  const [renderedGlyphCount, setRenderedGlyphCount] = useState(100);
  const glyphsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleAutoload = async () => {
      await loadHistory();
      const autoLoadId = localStorage.getItem('lab_autoload_id');
      if (autoLoadId) {
        localStorage.removeItem('lab_autoload_id');
        handleLoadHistoryItem(autoLoadId);
      }
    };
    handleAutoload();
  }, []);

  useEffect(() => {
    // Legacy cleanup
    return () => {
      try {
        delete (window as any).onLabGlyphClick;
      } catch (e) {}
    };
  }, []);

  const loadHistory = async () => {
    const items = await getFontHistoryList();
    setHistory(items);
  };

  const handleClearHistory = async () => {
    await clearFontHistory();
    setHistory([]);
    setIsClearHistoryModalOpen(false);
  };

  useEffect(() => {
    // Reset search when font changes
    setGlyphSearch('');
  }, [font]);
  
  const filteredGlyphs = parsedGlyphs.filter(g => {
    if (!glyphSearch.trim()) return true;
    const q = glyphSearch.toLowerCase();
    return (g.name && g.name.toLowerCase().includes(q)) || 
           (g.unicode && g.unicode.toLowerCase().includes(q)) || 
           (g.char && g.char.toLowerCase().includes(q)) ||
           String(g.index).includes(q);
  });

  const loadFontIntoUI = async (
    fileOrBlob: Blob, 
    fontName: string, 
    savedAxes?: Record<string, number>, 
    savedFeatures?: Record<string, boolean>,
    fontId?: string
  ) => {
    setOriginalFontBlob(fileOrBlob);
    
    const newId = fontId || crypto.randomUUID();
    if (!fontId) {
      setCurrentFontId(newId);
    } else {
      setCurrentFontId(fontId);
    }

    const arrayBuffer = await fileOrBlob.arrayBuffer();
    
    // Inject font-face uniquely for Lab preview
    const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'LabFont-${newId}';
        src: url('${url}');
        font-display: swap;
      }
    `;
    document.head.appendChild(style);

    try {
      const parsedFont = opentype.parse(arrayBuffer);
      const safeNames: Record<string, any> = {};
      if (parsedFont.names) {
        for (const key in parsedFont.names) {
          const val = (parsedFont.names as any)[key];
          if (typeof val === 'object' && val !== null) {
            safeNames[key] = { ...val };
          } else {
            safeNames[key] = val;
          }
        }
      }

      setFont({
          names: safeNames,
          numGlyphs: parsedFont.numGlyphs
      });
      
      // Extract axes from fvar table
      const rawAxes = (parsedFont as any).tables.fvar?.axes || [];
      const axesData = rawAxes.map((axis: any) => ({
        tag: axis.tag,
        minValue: axis.minValue,
        defaultValue: axis.defaultValue,
        maxValue: axis.maxValue,
        name: axis.name
      }));
      setAxes(axesData);
      
      const initialValues: Record<string, number> = {};
      axesData.forEach((axis: any) => {
        initialValues[axis.tag] = savedAxes && savedAxes[axis.tag] !== undefined 
          ? savedAxes[axis.tag] 
          : axis.defaultValue;
      });
      setAxisValues(initialValues);

      // Extract all OpenType features
      const features: Record<string, boolean> = {};
      const gsub = (parsedFont as any).tables.gsub;
      const defaultEnabledFeatures = ['calt', 'rclt', 'rlig'];
      if (gsub && gsub.features) {
        gsub.features.forEach((f: any) => {
          features[f.tag] = savedFeatures && savedFeatures[f.tag] !== undefined 
            ? savedFeatures[f.tag] 
            : defaultEnabledFeatures.includes(f.tag);
        });
      }
      setOpenTypeFeatures(features);
      
      console.log("Font parsed, calling renderGlyphs...");
      setTimeout(() => {
        renderGlyphs(parsedFont);
      }, 100);

      if (!fontId) {
        await saveFontHistory({
          id: newId,
          name: fontName,
          blob: fileOrBlob,
          axes: initialValues,
          features: features,
          lastModified: Date.now()
        });
        loadHistory();
      }
    } catch (err) {
      console.error(t('lab.error_parsing'), err);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadFontIntoUI(file, file.name);
  };

  const handleLoadHistoryItem = async (id: string) => {
    const item = await getFontHistoryItem(id);
    if (item) {
      loadFontIntoUI(item.blob, item.name, item.axes, item.features, item.id);
    }
  };

  const saveCurrentSettingsToDB = async (currentAxes: Record<string, number>, currentFeatures: Record<string, boolean>) => {
    if (!currentFontId || !originalFontBlob) return;
    const fontName = font?.names?.postScriptName?.en || 'font';
    await saveFontHistory({
      id: currentFontId,
      name: fontName,
      blob: originalFontBlob,
      axes: currentAxes,
      features: currentFeatures,
      lastModified: Date.now()
    });
    loadHistory();
  };

  const handleAxisChange = (tag: string, value: number) => {
    const newAxes = { ...axisValues, [tag]: value };
    setAxisValues(newAxes);
    saveCurrentSettingsToDB(newAxes, openTypeFeatures);
  };

  const handleFeatureToggle = (feature: string) => {
    const newFeatures = { ...openTypeFeatures, [feature]: !openTypeFeatures[feature] };
    setOpenTypeFeatures(newFeatures);
    saveCurrentSettingsToDB(axisValues, newFeatures);
  };

  const renderGlyphs = (font: any) => {
    console.log("renderGlyphs called");
    const container = glyphsContainerRef.current;
    if (!container) {
      console.error("glyphsContainerRef is null!");
      return;
    }
    
    // استخراج المحارف بطريقة آمنة
    const numGlyphs = font.numGlyphs || 0;
    console.log("Number of glyphs found:", numGlyphs);

    if (numGlyphs === 0) {
      console.warn("No glyphs found in font!");
      return;
    }

    const unitsPerEm = font.unitsPerEm || 1000;
    const glyphsList: any[] = [];

    for (let i = 0; i < numGlyphs; i++) {
      try {
        const glyph = font.glyphs.get(i);
        if (!glyph || (!glyph.unicode && (!glyph.unicodes || glyph.unicodes.length === 0) && glyph.name === '.notdef')) continue;

        let glyphNameDisplay = 'Unnamed';
        if (glyph.name) {
          if (typeof glyph.name === 'object') {
             glyphNameDisplay = (glyph.name as any).en || (glyph.name as any)['ar-AE'] || Object.values(glyph.name)[0] || 'Unnamed';
          } else {
             glyphNameDisplay = String(glyph.name);
          }
        }

        const activeUnicode = glyph.unicode || (glyph.unicodes?.length ? glyph.unicodes[0] : null);
        const char = activeUnicode ? String.fromCodePoint(activeUnicode) : '';
        const advanceWidth = glyph.advanceWidth || unitsPerEm;

        const pathD = glyph.getPath(0, Math.round(unitsPerEm * 0.8), unitsPerEm).toPathData(2);
        const svgViewBox = `0 0 ${Math.max(advanceWidth, unitsPerEm * 0.5)} ${unitsPerEm}`;

        glyphsList.push({
          char,
          index: glyph.index || i,
          unicode: activeUnicode ? activeUnicode.toString(16).toUpperCase().padStart(4, '0') : undefined,
          name: glyphNameDisplay,
          svgPath: pathD,
          svgViewBox
        });

      } catch (err) {
         console.warn(`Skipping glyph at index ${i} due to parsing error`, err);
      }
    }
    setParsedGlyphs(glyphsList);
    setRenderedGlyphCount(100);
    console.log("Glyphs parsed successfully.", glyphsList.length);
  };

  const getVariationSettings = () => {
    return Object.entries(axisValues)
      .map(([tag, value]) => `"${tag}" ${value}`)
      .join(', ');
  };

  const getFontFeatures = () => {
    return Object.entries(openTypeFeatures)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => `"${feature}" 1`)
      .join(', ');
  };

  async function handleDownloadStatic(fontBlob: Blob, axes: Record<string, number>, features: Record<string, boolean>) {
    const API_URL = "https://font-api-0dqe.onrender.com/convert";

    // 1. الميزات اللي المستخدم اختارها من الواجهة
    const userSelected = Object.entries(features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);

    // 2. تجهيز البيانات (المحاور + الميزات)
    // نرسل المحاور بأسمائها الأصلية (axisTag) بالضبط كما هي في الخط
    const settings = {
        ...axes,
        "features": userSelected
    };

    const formData = new FormData();
    formData.append("font", fontBlob); // ملف الخط الأصلي
    formData.append("settings", JSON.stringify(settings));

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            body: formData,
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const originalName = font?.names?.postScriptName?.en || 'font';
            a.download = `${originalName}_FONTAT.ttf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } else {
            const errorText = await response.text();
            console.error(t('lab.error_conversion'), errorText);
            alert(`${t('lab.error_server')}: ${errorText}`);
        }
    } catch (error) {
        console.error("خطأ في الاتصال بالسيرفر:", error);
        alert(t('lab.error_connection'));
    } finally {
        setIsDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 pt-20 max-lg:landscape:pt-8 pb-32 max-lg:landscape:pb-16 mt-[-10px]">
      <div className="w-full xl:max-w-[1600px] mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Beaker className="w-7 h-7 text-white opacity-70" />
          {t('nav.lab')}
          {font && (
            <button 
              onClick={() => {
                setFont(null);
                setCurrentFontId(null);
                setOriginalFontBlob(null);
              }}
              className="mr-auto text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
            >
              {t('lab.back_to_history')}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </h1>

        {!font ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center justify-center border border-white/10 rounded-3xl p-10 bg-[#141414]">
              <Upload className="w-10 h-10 mb-4 text-white" />
              <label className="bg-white text-black px-6 py-3 rounded-xl font-bold cursor-pointer hover:bg-white/90 transition-all">
                {t('lab.upload_font')}
                <input type="file" onChange={handleFileUpload} accept=".ttf,.otf" className="hidden" />
              </label>
              <p className="text-xs text-white opacity-40 mt-4">{t('lab.upload_support')}</p>
            </div>

            {history.length > 0 && (
              <div className="bg-[#141414] rounded-3xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-white opacity-60" />
                    {t('lab.history_title')}
                  </h2>
                  <button
                    onClick={() => setIsClearHistoryModalOpen(true)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {t('lab.clear_history')}
                  </button>
                </div>
                <div className="space-y-2">
                  {history.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleLoadHistoryItem(item.id)}
                      className="w-full flex flex-row justify-between items-center p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                      dir="rtl"
                    >
                      <span className="font-bold text-sm md:text-base text-white text-right" dir="ltr">{formatFontName(item.name)}</span>
                      <span className="text-xs text-white opacity-40">
                        {new Date(item.lastModified).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-GB')}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4">
              {/* Controls */}
              <div className="col-span-12 lg:col-span-3 space-y-3 bg-[#141414] p-3 rounded-2xl border border-white/5 text-xs">
                <h2 className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider flex items-center gap-2">
                  <Settings size={12} />
                  {t('lab.font_control')}
                </h2>
                
                {/* Axes Sliders */}
                {axes.map((axis: any) => (
                  <div key={axis.tag}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="font-mono text-white opacity-80">{axis.tag}</span>
                      <span className="text-cyan-400">{axisValues[axis.tag]}</span>
                    </div>
                    <input
                      type="range"
                      min={axis.minValue}
                      max={axis.maxValue}
                      value={axisValues[axis.tag]}
                      onChange={(e) => handleAxisChange(axis.tag, parseFloat(e.target.value))}
                      className="w-full h-0.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400"
                    />
                  </div>
                ))}

                <hr className="border-white/5" />

                {/* General Controls */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value === '' ? '' : parseInt(e.target.value))} className="bg-white/5 rounded-md p-1.5 text-[10px] text-center" placeholder={t('lab.font_size')} />
                    <input type="number" step="0.1" value={lineHeight} onChange={(e) => setLineHeight(e.target.value === '' ? '' : parseFloat(e.target.value))} className="bg-white/5 rounded-md p-1.5 text-[10px] text-center" placeholder={t('lab.line_height')} />
                  </div>
                </div>
                
                {/* Elegant Color Pickers */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] text-white opacity-40 uppercase">{t('lab.text_color')}</label>
                    <button
                      onClick={() => document.getElementById('textColorPicker')?.click()}
                      className="w-full h-8 rounded-full border border-white/10 flex items-center justify-between px-2 bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: textColor }} />
                        <span className="text-[10px] text-white opacity-60">{textColor.toUpperCase()}</span>
                      </div>
                      <input id="textColorPicker" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="hidden" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-white opacity-40 uppercase">{t('lab.bg_color')}</label>
                    <button
                      onClick={() => document.getElementById('bgColorPicker')?.click()}
                      className="w-full h-8 rounded-full border border-white/10 flex items-center justify-between px-2 bg-white/5 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: bgColor }} />
                        <span className="text-[10px] text-white opacity-60">{bgColor.toUpperCase()}</span>
                      </div>
                      <input id="bgColorPicker" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="hidden" />
                    </button>
                  </div>
                </div>

                {/* OpenType Features */}
                <div className="space-y-1">
                  <label className="text-[9px] text-white opacity-40 uppercase">{t('lab.opentype_features')}</label>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(openTypeFeatures).map(([feature, enabled]) => (
                      <button
                        key={feature}
                        onClick={() => handleFeatureToggle(feature)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${enabled ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white opacity-40'}`}
                      >
                        {feature}
                      </button>
                    ))}
                  </div>
                </div>

                  <button
                    onClick={async () => {
                      if (!font || isDownloading) return;
                      
                      if (!originalFontBlob) {
                          alert(t('lab.error_reupload'));
                          return;
                      }

                      setIsDownloading(true);
                      
                      try {
                          await handleDownloadStatic(originalFontBlob, axisValues, openTypeFeatures);
                      } catch (err) {
                          console.error("Error downloading static font:", err);
                      } finally {
                          setIsDownloading(false);
                      }
                    }}
                    className={`w-full bg-white text-black py-1.5 rounded-lg text-[10px] font-bold hover:bg-white/90 transition-all flex items-center justify-center gap-1 ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isDownloading ? (
                      <>
                        <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        {t('lab.downloading')}
                      </>
                    ) : (
                      <>
                        <Download size={12} />
                        {t('lab.download_font')}
                      </>
                    )}
                  </button>
              </div>

              {/* Preview */}
              <div className="col-span-12 lg:col-span-9 space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-white opacity-60 mb-1">
                  <Type size={12} />
                  <span>{t('lab.font_preview')}: {font.names.fullName.en}</span>
                </div>
                <textarea
                  value={previewText}
                  onChange={(e) => setPreviewText(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#141414] border border-white/5 text-white text-xs outline-none focus:border-cyan-400/50 transition-all resize-none"
                  rows={2}
                />
                
                <div 
                  className="p-4 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center min-h-[300px]"
                  style={{ backgroundColor: bgColor }}
                >
                  <div
                    className="preview-text"
                    style={{
                      fontFamily: `'LabFont-${currentFontId}', sans-serif`,
                      fontSize: fontSize === '' ? undefined : `${fontSize}px`,
                      lineHeight: lineHeight === '' ? undefined : lineHeight,
                      color: textColor,
                      fontVariationSettings: getVariationSettings(),
                      fontFeatureSettings: getFontFeatures(),
                    }}
                  >
                    {previewText}
                  </div>
                </div>
              </div>
            </div>

            {/* Font Info & Glyphs */}
            <div className="bg-[#141414] p-6 rounded-3xl border border-white/5">
              <h2 className="text-lg font-bold mb-4">{t('lab.full_info')}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-white opacity-60 mb-6">
                {Object.entries(font.names).map(([key, value]: any) => {
                  let displayValue = '';
                  if (typeof value === 'object' && value !== null) {
                    displayValue = value.en || value['ar-AE'] || Object.values(value)[0] || '';
                  } else {
                    displayValue = String(value);
                  }
                  
                  return (
                    <div key={key} className="break-words">
                      <span className="block text-white opacity-40 text-xs uppercase">{key}</span>
                      <span className="block w-full overflow-hidden text-ellipsis">{displayValue}</span>
                    </div>
                  );
                })}
                <div className="break-words">
                  <span className="block text-white opacity-40 text-xs uppercase">{t('lab.glyph_count')}</span>
                  <span className="block w-full overflow-hidden text-ellipsis">{font.numGlyphs}</span>
                </div>
              </div>
              
              <div className="mb-4 space-y-3">
                <h3 className="text-sm font-bold">{t('lab.glyphs')}</h3>
                <div className="relative w-full md:w-64">
                  <div className={`absolute inset-y-0 ${t('dir') === 'rtl' ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                    <Search size={14} className="text-white opacity-40" />
                  </div>
                  <input
                    type="text"
                    placeholder={t('lab.search_glyph')}
                    value={glyphSearch}
                    onChange={(e) => setGlyphSearch(e.target.value)}
                    className={`w-full bg-black/40 border border-white/10 rounded-lg py-2 ${t('dir') === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'} text-xs text-white placeholder-white/40 focus:outline-none focus:border-cyan-400/50 transition-colors`}
                  />
                </div>
              </div>
              <div 
                id="glV" 
                ref={glyphsContainerRef} 
                onScroll={(e) => {
                  const target = e.currentTarget;
                  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 600) {
                    setRenderedGlyphCount(prev => prev + 200);
                  }
                }}
                className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 max-h-[350px] overflow-y-auto p-4 bg-black/40 rounded-2xl border border-white/5 custom-scrollbar"
              >
                {filteredGlyphs.slice(0, renderedGlyphCount).map((glyph, idx) => (
                  <div
                    key={`${glyph.unicode || idx}-${glyph.index}`}
                    onClick={() => {
                      if (glyph.char) {
                        setPreviewText(prev => prev + glyph.char);
                      }
                      setSelectedGlyphZoom({ char: glyph.char, name: glyph.name, svgPath: glyph.svgPath, svgViewBox: glyph.svgViewBox });
                    }}
                    className="gl-cell flex flex-col items-center justify-between p-2 cursor-pointer bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors h-full"
                    title={(glyph.unicode ? `U+${glyph.unicode}` : '') + (glyph.name ? ` (${glyph.name})` : '')}
                  >
                    <div className="w-full h-auto flex flex-col items-center justify-center flex-1 min-h-[60px] max-h-[80px]">
                      {glyph.svgPath ? (
                        <svg viewBox={glyph.svgViewBox} className="w-full h-full fill-[#cbd5e1]">
                          <path d={glyph.svgPath} />
                        </svg>
                      ) : (
                        <span className="text-center overflow-visible whitespace-nowrap leading-none text-[#cbd5e1]" style={font ? { fontFamily: `"${font.names?.postScriptName?.en || 'custom'}"`, fontSize: '40px' } : {}}>
                          {glyph.char}
                        </span>
                      )}
                    </div>
                    <div className="w-full flex flex-col items-center text-center mt-2 space-y-[2px] overflow-hidden">
                      <span className="text-[9px] text-white opacity-60 font-mono leading-tight truncate px-1">
                        {glyph.unicode ? `U+${glyph.unicode}` : 'No Unicode'}
                      </span>
                      <span className="text-[9px] text-white opacity-40 leading-tight">
                        Index: {glyph.index}
                      </span>
                      <span className="text-[9px] text-white opacity-80 truncate w-full px-1 leading-tight">
                        {glyph.name || 'Unnamed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Giant Zoom Overlay lens for Lab glyphs */}
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

              <div className="text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30 font-sans">
                {t('dir') === 'rtl' ? 'معاينة هندسية مكبرة' : 'Macro Geometry Preview'}
              </div>

              {/* Character display styling with loaded dynamic font if present */}
              {selectedGlyphZoom.svgPath ? (
                <div 
                  className="min-h-[140px] flex justify-center items-center py-6 w-full max-w-[200px] mx-auto"
                  title="اسحب أو انسخ الحرف"
                >
                  <svg viewBox={selectedGlyphZoom.svgViewBox} className="w-full h-auto fill-current text-white max-h-[180px]">
                    <path d={selectedGlyphZoom.svgPath} />
                  </svg>
                </div>
              ) : font ? (
                <div 
                  className="text-[110px] select-all leading-none py-10 text-white select-text font-serif min-h-[140px] flex items-center justify-center"
                  style={{
                    fontFamily: `'LabFont-${currentFontId}', sans-serif`,
                  }}
                  title="اسحب أو انسخ الحرف"
                >
                  {selectedGlyphZoom.char}
                </div>
              ) : (
                <div 
                  className="text-[110px] select-all leading-none py-10 text-white select-text font-serif font-extrabold min-h-[140px] flex items-center justify-center"
                  title="اسحب أو انسخ الحرف"
                >
                  {selectedGlyphZoom.char}
                </div>
              )}

              {/* Action Buttons */}
              <div className="w-full flex flex-col gap-2.5 pb-2 mt-4 font-sans">
                {selectedGlyphZoom.name && (
                   <div className="text-white/40 text-[10px] font-mono text-center pb-2">
                     {selectedGlyphZoom.name}
                   </div>
                )}
                
                {/* 1. Copy character string */}
                {selectedGlyphZoom.char && (
                  <button
                    onClick={() => {
                      if (selectedGlyphZoom.char) {
                        navigator.clipboard.writeText(selectedGlyphZoom.char);
                        addNotification('success', t('dir') === 'rtl' ? 'تم نسخ المحرف للحافظة!' : 'Copied to clipboard!');
                      }
                    }}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-lg shadow-cyan-400/10"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('dir') === 'rtl' ? 'نسخ هذا المحرف كـ نص' : 'Copy Character Text'}</span>
                  </button>
                )}

                {/* 2. Insert into typing preview text editor */}
                {selectedGlyphZoom.char && (
                  <button
                    onClick={() => {
                      if (selectedGlyphZoom.char) {
                        setPreviewText(prev => prev + selectedGlyphZoom.char);
                        addNotification('success', t('dir') === 'rtl' ? 'تمت إضافة المحرف للمحرر!' : 'Added character to editor!');
                        setSelectedGlyphZoom(null);
                      }
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs border border-white/5"
                  >
                    <ArrowRight className={`w-4 h-4 ${t('dir') === 'rtl' ? 'rotate-180' : ''}`} />
                    <span>{t('dir') === 'rtl' ? 'إدراج في مساحة التجربة' : 'Insert into Sandbox editor'}</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={isClearHistoryModalOpen}
        onClose={() => setIsClearHistoryModalOpen(false)}
        onConfirm={handleClearHistory}
        title={t('lab.clear_history')}
        message={t('lab.clear_history_confirm')}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </div>
  );
};
