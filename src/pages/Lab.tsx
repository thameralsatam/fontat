import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Upload, Beaker, Download, Video, Settings, Type, Search, Clock, ArrowRight, X, Copy, Sliders, ChevronDown, Palette, Layers, Info, SlidersHorizontal, AlignLeft, AlignCenter, AlignRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { HexColorPicker } from "react-colorful";
// @ts-ignore
import { useLanguage } from '../contexts/LanguageContext';
import { useGlobal } from '../contexts/GlobalContext';
import { saveFontHistory, getFontHistoryList, getFontHistoryItem, FontHistoryItem, clearFontHistory } from '../lib/db';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { formatFontName } from '../utils/text';
import { VideoExportModal } from '../components/font/VideoExportModal';

const getFeatureDescription = (tag: string, parsedFont: any, t: (key: string) => string): string => {
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

  const titleKey = `ot.${tag}.title`;
  const descKey = `ot.${tag}.desc`;
  const titleVal = t(titleKey);
  const descVal = t(descKey);

  if (titleVal !== titleKey && descVal !== descKey) {
    return `${titleVal}: ${descVal}`;
  } else if (descVal !== descKey) {
    return descVal;
  } else if (titleVal !== titleKey) {
    return titleVal;
  }

  if (tag.startsWith('ss') && tag.length === 4) {
    const num = tag.substring(2);
    return `${t('ot.stylistic_set')} ${num}`;
  }

  return t('lab.no_desc');
};

const DEFAULT_ENABLED_FEATURES = ['init', 'medi', 'fina', 'isol', 'rlig', 'ccmp', 'mark', 'mkmk', 'curs'];


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
  const { t, language, dir } = useLanguage();
  const { addNotification } = useGlobal();
  const [font, setFont] = useState<any>(null);
  const [originalFontBlob, setOriginalFontBlob] = useState<Blob | null>(null);
  const [axes, setAxes] = useState<any[]>([]);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});
  const [previewText, setPreviewText] = useState(t('lab.preview_placeholder'));
  const [fontSize, setFontSize] = useState<number | ''>(80);
  const [lineHeight, setLineHeight] = useState<number | ''>('');
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#080808');

  const handleResetSettings = () => {
    setFontSize(80);
    setLineHeight('');
    setLetterSpacing(0);
    setTextAlign('center');
    setTextColor('#ffffff');
    setBgColor('#080808');
    if (axes && axes.length > 0) {
      const defaultVals: Record<string, number> = {};
      axes.forEach(axis => {
        defaultVals[axis.tag] = axis.defaultValue;
      });
      setAxisValues(defaultVals);
    } else {
      setAxisValues({});
    }
    setOpenTypeFeatures({});
  };
  const [openTypeFeatures, setOpenTypeFeatures] = useState<Record<string, boolean | undefined>>({});
  const [activeFeatureTooltip, setActiveFeatureTooltip] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isVideoExportModalOpen, setIsVideoExportModalOpen] = useState(false);
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
  const isUpdatingGlyphsRef = useRef(false);
  const fullscreenToolsRef = useRef<HTMLDivElement>(null);
  const fullscreenToggleBtnRef = useRef<HTMLButtonElement>(null);
  const fontBlobUrlRef = useRef<string | null>(null);
  const fontStyleTagRef = useRef<HTMLStyleElement | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup URLs and style tags on unmount to prevent memory leaks
      if (fontBlobUrlRef.current) {
        URL.revokeObjectURL(fontBlobUrlRef.current);
      }
      if (fontStyleTagRef.current) {
        fontStyleTagRef.current.remove();
      }
    };
  }, []);

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
    savedFeatures?: Record<string, boolean | undefined>,
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
    
    // Cleanup previous font blob to avoid memory leak
    if (fontBlobUrlRef.current) {
      URL.revokeObjectURL(fontBlobUrlRef.current);
    }
    if (fontStyleTagRef.current) {
      fontStyleTagRef.current.remove();
    }
    
    // Inject font-face uniquely for Lab preview
    const blob = new Blob([arrayBuffer], { type: 'font/ttf' });
    const url = URL.createObjectURL(blob);
    fontBlobUrlRef.current = url;
    
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'LabFont-${newId}';
        src: url('${url}');
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    fontStyleTagRef.current = style;

    try {
      const formData = new FormData();
      formData.append("font", fileOrBlob, fontName || "font.ttf");

      const response = await fetch("https://font-api-0dqe.onrender.com/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to analyze font via server');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Server analysis failed');

      const serverNames = data.metadata.names || {};
      const postScriptNameVal = serverNames.postscript_name || serverNames.full_name || fontName || 'font';
      const fullNameVal = serverNames.full_name || serverNames.family_name || fontName || 'font';
      const familyNameVal = serverNames.family_name || fontName || 'font';
      const subfamilyNameVal = serverNames.subfamily_name || 'Regular';

      const safeNames: Record<string, any> = {
        fontFamily: { en: familyNameVal },
        fontSubfamily: { en: subfamilyNameVal },
        fullName: { en: fullNameVal },
        postScriptName: { en: postScriptNameVal },
        version: { en: serverNames.version || '1.0' },
        designer: { en: serverNames.designer || '' },
        copyright: { en: serverNames.copyright || '' }
      };

      const charCount = data.metadata.char_count || 0;

      setFont({
          names: safeNames,
          numGlyphs: charCount
      });
      
      // Extract axes
      const serverAxes = data.metadata.axes || [];
      const axesData = serverAxes.map((axis: any) => ({
        tag: axis.tag,
        minValue: axis.min,
        defaultValue: axis.default,
        maxValue: axis.max,
        name: axis.name || axis.tag
      }));
      setAxes(axesData);
      
      const initialValues: Record<string, number> = {};
      axesData.forEach((axis: any) => {
        initialValues[axis.tag] = savedAxes && savedAxes[axis.tag] !== undefined 
          ? savedAxes[axis.tag] 
          : axis.defaultValue;
      });
      setAxisValues(initialValues);

      // Extract features
      const serverFeatures = data.metadata.features || [];
      const features: Record<string, boolean | undefined> = {};
      
      serverFeatures.forEach((tag: string) => {
        features[tag] = savedFeatures && savedFeatures[tag] !== undefined 
          ? savedFeatures[tag] 
          : undefined;
      });
      
      setOpenTypeFeatures(features);
      
      // Generate characters list
      const characters = data.metadata.characters || [];
      const glyphsList = characters.map((code: number, idx: number) => {
        const char = String.fromCodePoint(code);
        return {
          char,
          index: idx,
          unicode: code.toString(16).toUpperCase().padStart(4, '0'),
          name: `Glyph ${code}`
        };
      });
      setParsedGlyphs(glyphsList);
      setRenderedGlyphCount(100);

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
      console.error('Error parsing font:', err);
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

  const saveCurrentSettingsToDB = async (currentAxes: Record<string, number>, currentFeatures: Record<string, boolean | undefined>) => {
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
    const currentState = openTypeFeatures[feature];
    const isCurrentlyOn = currentState !== undefined ? currentState : DEFAULT_ENABLED_FEATURES.includes(feature);
    
    const newFeatures = { ...openTypeFeatures, [feature]: !isCurrentlyOn };
    setOpenTypeFeatures(newFeatures);
    saveCurrentSettingsToDB(axisValues, newFeatures);
  };

  const getVariationSettings = () => {
    return Object.entries(axisValues)
      .map(([tag, value]) => `"${tag}" ${value}`)
      .join(', ');
  };

  const getFontFeatures = () => {
    if (Object.keys(openTypeFeatures).length === 0) return 'normal';
    
    const parts: string[] = [];
    
    Object.entries(openTypeFeatures).forEach(([tag, enabled]) => {
      // Validate tag: OpenType tags must be exactly 4 characters (letters or numbers)
      // This prevents invalid tags from the server from breaking the entire font-feature-settings property
      if (enabled !== undefined && /^[A-Za-z0-9]{4}$/.test(tag)) {
        parts.push(`"${tag}" ${enabled ? 1 : 0}`);
      }
    });

    return parts.length > 0 ? parts.join(', ') : 'normal';
  };

  async function handleDownloadStatic(fontBlob: Blob, axes: Record<string, number>, features: Record<string, boolean | undefined>) {
    const API_URL = "https://font-api-0dqe.onrender.com/convert";

    // 1. الميزات اللي المستخدم اختارها من الواجهة
    // نستثني الميزات الأساسية لأن تجميدها عبر الخادم يفسد الخط العربي (يجعل الحروف متصلة دائماً ولا تتغير حسب السياق)
    const userSelected = Object.entries(features)
      .filter(([tag, enabled]) => enabled === true && !DEFAULT_ENABLED_FEATURES.includes(tag))
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
              className={`${dir === 'rtl' ? 'mr-auto' : 'ml-auto'} text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all cursor-pointer`}
            >
              {dir === 'rtl' ? (
                <>
                  <span>{t('lab.back_to_history')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>{t('lab.back_to_history')}</span>
                </>
              )}
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
            {/* Full-width Interactive Specimen Canvas */}
            <div 
              onClick={() => {
                setIsFullscreenPreview(true);
                setShowFullscreenTools(true);
              }}
              className="group relative w-full rounded-3xl border border-white/10 hover:border-cyan-500/40 bg-[#12131c] hover:bg-[#151724] p-6 sm:p-10 min-h-[440px] flex flex-col justify-between transition-all duration-300 cursor-pointer overflow-hidden shadow-2xl hover:shadow-[0_12px_40px_rgba(0,0,0,0.5),0_0_25px_rgba(34,211,238,0.08)]"
              style={{ backgroundColor: bgColor }}
            >
              {/* Studio Canvas Framing Accents on Hover */}
              <div className="absolute top-3 left-3 w-3 h-3 border-t-2 border-l-2 border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-300 pointer-events-none" />
              <div className="absolute top-3 right-3 w-3 h-3 border-t-2 border-r-2 border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-300 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-3 h-3 border-b-2 border-l-2 border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-300 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-3 h-3 border-b-2 border-r-2 border-cyan-400/0 group-hover:border-cyan-400/50 transition-all duration-300 pointer-events-none" />

              {/* Top Header Bar inside Stage */}
              <div className="flex items-center justify-between w-full z-20 gap-3">
                {/* Refined Font Name Capsule with generous breathing room and elegant styling */}
                <div 
                  className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-black/70 border border-white/12 hover:border-cyan-500/35 backdrop-blur-xl text-xs sm:text-sm text-white/95 font-medium shadow-lg transition-all group/capsule max-w-[85%] sm:max-w-[70%] md:max-w-[600px] shrink-0"
                  title={font.names.fullName.en}
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Type size={11} />
                  </div>
                  <span className="truncate tracking-wide font-sans text-white/90">{font.names.fullName.en}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shrink-0 group-hover/capsule:shadow-[0_0_10px_rgba(34,211,238,0.9)] transition-all ml-auto" />
                </div>

                {/* Subtle Hover Customization Hint Badge */}
                <div 
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 backdrop-blur-md text-[11px] font-medium shadow-md pointer-events-none"
                  style={{ fontFamily: "'Thmanyah Sans', sans-serif" }}
                >
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>{t('lab.customize_zoom')}</span>
                </div>
              </div>

              {/* Center Specimen Text Display */}
              <div className="my-auto py-10 text-center w-full whitespace-pre-wrap break-words leading-normal select-none z-10 transition-transform duration-300 group-hover:scale-[1.01]">
                <div
                  className="preview-text transition-colors duration-300"
                  style={{
                    fontFamily: `'LabFont-${currentFontId}', sans-serif`,
                    fontSize: fontSize === '' ? undefined : `${fontSize}px`,
                    lineHeight: lineHeight === '' ? undefined : lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                    textAlign: textAlign,
                    color: textColor,
                    fontVariationSettings: getVariationSettings(),
                    fontFeatureSettings: getFontFeatures(),
                  }}
                >
                  {previewText}
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
                    if (renderedGlyphCount < filteredGlyphs.length && !isUpdatingGlyphsRef.current) {
                      isUpdatingGlyphsRef.current = true;
                      setRenderedGlyphCount(prev => Math.min(prev + 200, filteredGlyphs.length));
                      setTimeout(() => {
                        isUpdatingGlyphsRef.current = false;
                      }, 150);
                    }
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
                        <span className="text-center overflow-visible whitespace-nowrap leading-none text-[#cbd5e1]" style={{ fontFamily: `'LabFont-${currentFontId}', sans-serif`, fontSize: '40px' }}>
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
                {t('lab.macro_geometry')}
              </div>

              {/* Character display styling with loaded dynamic font if present */}
              {selectedGlyphZoom.svgPath ? (
                <div 
                  className="min-h-[140px] flex justify-center items-center py-6 w-full max-w-[200px] mx-auto"
                  title={t('lab.drag_or_copy')}
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
                  title={t('lab.drag_or_copy')}
                >
                  {selectedGlyphZoom.char}
                </div>
              ) : (
                <div 
                  className="text-[110px] select-all leading-none py-10 text-white select-text font-serif font-extrabold min-h-[140px] flex items-center justify-center"
                  title={t('lab.drag_or_copy')}
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
                        addNotification('success', t('lab.char_copied'));
                      }
                    }}
                    className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-lg shadow-cyan-400/10"
                  >
                    <Copy className="w-4 h-4" />
                    <span>{t('lab.copy_char_text')}</span>
                  </button>
                )}

                {/* 2. Insert into typing preview text editor */}
                {selectedGlyphZoom.char && (
                  <button
                    onClick={() => {
                      if (selectedGlyphZoom.char) {
                        setPreviewText(prev => prev + selectedGlyphZoom.char);
                        addNotification('success', t('lab.char_added'));
                        setSelectedGlyphZoom(null);
                      }
                    }}
                    className="w-full py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs border border-white/5"
                  >
                    <ArrowRight className={`w-4 h-4 ${t('dir') === 'rtl' ? 'rotate-180' : ''}`} />
                    <span>{t('lab.insert_sandbox')}</span>
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
                    {t('lab.advanced_tools')}
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
                         <span className="text-[10px] tracking-wider font-bold text-white/50 uppercase">{t('lab.preview_tools')}</span>
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
                               <span className="text-[11px] font-bold text-white">{t('lab.typography')}</span>
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

                                   {/* Text Alignment Option */}
                                   <div className="space-y-2 pt-1 border-t border-white/5">
                                     <div className="flex justify-between text-xs text-white/60">
                                       <span>{t('lab.letter_spacing')}</span>
                                       <span>{letterSpacing}px</span>
                                      </div>
                                      <input
                                        type="range"
                                        min="-10"
                                        max="40"
                                        value={letterSpacing}
                                        onChange={(e) => setLetterSpacing(Number(e.target.value))}
                                        className="w-full accent-cyan-400 cursor-pointer"
                                      />
                                    </div>

                                    {/* Text Alignment Option */}
                                    <div className="space-y-2 pt-1 border-t border-white/5">
                                      <div className="flex justify-between text-xs text-white/60">
                                       <span>{t('lab.text_align')}</span>
                                     </div>
                                     <div className="grid grid-cols-3 gap-1 bg-black/40 p-1 rounded-xl border border-white/10">
                                       <button
                                         type="button"
                                         onClick={() => setTextAlign('right')}
                                         className={`py-1.5 rounded-lg flex items-center justify-center transition-all ${
                                           textAlign === 'right'
                                             ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                                             : 'text-white/50 hover:text-white hover:bg-white/5'
                                         }`}
                                         title={t('lab.align_right')}
                                       >
                                         <AlignRight size={14} />
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setTextAlign('center')}
                                         className={`py-1.5 rounded-lg flex items-center justify-center transition-all ${
                                           textAlign === 'center'
                                             ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                                             : 'text-white/50 hover:text-white hover:bg-white/5'
                                         }`}
                                         title={t('lab.align_center')}
                                       >
                                         <AlignCenter size={14} />
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setTextAlign('left')}
                                         className={`py-1.5 rounded-lg flex items-center justify-center transition-all ${
                                           textAlign === 'left'
                                             ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold'
                                             : 'text-white/50 hover:text-white hover:bg-white/5'
                                         }`}
                                         title={t('lab.align_left')}
                                       >
                                         <AlignLeft size={14} />
                                       </button>
                                     </div>
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
                               <span className="text-xs font-bold text-white">{t('lab.colors')}</span>
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
                                 <span className="text-xs font-bold text-white">{t('lab.opentype')}</span>
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
                                    <div className="px-4 pt-4 pb-0 border-t border-white/5 bg-white/[0.02]">
                                      <p className="text-[10px] text-white/50 leading-relaxed text-center">
                                        ملاحظة: الميزات تظهر بناءً على توافقها مع النص واللغة. الميزات الأساسية غير قابلة للتبديل لحماية التشكيل.
                                      </p>
                                    </div>
                                    <div className="p-4 border-t border-white/5 bg-white/[0.02] flex flex-col gap-4">
                                      {(() => {
                                        const isAdvancedFeature = (tag: string) => DEFAULT_ENABLED_FEATURES.includes(tag);

                                        const featuresObj = Object.entries(openTypeFeatures);
                                        const stylistic = featuresObj.filter(([tag]) => !isAdvancedFeature(tag));
                                        const advanced = featuresObj.filter(([tag]) => isAdvancedFeature(tag));

                                        const renderFeature = ([tag, enabled]: [string, boolean | undefined]) => {
                                          const desc = getFeatureDescription(tag, font, t);
                                          const isInfoOpen = activeFeatureTooltip === tag;
                                          const isBasic = DEFAULT_ENABLED_FEATURES.includes(tag);
                                          const isCurrentlyOn = enabled !== undefined ? enabled : isBasic;
                                          
                                          return (
                                            <div
                                              key={tag}
                                              className="flex flex-col rounded-xl border border-white/5 bg-white/[0.01] overflow-hidden hover:bg-white/[0.02] transition-all"
                                            >
                                              {/* Row Header */}
                                              <div
                                                onClick={() => !isBasic && handleFeatureToggle(tag)}
                                                className={`flex items-center justify-between p-2.5 select-none ${isBasic ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                  <span className={`font-mono text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-widest shrink-0 ${isBasic ? 'text-gray-400 bg-gray-400/10 border-gray-400/20' : 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20'}`}>
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
                                                    isCurrentlyOn 
                                                      ? isBasic ? 'bg-gray-500/50' : 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]' 
                                                      : 'bg-white/10'
                                                  }`}
                                                >
                                                  <span
                                                    className={`absolute top-[2px] h-4 w-4 rounded-full shadow ring-0 transition-all duration-200 ease-in-out ${isBasic ? 'bg-white/70' : 'bg-white'}`}
                                                    style={{
                                                      [t('dir') === 'rtl' ? 'right' : 'left']: isCurrentlyOn ? '18px' : '2px'
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
                                                    <span>{t('lab.advanced_features')}</span>
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
                                 <span className="text-xs font-bold text-white">{t('lab.variable_axes')}</span>
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

                          {/* Action Buttons in Fullscreen Tools */}
                          <div className="pt-2 border-t border-white/5 font-sans flex flex-col gap-2">
                            {/* Reset Settings Action Button (Moved above download & export) */}
                            <button
                              type="button"
                              onClick={handleResetSettings}
                              className="w-full bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/30 text-white/70 hover:text-red-300 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 select-none active:scale-95 cursor-pointer group mb-1"
                            >
                              <RotateCcw size={13} className="text-cyan-400 group-hover:text-red-400 transition-colors" />
                              <span>{t('lab.reset_settings')}</span>
                            </button>

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
                            
                            {axes && axes.length > 0 && (
                              <button
                                onClick={() => setIsVideoExportModalOpen(true)}
                                className="w-full bg-[#1a1a1a] border border-white/10 hover:bg-white/10 text-white py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 select-none active:scale-95 cursor-pointer"
                              >
                                <Video size={13} className="text-cyan-400" />
                                <span>{t('lab.export_animation')}</span>
                              </button>
                            )}
                          </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Main content layer with maximized writing space & minimal edge dead margins */}
            <div className="flex-1 flex overflow-y-auto custom-scrollbar w-full h-full p-3 sm:p-5 md:p-6 pointer-events-auto items-stretch justify-center">
              <div className="w-full max-w-7xl flex flex-col items-center justify-center min-h-[calc(100vh-80px)] pt-16 sm:pt-20 pb-6">
                <div
                  contentEditable
                  suppressContentEditableWarning
                  onBlur={(e) => setPreviewText(e.currentTarget.innerText)}
                  onInput={() => {
                    // Update state silently without re-triggering render loop on every keystroke
                  }}
                  className="w-full outline-none bg-transparent overflow-visible break-words whitespace-pre-wrap transition-all duration-200"
                  style={{
                    color: textColor,
                    fontFamily: `'LabFont-${currentFontId}', sans-serif`,
                    fontSize: fontSize === '' ? '80px' : `${fontSize}px`,
                    lineHeight: lineHeight === '' ? '1.5' : lineHeight,
                    letterSpacing: `${letterSpacing}px`,
                    textAlign: textAlign,
                    fontVariationSettings: getVariationSettings(),
                    fontFeatureSettings: getFontFeatures(),
                    minHeight: '2em',
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
      <VideoExportModal
        isOpen={isVideoExportModalOpen}
        onClose={() => setIsVideoExportModalOpen(false)}
        axes={axes}
        currentAxisValues={axisValues}
        text={previewText}
        fontFamily={`LabFont-${currentFontId}`}
        openTypeFeatures={openTypeFeatures}
        fontSize={fontSize === '' ? 80 : fontSize}
        fontBlob={originalFontBlob}
        textColor={textColor}
        bgColor={bgColor}
        lineHeight={lineHeight === '' ? 1.4 : lineHeight}
        textAlign={textAlign}
        letterSpacing={letterSpacing}
      />
    </div>
  );
};
