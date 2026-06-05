import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Beaker, Download, Settings, Type, Search, Clock, ArrowRight, X, Copy, Sliders, ChevronDown, Palette, Layers, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from "react-colorful";
// @ts-ignore
import opentype from 'opentype.js';
import { useLanguage } from '../contexts/LanguageContext';
import { useGlobal } from '../contexts/GlobalContext';
import { saveFontHistory, getFontHistoryList, getFontHistoryItem, FontHistoryItem, clearFontHistory } from '../lib/db';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { formatFontName } from '../utils/text';

const getFeatureDescription = (tag: string, parsedFont: any): string => {
  if (parsedFont && parsedFont.names) {
    // 1. Try to find if this is a custom feature with a NameID in featureParams
    if (parsedFont.tables?.gsub?.features) {
      const list = parsedFont.tables.gsub.features;
      for (const f of list) {
        if (f.tag === tag && f.feature && typeof f.feature.featureParams === 'number' && f.feature.featureParams > 0) {
          const nameID = f.feature.featureParams;
          if (parsedFont.names[nameID]) {
            const val = parsedFont.names[nameID];
            const nameStr = val.en || val.ar || Object.values(val)[0];
            if (nameStr && typeof nameStr === 'string' && nameStr.trim()) {
              return nameStr.trim();
            }
          }
        }
      }
    }
  }

  const officialSpecs: Record<string, string> = {
    liga: 'Standard Ligatures',
    calt: 'Contextual Alternates',
    case: 'Case-Sensitive Forms',
    ccmp: 'Glyph Composition/Decomposition',
    dlig: 'Discretionary Ligatures',
    frac: 'Fractions',
    locl: 'Localized Forms',
    rlig: 'Required Ligatures',
    salt: 'Stylistic Alternates',
    swsh: 'Swash',
    aalt: 'Access All Alternates',
    init: 'Initial Forms',
    medi: 'Medial Forms',
    fina: 'Terminal Forms',
    isol: 'Isolated Forms',
    mark: 'Mark Positioning',
    mkmk: 'Mark to Mark Positioning',
    curs: 'Cursive Positioning',
    rclt: 'Required Contextual Alternates',
    kern: 'Kerning',
    ss01: 'Stylistic Set 1',
    ss02: 'Stylistic Set 2',
    ss03: 'Stylistic Set 3',
    ss04: 'Stylistic Set 4',
  };

  if (officialSpecs[tag]) {
    return officialSpecs[tag];
  }

  return 'لا يوجد وصف مرفق';
};


const PopoverColorPicker = ({ color, onChange }: { color: string, onChange: (c: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const popover = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popoverHeight = 185; 
      const popoverWidth = 234;  
      
      let top = rect.top - popoverHeight - 10;
      let left = rect.left;

      // Check top boundary
      if (top < 10) {
        top = rect.bottom + 10;
      }

      // Check right boundary
      if (left + popoverWidth > window.innerWidth) {
        left = window.innerWidth - popoverWidth - 10;
      }
      // Check left boundary
      if (left < 10) {
        left = 10;
      }

      // Check bottom boundary for absolute fallback placement
      if (top + popoverHeight > window.innerHeight) {
        top = window.innerHeight - popoverHeight - 10;
      }

      setCoords({ top, left });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      // capture scroll event inside scrollable parents
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
    }
    return () => {
      window.removeEventListener('scroll', updateCoords, true);
      window.removeEventListener('resize', updateCoords);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        popover.current && !popover.current.contains(event.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="relative inline-block flex-shrink-0">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-8 h-8 rounded-lg cursor-pointer border border-white/20 transition-transform active:scale-95 flex-shrink-0"
        style={{ backgroundColor: color }}
        aria-label="Choose color"
      />
      
      {isOpen && coords && createPortal(
        <div 
          className="fixed z-[999999] pointer-events-auto" 
          style={{ 
            top: `${coords.top}px`, 
            left: `${coords.left}px` 
          }}
        >
          <motion.div
            ref={popover}
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 5 }}
            transition={{ duration: 0.12 }}
            className="p-3 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl flex flex-col gap-3 w-[234px]"
          >
            <HexColorPicker color={color} onChange={onChange} />
            <div className="flex bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 focus-within:border-cyan-400/50 transition-colors">
              <span className="text-white/40 font-mono text-xs mr-1 mt-[2px]">#</span>
              <input
                type="text"
                value={color.replace('#', '')}
                onChange={(e) => {
                   let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                   if (val.length <= 6) {
                     onChange('#' + val);
                   }
                }}
                className="w-full bg-transparent text-xs font-mono text-white uppercase focus:outline-none"
                spellCheck={false}
              />
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Lab = () => {
  const { t, language } = useLanguage();
  const { addNotification } = useGlobal();
  const [font, setFont] = useState<any>(null);
  const [originalFontBlob, setOriginalFontBlob] = useState<Blob | null>(null);
  const [axes, setAxes] = useState<any[]>([]);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});
  const [previewText, setPreviewText] = useState(t('lab.preview_placeholder'));
  const [fontSize, setFontSize] = useState<number | ''>(80);
  const [lineHeight, setLineHeight] = useState<number | ''>('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#080808');
  const [openTypeFeatures, setOpenTypeFeatures] = useState<Record<string, boolean>>({});
  const [activeFeatureTooltip, setActiveFeatureTooltip] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [glyphSearch, setGlyphSearch] = useState('');
  const [history, setHistory] = useState<Omit<FontHistoryItem, 'blob'>[]>([]);
  const [currentFontId, setCurrentFontId] = useState<string | null>(null);
  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);
  const [selectedGlyphZoom, setSelectedGlyphZoom] = useState<{char?: string, name?: string, svgPath?: string, svgViewBox?: string} | null>(null);
  const [parsedGlyphs, setParsedGlyphs] = useState<any[]>([]);
  const [renderedGlyphCount, setRenderedGlyphCount] = useState(100);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [showFullscreenTools, setShowFullscreenTools] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string>('size');
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false);
  const glyphsContainerRef = useRef<HTMLDivElement>(null);
  const fullscreenTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fullscreenToolsRef = useRef<HTMLDivElement>(null);
  const fullscreenToggleBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Height resize not needed anymore, contentEditable handles it
  }, [previewText, fontSize, lineHeight, isFullscreenPreview]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!isFullscreenPreview || !showFullscreenTools) return;

      const target = event.target as HTMLElement;

      // Don't close if they clicked the tools container or the toggle button
      if (
        (fullscreenToolsRef.current && fullscreenToolsRef.current.contains(target)) ||
        (fullscreenToggleBtnRef.current && fullscreenToggleBtnRef.current.contains(target))
      ) {
        return;
      }

      // Don't close if they clicked any active color picker portal or dropdowns
      if (
        target.closest('.react-colorful') || 
        target.closest('.popover') || 
        target.closest('[class*="fixed z-[999999]"]') ||
        target.closest('button[aria-label="Choose color"]')
      ) {
        return;
      }

      setShowFullscreenTools(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isFullscreenPreview, showFullscreenTools]);

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
      const defaultEnabledFeatures = ['calt', 'rclt', 'rlig', 'liga', 'clig', 'init', 'medi', 'fina', 'isol', 'mark', 'mkmk', 'ccmp', 'curs', 'locl', 'kern'];
      
      const gsub = (parsedFont as any).tables.gsub;
      if (gsub && gsub.features) {
        gsub.features.forEach((f: any) => {
          features[f.tag] = savedFeatures && savedFeatures[f.tag] !== undefined 
            ? savedFeatures[f.tag] 
            : defaultEnabledFeatures.includes(f.tag);
        });
      }

      const gpos = (parsedFont as any).tables.gpos;
      if (gpos && gpos.features) {
        gpos.features.forEach((f: any) => {
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
    const features = Object.entries(openTypeFeatures)
      .map(([feature, enabled]) => `"${feature}" ${enabled ? 1 : 0}`)
      .join(', ');
    return features === '' ? 'normal' : features;
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
              <div className="col-span-12 lg:col-span-3 space-y-4 bg-[#141414] p-4 rounded-2xl border border-white/5 text-xs">
                <h2 className="text-[10px] font-bold text-white opacity-60 uppercase tracking-wider flex items-center gap-2">
                  <Settings size={12} />
                  {t('lab.font_control')}
                </h2>
                
                {/* Simplified Controls: Font Size */}
                <div className="space-y-4 pt-1">
                  <div className="flex justify-between text-[11px] text-white opacity-85">
                    <span className="font-medium">{t('lab.font_size')}</span>
                    <span className="text-cyan-400 font-mono font-bold text-xs">{fontSize || 80}px</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="400"
                    value={fontSize || 80}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300 transition-colors"
                  />
                </div>

                {/* Visual helper */}
                <p className="text-[10px] text-white/30 leading-relaxed text-center mt-1 select-none" dir={t('dir')}>
                  {t('dir') === 'rtl' 
                    ? 'الألوان والخصائص المتقدمة والتحميل متوفرة بالكامل داخل شاشة التكبير والتخصيص.' 
                    : 'Colors, advanced tuning and download are fully available inside customize & zoom screen.'}
                </p>
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
                  className="relative p-6 md:p-12 rounded-2xl border border-white/5 overflow-visible flex flex-col items-center justify-center min-h-[460px] h-auto"
                  style={{ backgroundColor: bgColor }}
                >
                  <button
                    onClick={() => {
                      setIsFullscreenPreview(true);
                      setShowFullscreenTools(true);
                    }}
                    className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/50 hover:bg-black/75 text-white/60 hover:text-cyan-400 rounded-full border border-white/10 hover:border-cyan-500/25 transition-all text-[11px] font-medium tracking-wide shadow-xl active:scale-95 cursor-pointer backdrop-blur-md group z-20"
                    title={t('dir') === 'rtl' ? 'فتح لوحة التعديل والتكبير' : 'Open customization and zoom'}
                  >
                    <Sliders size={11} className="text-white/40 group-hover:text-cyan-400 transition-colors" />
                    <span>{t('dir') === 'rtl' ? 'تخصيص وتكبير المعاينة ↗' : 'Customize & Zoom ↗'}</span>
                  </button>
                  <div
                    className="preview-text text-center w-full whitespace-pre-wrap break-words leading-normal select-text relative z-10"
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

      <AnimatePresence>
        {isFullscreenPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex flex-col bg-[#020202]"
            style={{ backgroundColor: bgColor }}
          >
            {/* Top Toolbar overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
              {/* Back / Close button */}
              <button 
                onClick={() => {
                  setIsFullscreenPreview(false);
                  setShowFullscreenTools(false);
                }}
                className="p-3 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-black/60 hover:scale-105 transition-all text-white/70 hover:text-white shadow-xl cursor-pointer pointer-events-auto"
              >
                <X className="w-5 h-5 cursor-pointer" />
              </button>

              {/* Tools panel toggle */}
              <div className="flex flex-col items-end gap-2 pointer-events-none">
                <button 
                  ref={fullscreenToggleBtnRef}
                  onClick={() => setShowFullscreenTools(!showFullscreenTools)}
                  className={`px-4 py-2.5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-cyan-500/20 hover:scale-105 transition-all shadow-xl pointer-events-auto cursor-pointer flex items-center gap-2 ${showFullscreenTools ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-black/50 hover:bg-black/75 text-white/80 hover:text-cyan-400'}`}
                >
                  <Palette className="w-4 h-4 cursor-pointer" />
                  <span className="text-[11px] font-bold tracking-wide">
                    {t('dir') === 'rtl' ? 'أدوات التعديل والتخصيص' : 'Advanced Tools'}
                  </span>
                </button>

                {/* Collapsible Tools space */}
                <AnimatePresence>
                  {showFullscreenTools && (
                    <motion.div
                      ref={fullscreenToolsRef}
                      initial={{ opacity: 0, scale: 0.95, transformOrigin: 'top right' }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-[#141414]/95 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl w-[240px] shadow-2xl pointer-events-auto flex flex-col gap-2 mt-2"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 px-1">
                         <span className="text-[10px] tracking-wider font-bold text-white/50 uppercase">{t('dir') === 'rtl' ? 'أدوات العرض' : 'Preview Tools'}</span>
                      </div>

                      <div className="space-y-2 max-h-[75vh] overflow-y-auto custom-scrollbar pr-1">
                         {/* Typography Section */}
                         <div className="bg-black/20 border border-white/5 rounded-xl overflow-hidden">
                           <button 
                             onClick={() => setExpandedSection(prev => prev === 'size' ? '' : 'size')}
                             className="w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors"
                           >
                             <div className="flex items-center gap-2">
                               <Type className="w-3.5 h-3.5 text-cyan-400" />
                               <span className="text-[11px] font-bold text-white">{t('dir') === 'rtl' ? 'الخط والحجم' : 'Typography'}</span>
                             </div>
                             <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedSection === 'size' ? 'rotate-180' : ''}`} />
                           </button>
                           
                           <AnimatePresence>
                             {expandedSection === 'size' && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden"
                               >
                                 <div className="p-4 space-y-4 border-t border-white/5 bg-white/[0.02]">
                                   <div className="space-y-2">
                                     <div className="flex justify-between text-xs text-white/60">
                                       <span>{t('lab.font_size')}</span>
                                       <span>{fontSize || 'Auto'}</span>
                                     </div>
                                     <input
                                       type="range"
                                       min="8"
                                       max="400"
                                       value={fontSize || 80}
                                       onChange={(e) => setFontSize(Number(e.target.value))}
                                       className="w-full accent-cyan-400 cursor-pointer"
                                     />
                                   </div>

                                   <div className="space-y-2">
                                     <div className="flex justify-between text-xs text-white/60">
                                       <span>{t('lab.line_height')}</span>
                                       <span>{lineHeight || 'Auto'}</span>
                                     </div>
                                     <input
                                       type="range"
                                       min="0.5"
                                       max="3"
                                       step="0.1"
                                       value={lineHeight || 1.2}
                                       onChange={(e) => setLineHeight(Number(e.target.value))}
                                       className="w-full accent-cyan-400 cursor-pointer"
                                     />
                                   </div>
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>

                         {/* Colors Section */}
                         <div className="bg-black/20 border border-white/5 rounded-2xl overflow-visible">
                           <button 
                             onClick={() => setExpandedSection(prev => prev === 'colors' ? '' : 'colors')}
                             className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                           >
                             <div className="flex items-center gap-2">
                               <Palette className="w-4 h-4 text-red-400" />
                               <span className="text-xs font-bold text-white">{t('dir') === 'rtl' ? 'الألوان' : 'Colors'}</span>
                             </div>
                             <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedSection === 'colors' ? 'rotate-180' : ''}`} />
                           </button>
                           
                           <AnimatePresence>
                             {expandedSection === 'colors' && (
                               <motion.div
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: 'auto', opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-visible"
                               >
                                 <div className="p-4 space-y-4 border-t border-white/5 bg-white/[0.02]">
                                   <div className="space-y-2">
                                      <label className="text-xs text-white/60 block">{t('lab.text_color')}</label>
                                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1.5 focus-within:border-cyan-400/50 transition-colors">
                                        <PopoverColorPicker color={textColor} onChange={setTextColor} />
                                        <span className="text-white/40 font-mono text-xs mr-1 ml-2">#</span>
                                        <input
                                          type="text"
                                          value={textColor.replace('#', '')}
                                          onChange={(e) => {
                                             let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                                             if (val.length <= 6) {
                                               setTextColor('#' + val);
                                             }
                                          }}
                                          className="flex-1 bg-transparent text-xs font-mono text-white uppercase focus:outline-none"
                                          spellCheck={false}
                                        />
                                      </div>
                                   </div>
                                   
                                   <div className="space-y-2">
                                      <label className="text-xs text-white/60 block">{t('lab.bg_color')}</label>
                                      <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-lg p-1.5 focus-within:border-cyan-400/50 transition-colors">
                                        <PopoverColorPicker color={bgColor} onChange={setBgColor} />
                                        <span className="text-white/40 font-mono text-xs mr-1 ml-2">#</span>
                                        <input
                                          type="text"
                                          value={bgColor.replace('#', '')}
                                          onChange={(e) => {
                                             let val = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                                             if (val.length <= 6) {
                                               setBgColor('#' + val);
                                             }
                                          }}
                                          className="flex-1 bg-transparent text-xs font-mono text-white uppercase focus:outline-none"
                                          spellCheck={false}
                                        />
                                      </div>
                                   </div>
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                         </div>

                         {/* OpenType Section */}
                         {Object.keys(openTypeFeatures).length > 0 && (
                           <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                             <button 
                               onClick={() => setExpandedSection(prev => prev === 'opentype' ? '' : 'opentype')}
                               className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                             >
                               <div className="flex items-center gap-2">
                                 <Layers className="w-4 h-4 text-purple-400" />
                                 <span className="text-xs font-bold text-white">OpenType</span>
                               </div>
                               <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedSection === 'opentype' ? 'rotate-180' : ''}`} />
                             </button>
                             
                             <AnimatePresence>
                               {expandedSection === 'opentype' && (
                                 <motion.div
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   className="overflow-hidden"
                                 >
                                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex flex-col gap-4">
                                      {(() => {
                                        const advancedFeaturesList = ['kern', 'mark', 'mkmk', 'ccmp', 'rlig', 'clig', 'locl', 'init', 'medi', 'fina', 'isol', 'curs', 'rclt', 'dist', 'blwf', 'abvf', 'half', 'pstf', 'vatu', 'cjct', 'vert', 'vrt2', 'vrtr', 'vpal', 'halt'];
                                        const isAdvancedFeature = (tag: string) => advancedFeaturesList.includes(tag);

                                        const featuresObj = Object.entries(openTypeFeatures);
                                        const stylistic = featuresObj.filter(([tag]) => !isAdvancedFeature(tag));
                                        const advanced = featuresObj.filter(([tag]) => isAdvancedFeature(tag));

                                        const renderFeature = ([tag, enabled]: [string, boolean]) => {
                                          const desc = getFeatureDescription(tag, font);
                                          const isInfoOpen = activeFeatureTooltip === tag;
                                          return (
                                            <div
                                              key={tag}
                                              className="flex flex-col rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden hover:bg-white/[0.02] transition-all"
                                            >
                                              {/* Row Header */}
                                              <div
                                                onClick={() => handleFeatureToggle(tag)}
                                                className="flex items-center justify-between p-2.5 cursor-pointer select-none"
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                  <span className="font-mono text-[10px] font-extrabold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded border border-cyan-400/20 uppercase tracking-widest shrink-0">
                                                    {tag}
                                                  </span>
                                                  
                                                  {/* Silver circle Info button */}
                                                  <button
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setActiveFeatureTooltip(isInfoOpen ? null : tag);
                                                    }}
                                                    className={`w-5 h-5 flex items-center justify-center rounded-full border transition-all shrink-0 cursor-pointer ${
                                                      isInfoOpen
                                                        ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.15)]'
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80 hover:bg-white/10 hover:border-white/20'
                                                    }`}
                                                    title="الشرح والتفاصيل"
                                                  >
                                                    <Info className="w-2.5 h-2.5" />
                                                  </button>
                                                </div>
                                                
                                                {/* Visual switch toggler */}
                                                <div
                                                  className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out ${
                                                    enabled ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' : 'bg-white/10'
                                                  }`}
                                                >
                                                  <span
                                                    className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow ring-0 transition-all duration-200 ease-in-out"
                                                    style={{
                                                      [t('dir') === 'rtl' ? 'right' : 'left']: enabled ? '18px' : '2px'
                                                    }}
                                                  />
                                                </div>
                                              </div>

                                              {/* Collapsible Info Card */}
                                              <AnimatePresence initial={false}>
                                                {isInfoOpen && (
                                                  <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="overflow-hidden bg-white/[0.02] border-t border-white/5"
                                                  >
                                                    <div className="p-3 text-xs text-white/75 bg-gradient-to-b from-cyan-950/10 to-transparent leading-relaxed text-right font-sans border-l-2 border-cyan-500/30 font-medium">
                                                      {desc}
                                                    </div>
                                                  </motion.div>
                                                )}
                                              </AnimatePresence>
                                            </div>
                                          );
                                        };

                                        return (
                                          <>
                                            {stylistic.length > 0 && (
                                              <div className="space-y-2.5">
                                                {stylistic.map(renderFeature)}
                                              </div>
                                            )}

                                            {advanced.length > 0 && (
                                              <div className="flex flex-col gap-2.5 mt-2">
                                                <button
                                                  onClick={() => setShowAdvancedFeatures(!showAdvancedFeatures)}
                                                  className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white/70 text-xs font-bold"
                                                >
                                                  <div className="flex items-center gap-2">
                                                    <Settings size={14} className="text-white/50" />
                                                    <span>{t('dir') === 'rtl' ? 'الميزات المتقدمة' : 'Advanced Features'}</span>
                                                  </div>
                                                  <ChevronDown className={`w-4 h-4 transition-transform ${showAdvancedFeatures ? 'rotate-180' : ''}`} />
                                                </button>
                                                
                                                <AnimatePresence>
                                                  {showAdvancedFeatures && (
                                                    <motion.div
                                                      initial={{ height: 0, opacity: 0 }}
                                                      animate={{ height: 'auto', opacity: 1 }}
                                                      exit={{ height: 0, opacity: 0 }}
                                                      className="space-y-2.5 overflow-hidden"
                                                    >
                                                      <div className="pt-1 space-y-2.5">
                                                        {advanced.map(renderFeature)}
                                                      </div>
                                                    </motion.div>
                                                  )}
                                                </AnimatePresence>
                                              </div>
                                            )}
                                          </>
                                        );
                                      })()}
                                    </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         )}

                         {/* Variable Axes Section */}
                         {axes.length > 0 && (
                           <div className="bg-black/20 border border-white/5 rounded-2xl overflow-hidden">
                             <button 
                               onClick={() => setExpandedSection(prev => prev === 'axes' ? '' : 'axes')}
                               className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                             >
                               <div className="flex items-center gap-2">
                                 <Sliders className="w-4 h-4 text-green-400" />
                                 <span className="text-xs font-bold text-white">Variable Axes</span>
                               </div>
                               <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedSection === 'axes' ? 'rotate-180' : ''}`} />
                             </button>
                             
                             <AnimatePresence>
                               {expandedSection === 'axes' && (
                                 <motion.div
                                   initial={{ height: 0, opacity: 0 }}
                                   animate={{ height: 'auto', opacity: 1 }}
                                   exit={{ height: 0, opacity: 0 }}
                                   className="overflow-hidden"
                                 >
                                   <div className="p-4 space-y-4 border-t border-white/5 bg-white/[0.02]">
                                     {axes.map(axis => (
                                       <div key={axis.tag} className="space-y-1">
                                         <div className="flex justify-between text-xs text-white/60">
                                           <span>{axis.name?.en || axis.tag}</span>
                                           <span className="font-mono bg-black/40 px-1.5 rounded">{axisValues[axis.tag]?.toFixed(0) || axis.defaultValue}</span>
                                         </div>
                                         <input
                                           type="range"
                                           min={axis.minValue}
                                           max={axis.maxValue}
                                           step={(axis.maxValue - axis.minValue) / 100 || 1}
                                           value={axisValues[axis.tag] || axis.defaultValue}
                                           onChange={(e) => handleAxisChange(axis.tag, parseFloat(e.target.value))}
                                           className="w-full accent-cyan-400 cursor-pointer"
                                         />
                                       </div>
                                     ))}
                                   </div>
                                 </motion.div>
                               )}
                             </AnimatePresence>
                           </div>
                         )}

                          {/* Instant Download Action in Fullscreen */}
                          <div className="pt-2 border-t border-white/5 font-sans">
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
                              className={`w-full bg-cyan-400 hover:bg-cyan-300 text-black py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.25)] select-none active:scale-95 cursor-pointer ${isDownloading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                              {isDownloading ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                  <span>{t('lab.downloading')}</span>
                                </>
                              ) : (
                                <>
                                  <Download size={13} />
                                  <span>{t('lab.download_font')}</span>
                                </>
                              )}
                            </button>
                          </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Main content layer */}
            <div className="flex-1 flex overflow-y-auto custom-scrollbar w-full h-full p-6 md:p-12 pointer-events-auto items-start justify-center">
              <div className="w-full max-w-7xl flex flex-col items-center justify-start min-h-max py-24 md:py-32">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setPreviewText(e.currentTarget.innerText)}
                  onInput={(e) => {
                    // Update state silently without re-triggering render loop on every keystroke
                  }}
                  className="w-full outline-none bg-transparent overflow-visible text-center break-words whitespace-pre-wrap"
                  style={{
                    color: textColor,
                    fontFamily: `'LabFont-${currentFontId}', sans-serif`,
                    fontSize: fontSize === '' ? '80px' : `${fontSize}px`,
                    lineHeight: lineHeight === '' ? '1.5' : lineHeight,
                    fontVariationSettings: getVariationSettings(),
                    fontFeatureSettings: getFontFeatures(),
                    minHeight: '1em',
                  }}
                  spellCheck={false}
                >
                  {previewText}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
