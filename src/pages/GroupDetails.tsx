import { useEffect, useState, useRef, useMemo, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Group, FontWeight, Font } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { deleteFontPermanently, getGroupFonts, getFontWeights, getPublicFonts, getWeightRelationshipsForFonts } from '../services/fontService';
import { getGroups } from '../services/groupService';
import { Trash2, Download, X, Layers, Upload, Plus, Check, Dices, Filter, Edit3, ArrowRight, ArrowLeft, Sliders, Layout, Copy, Sparkles, BookOpen, Beaker, ExternalLink, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { saveFontHistory } from '../lib/db';
// @ts-ignore
import opentype from 'opentype.js';

import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { formatFontName } from '../utils/text';

export const RANDOM_TEXTS = [
  "نحن لا نكتب لنقرأ، بل نكتب لنعيش",
  "الحياة إما مغامرة جريئة أو لا شيء",
  "الجمال في بساطة الأشياء",
  "أعظم مجد لنا ليس في عدم السقوط، بل في النهوض",
  "كل يوم هو بداية جديدة"
];

export const GroupDetails = ({ 
  groupId, 
  groupData,
  highlightedFont,
  isPublicAllFonts = false,
  publicTagFilters = [],
  onClearTagFilter,
  onTagClick
}: { 
  groupId?: string, 
  groupData?: Group,
  highlightedFont?: { id: string, ts: number },
  isPublicAllFonts?: boolean,
  publicTagFilters?: string[],
  onClearTagFilter?: () => void,
  onTagClick?: (tag: string) => void
}) => {
  const { id: paramId, fontParam } = useParams<{ id: string, fontParam: string }>();
  const id = groupId || paramId;
  const navigate = useNavigate();

  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { addToUploadQueue, uploadQueue, addNotification, removeFromQueueByFontId } = useGlobal();
  
  const [group, setGroup] = useState<Group | null>(groupData || null);

  const [selectedFontDetail, setSelectedFontDetail] = useState<Font | null>(null);
  const [activeParentFontId, setActiveParentFontId] = useState<string | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);
  const [customPoemTexts, setCustomPoemTexts] = useState<Record<string, string>>({});

  const [selectedPoemIndex, setSelectedPoemIndex] = useState(0);
  const [detailLayoutMode, setDetailLayoutMode] = useState<'poem' | 'paragraph' | 'glyphs' | 'poster'>('poem');
  const [selectedGlyphZoom, setSelectedGlyphZoom] = useState<{char?: string, name?: string, svgPath?: string, svgViewBox?: string} | null>(null);

  const [backdropChars, setBackdropChars] = useState<{ char: string; className: string; fontSize?: string }[]>([]);
  const [selectedFontWeights, setSelectedFontWeights] = useState<any[]>([]);
  const [isDetailScrolled, setIsDetailScrolled] = useState(false);
  const [parsedGlyphs, setParsedGlyphs] = useState<{ char: string; index: number; unicode?: string; colSpan?: number }[]>([]);
  const [renderedGlyphCount, setRenderedGlyphCount] = useState(100);
  const [detectedLangs, setDetectedLangs] = useState<string[]>([]);
  const [loadingGlyphs, setLoadingGlyphs] = useState(false);
  const [glyphSearch, setGlyphSearch] = useState('');
  
  // Save to account modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveToGroupId, setSaveToGroupId] = useState<string>('new');
  const [newSaveGroupName, setNewSaveGroupName] = useState<string>('');
  const [isSavingFont, setIsSavingFont] = useState(false);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  
  const [isExternalMenuOpen, setIsExternalMenuOpen] = useState(false);
  const [isWeightsMenuOpen, setIsWeightsMenuOpen] = useState(false);

  // Close menus on outside click or esc
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.external-menu-container')) {
        setIsExternalMenuOpen(false);
      }
      if (!target.closest('.weights-menu-container')) {
        setIsWeightsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  const POEMS = [
    {
      title: 'حكم سيوفك في رقاب العذل',
      author: 'عنترة بن شداد',
      text: `حكم سيوفك في رقاب العذل
وإذا نزلت بدار ذل فارحل
وإذا بليت بظالم كن ظالما
وإذا لقيت ذوي الجهالة فاجهلي
وإذا الجبان نهاك يوم كريهة
خوفا عليك من ازدحام الجحفل
فاعص مقالته ولا تحفل بها
واقدم إذا حق اللقا في الأول
واختر لنفسك منزلا تعلو به
أو مت كريما تحت ظل القسطل
فالموت لا ينجيك من آفاته
حصن ولو شيدته بالجندل`
    },
    {
      title: 'وداع الروض والخيل والليل',
      author: 'أبو الطيب المتنبي',
      text: `الخَيلُ وَاللّيلُ وَالبَيداءُ تَعرِفُني
وَالسّيفُ وَالرّمحُ وَالقِرطاسُ وَالقَلَمُ
صَحِبتُ في الفَلَواتِ الوَحشَ مُنفَرِداً
حَتّى تَعَجَّبَ مِنّي القورُ وَالأَكَمُ
يا مَن يَعِزُّ عَلَينا أَن نُفارِقَهُم
وِجدانُنا كُلَّ شَيءٍ بَعدَكُم عَدَمُ
ما كانَ أَخلَقَنا مِنكُم بِتَكرِمَةٍ
لَو أَنَّ أَمرَكُمُ مِن أَمرِنا أَمَمُ
إِن كانَ سَرَّكُمُ ما قالَ حاسِدُنا
فَما لِجُرحٍ إِذا أَرضاكُمُ أَلَمُ`
    },
    {
      title: 'كن جميلاً تر الوجود جميلاً',
      author: 'إيليا أبو ماضي',
      text: `أَيُّهَذا الشّاكِي وَما بِكَ داءُ
كَيفَ تَغدو إِذا غَدَوتَ عَليلا
إِنَّ شَرَّ الجُناةِ في الأَرضِ نَفسٌ
تَتَوَقّى قَبلَ الرَّحيلِ الرَّحيلا
وَتَرى الشَّوكَ في الوُرودِ وَتَعمى
أَن تَرى فَوقَها النَّدى إِكليلا
هُوَ عِبءٌ عَلى الحَياةِ ثَقيلٌ
مَن يَظُنُّ الحَياةَ عِبئاً ثَقيلا
أَيُّهَذا الشّاكِي وَما بِكَ داءُ
كُن جَميلاً تَرى الوُجودَ جَميلاً`
    },
    {
      title: 'سلوا قلبي غداة سلا وثابا',
      author: 'أحمد شوقي',
      text: `سَلوا قَلبي غَداةَ سَلا وَثابا
لَعَلَّ عَلى الجَمالِ لَهُ عِتابا
وَيُثلى في الغَرامِ سِنونَ فُرضَت
تُعيدُ عُهودَ مَن بَعُدوا شَبابا
وَتَرجِعُني الذِكرى لِعَهدِ جَميلٍ
تَذوقُ بِهِ الشِّفاهُ لَنا شَرابا
إِذا ما جِئتَ سَيِّدَةَ العَذارى
فَقُل يا لَيتَني كُنتُ التُرابا`
    }
  ];

  const getPoemText = (fontId: string) => customPoemTexts[`${fontId}_${selectedPoemIndex}`] || POEMS[selectedPoemIndex].text;

  const handlePoemChange = (fontId: string, text: string) => {
    setCustomPoemTexts(prev => ({ ...prev, [`${fontId}_${selectedPoemIndex}`]: text }));
  };

  const activeTheme = {
    bg: 'bg-[#030303]',
    cardBg: 'bg-[#090b0e]/90 border-white/5 backdrop-blur-3xl',
    text: 'text-white',
    textSecondary: 'text-white/40',
    accentBg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    btnAccent: 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-[0_0_20px_rgba(6,182,212,0.15)]',
    accentGlow: 'bg-cyan-500/5',
    borderColor: 'border-white/5',
    inputBg: 'bg-white/5 text-white focus:border-cyan-400/30'
  };

  const handleOpenSaveModal = async () => {
    if (!user) {
      addNotification('error', dir === 'rtl' ? 'يرجى تسجيل الدخول لحفظ الخطوط في مساحتك' : 'Please log in to save fonts to your workspace');
      return;
    }
    setIsSaveModalOpen(true);
    const groups = await getGroups();
    setUserGroups(groups);
  };

  const executeFontSave = async () => {
    if (!selectedFontDetail || !selectedFontDetail.download_url) return;
    setIsSavingFont(true);
    try {
      // Create or select group
      let finalGroupId = saveToGroupId;
      if (saveToGroupId === 'new') {
        if (!newSaveGroupName.trim()) {
           addNotification('error', dir === 'rtl' ? 'يرجى إدخال اسم المجموعة' : 'Please enter a group name');
           setIsSavingFont(false);
           return;
        }
        const { createGroupSmart } = await import('../services/groupService');
        const newGroup = await createGroupSmart(newSaveGroupName.trim(), '', false);
        if (!newGroup) throw new Error('Failed to create group');
        finalGroupId = newGroup.id;
      }

      const filesToUpload: File[] = [];

      // Fetch base font
      const baseResponse = await fetch(selectedFontDetail.download_url);
      if (!baseResponse.ok) throw new Error('Failed to fetch the base font');
      const baseBlob = await baseResponse.blob();
      const baseFile = new File([baseBlob], selectedFontDetail.name, { type: baseBlob.type });
      filesToUpload.push(baseFile);

      // We need to associate weights after base is uploaded. Since addToUploadQueue can do parent/child, 
      // but it assumes the first file might just be uploaded.
      // Wait, addToUploadQueue doesn't easily let us say "File 1 is parent of File 2" in a single array unless we do it sequentially.
      // Since it's a save feature, we can actually just call uploadFontToGroup directly to have precise control,
      // OR just put them in queue and assume user can fix weights, but user expects automatic weights.
      // Let's do it manually but pushing to uploadQueue might be complex if we want to establish relationship immediately without a parent DB ID.
      // Actually, addToUploadQueue creates them and we can just let them upload without parent, OR we can upload base manually, get ID, then upload weights?
      // Since we want to use the queue for UI:
      const { uploadFontToGroup } = await import('../services/fontService');
      const { font: uploadData } = await uploadFontToGroup(baseFile, finalGroupId, true);
      
      const newParentId = uploadData.id;

      // Handle weights
      if (selectedFontWeights && selectedFontWeights.length > 0) {
         for (const weight of selectedFontWeights) {
            if (weight.child_font && weight.child_font.download_url) {
                const wRes = await fetch(weight.child_font.download_url);
                const wBlob = await wRes.blob();
                const wFile = new File([wBlob], weight.child_font.name, { type: wBlob.type });
                
                const { uploadFontWeight } = await import('../services/fontService');
                await uploadFontWeight(wFile, newParentId, finalGroupId);
            }
         }
      }

      addNotification('success', dir === 'rtl' ? 'تم الحفظ في مساحتك بنجاح!' : 'Saved to your workspace successfully!');
      setIsSaveModalOpen(false);
      setSaveToGroupId('new');
      setNewSaveGroupName('');
      
    } catch (err) {
      console.error(err);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء حفظ الخط' : 'Error saving font');
    } finally {
      setIsSavingFont(false);
    }
  };

  const handleTransferToLab = async (font: Font) => {
    if (!font.download_url) {
      addNotification('error', dir === 'rtl' ? 'رابط تحميل الخط غير متوفر' : 'Font download url not available');
      return;
    }
    setIsTransferring(true);
    try {
      const response = await fetch(font.download_url);
      if (!response.ok) throw new Error('Failed to fetch font file');
      const blob = await response.blob();

      const fontId = font.id || crypto.randomUUID();
      const historyItem = {
        id: fontId,
        name: font.name,
        blob: blob,
        axes: {},
        features: {},
        lastModified: Date.now()
      };
      await saveFontHistory(historyItem);

      localStorage.setItem('lab_autoload_id', fontId);
      addNotification('success', dir === 'rtl' ? 'تم نقل الخط بنجاح إلى المختبر!' : 'Font transferred to Lab successfully!');
      
      setSelectedFontDetail(null);
      navigate('/lab');
    } catch (err: any) {
      console.error(err);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء نقل الخط إلى المختبر' : 'An error occurred while transferring to Lab');
    } finally {
      setIsTransferring(false);
    }
  };

  // Sync with parent updates
  useEffect(() => {
    if (groupData) {
      setGroup(groupData);
    }
  }, [groupData]);

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
        const arrayBuffer = await response.arrayBuffer();
        const parsedFont = opentype.parse(arrayBuffer);
        
        const numGlyphs = parsedFont.numGlyphs || 0;
        const unitsPerEm = parsedFont.unitsPerEm || 1000;
        const glyphsList: { char: string; index: number; unicode?: string; colSpan?: number; name?: string; svgPath?: string; svgViewBox?: string }[] = [];
        
        for (let i = 0; i < numGlyphs; i++) {
          const glyph = parsedFont.glyphs.get(i);
          if (!glyph || (!glyph.unicode && (!glyph.unicodes || glyph.unicodes.length === 0) && glyph.name === '.notdef')) continue;
          
          const activeUnicode = glyph.unicode || (glyph.unicodes?.length ? glyph.unicodes[0] : null);
          const advanceWidth = glyph.advanceWidth || unitsPerEm;
          const widthRatio = advanceWidth / unitsPerEm;
          
          let colSpan = 1;
          if (widthRatio > 1.2) colSpan = 2;
          if (widthRatio > 2.2) colSpan = 3;
          if (widthRatio > 3.2) colSpan = 4;
          if (widthRatio > 4.2) colSpan = 5;

          const char = activeUnicode ? String.fromCodePoint(activeUnicode) : '';
          
          // Generate an SVG path to render properly un-encoded text and others
          const pathD = glyph.getPath(0, Math.round(unitsPerEm * 0.8), unitsPerEm).toPathData(2);
          const svgViewBox = `0 0 ${Math.max(advanceWidth, unitsPerEm * 0.5)} ${unitsPerEm}`;
          
          glyphsList.push({
            char,
            index: glyph.index || i,
            unicode: activeUnicode ? activeUnicode.toString(16).toUpperCase().padStart(4, '0') : undefined,
            name: glyph.name,
            colSpan,
            svgPath: pathD,
            svgViewBox
          });
        }
        
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
          // Rough filter: exclude < 0x0041 (spaces, numbers, punctuation)
          // also we want letters preferably
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

  // Fetch weights when font selected (based on active parent)
  useEffect(() => {
    const parentId = activeParentFontId || selectedFontDetail?.id;
    if (parentId) {
      getFontWeights(parentId)
        .then(weights => {
          setSelectedFontWeights(weights || []);
        })
        .catch(err => {
          console.error('Error fetching font weights:', err);
          setSelectedFontWeights([]);
        });
    } else {
      setSelectedFontWeights([]);
    }
  }, [activeParentFontId, selectedFontDetail?.id]);

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

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isOwner = isAdmin || (!isPublicAllFonts && (group?.is_owner === true || group?.user_id === user?.id));
  const [dbFonts, setDbFonts] = useState<Font[]>([]);

  // Helper to truncate long names with two-dots (..)
  const truncateTwoDots = (str: string, max: number = 10) => {
    if (!str) return '';
    if (str.length <= max) return str;
    return str.slice(0, max) + '..';
  };

  // Derive base/parent font metadata so tags don't disappear when selecting weights
  const baseFontForMetadata = selectedFontDetail 
    ? (dbFonts.find(f => f.id === (activeParentFontId || selectedFontDetail.id)) || selectedFontDetail)
    : null;
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Weights System State
  const [weightRelationships, setWeightRelationships] = useState<FontWeight[]>([]);
  const [weightsModal, setWeightsModal] = useState<{ isOpen: boolean; parentFont: Font | null; weights: FontWeight[] }>({
    isOpen: false,
    parentFont: null,
    weights: []
  });
  const weightInputRef = useRef<HTMLInputElement>(null);
  const [uploadingWeightFor, setUploadingWeightFor] = useState<string | null>(null);

  // Tags Editing Modal state
  const [tagEditModal, setTagEditModal] = useState<{ isOpen: boolean, fontId: string | null, tagsText: string }>({ isOpen: false, fontId: null, tagsText: '' });
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newSingleTag, setNewSingleTag] = useState('');
  const [tagRenameModal, setTagRenameModal] = useState<{ isOpen: boolean, oldTag: string, newTag: string }>({ isOpen: false, oldTag: '', newTag: '' });
  const [tagDeleteGlobalModal, setTagDeleteGlobalModal] = useState<{ isOpen: boolean, tag: string }>({ isOpen: false, tag: '' });

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    dbFonts.forEach(f => {
      if (Array.isArray(f.tags)) {
        f.tags.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) {
            tagsSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [dbFonts]);
  
  // Pagination State (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [renderedCountInPage, setRenderedCountInPage] = useState(7);

  useEffect(() => {
    // Reset page of fonts and rendered count when switching contexts or tags
    setCurrentPage(1);
    setRenderedCountInPage(7);
  }, [id, isPublicAllFonts, publicTagFilters.join(',')]);

  useEffect(() => {
    // Reset renderedCountInPage when manually turning pages
    setRenderedCountInPage(7);
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      // If we scroll near the bottom of the visible document window
      const scrolledToBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 450;
      if (scrolledToBottom) {
        setRenderedCountInPage(prev => prev + 5);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Toolbar State
  const [fontSize, setFontSize] = useState(25); // Default size
  const [globalPreviewText, setGlobalPreviewText] = useState('اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)');
  const deferredGlobalPreviewText = useDeferredValue(globalPreviewText);
  const [fontPreviews, setFontPreviews] = useState<Record<string, string>>({});
  const [pulseFontId, setPulseFontId] = useState<string | null>(null);
  const [modalPulseFontId, setModalPulseFontId] = useState<string | null>(null);
  const [processedHighlightedId, setProcessedHighlightedId] = useState<number | null>(null);
  const toolbarTextareaRef = useRef<HTMLTextAreaElement>(null);

  const applyRandomText = () => {
    const text = RANDOM_TEXTS[Math.floor(Math.random() * RANDOM_TEXTS.length)];
    setGlobalPreviewText(text);
    setFontPreviews({});
  };

  const toolbarRef = useRef<HTMLDivElement>(null);



  const [deleteFontModal, setDeleteFontModal] = useState<{ isOpen: boolean; fontId: string | null }>({
    isOpen: false,
    fontId: null
  });

  const [deleteWeightModal, setDeleteWeightModal] = useState<{ isOpen: boolean; childFontId: string | null }>({
    isOpen: false,
    childFontId: null
  });

  useEffect(() => {
    if (id || isPublicAllFonts) {
      fetchData();
    }
  }, [id, user?.id, isPublicAllFonts, publicTagFilters.join(',')]);

  const fetchData = async () => {
    if (isPublicAllFonts) {
      // Public mode: fetch all public fonts, ignoring group logic
      setGroup(null);
      let fontsData = await getPublicFonts();
      
      setDbFonts(fontsData || []);
      
      setWeightRelationships([]);
      setLoading(false);
      return;
    }

    if (!id) return;

    // Fetch group using our group service which maps the fields correctly
    try {
      const groups = await getGroups();
      let foundOwner = false;
      if (groups && groups.length > 0) {
        const groupData = groups.find((g: Group) => g.id === id);
        if (groupData) {
          setGroup(groupData);
          foundOwner = true;
        }
      }
      
      // Fallback if not found in my_groups but might still be mine (or we need its public details)
      if (!foundOwner) {
        const { data: publicGroup } = await supabase.from('groups').select('*').eq('id', id).single();
        if (publicGroup) {
          setGroup(publicGroup);
        }
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
    
    const fontsData = await getGroupFonts(id);
    setDbFonts(fontsData || []);
    
    setWeightRelationships([]);
    setLoading(false);
  };

  const wasUploading = useRef(false);
  useEffect(() => {
    const isUploading = uploadQueue.some(t => (t.groupId === id || (isPublicAllFonts && !t.groupId)) && (t.status === 'pending' || t.status === 'uploading'));
    if (isUploading && !wasUploading.current) {
      setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
    }
    wasUploading.current = isUploading;
  }, [uploadQueue, id, isPublicAllFonts]);

  const wasUploadingRef = useRef(false);
  useEffect(() => {
    const isUploading = uploadQueue.some(t => (t.groupId === id || (isPublicAllFonts && !t.groupId)) && (t.status === 'pending' || t.status === 'uploading'));
    if (wasUploadingRef.current && !isUploading) {
      fetchData();
      if (weightsModal.isOpen && weightsModal.parentFont) {
        getFontWeights(weightsModal.parentFont.id).then(weights => {
          setWeightsModal(prev => ({ ...prev, weights: weights || [] }));
        });
      }
    }
    wasUploadingRef.current = isUploading;
  }, [uploadQueue, id, isPublicAllFonts, weightsModal.isOpen, weightsModal.parentFont]);

  const { childFontIds, parentFontIds } = useMemo(() => {
    const children = new Set<string>();
    const parents = new Set<string>();
    weightRelationships.forEach(rel => {
      children.add(rel.child_font_id);
      parents.add(rel.parent_font_id);
    });
    return { childFontIds: children, parentFontIds: parents };
  }, [weightRelationships]);

  const displayFonts = useMemo(() => {
    const relevantQueueItems = uploadQueue.filter(task => (task.groupId === id || (isPublicAllFonts && !task.groupId)) && !task.parentFontId);
    
    // Map dbFonts to preserve React keys for recently uploaded items
    const mappedDbFonts = dbFonts.map(dbFont => {
       const matchedTask = relevantQueueItems.find(t => t.fontId === dbFont.id);
       if (matchedTask) {
          // Keep the original artificial timestamp to preserve the stable sorting order while in queue
          // Retain localUrl to prevent Flash Of Unstyled Text (FOUT) when DB refreshes
          return { 
            ...dbFont, 
            download_url: matchedTask.localUrl || dbFont.download_url,
            created_at: matchedTask.timestamp ? new Date(matchedTask.timestamp).toISOString() : dbFont.created_at,
            metadata: { ...dbFont.metadata, taskId: matchedTask.id, status: matchedTask.status } 
          };
       }
       return dbFont;
    });

    const optimisticItems: Font[] = relevantQueueItems.map(task => ({
      id: task.fontId || task.id,
      group_id: id!,
      asset_id: '', 
      name: task.file.name,
      size: task.file.size,
      download_url: task.downloadUrl || task.localUrl || '',
      created_at: task.timestamp ? new Date(task.timestamp).toISOString() : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: user?.id || '',
      metadata: { 
        isUploading: task.status !== 'success',
        status: task.status,
        error: task.error,
        taskId: task.id
      }
    }));

    const filteredOptimisticItems = optimisticItems.filter(optItem => {
      if (optItem.metadata?.status !== 'success') return true;
      const realFontId = optItem.id;
      return !mappedDbFonts.some(dbFont => dbFont.id === realFontId);
    });

    const allFonts = [...mappedDbFonts, ...filteredOptimisticItems].filter(f => !childFontIds.has(f.id));

    // ترتيب الخطوط بحيث الأقدم يظهر أولاً (أو في الأعلى)
    allFonts.sort((a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime());

    if (isPublicAllFonts && publicTagFilters.length > 0) {
      let filtered = allFonts.filter(f => f.tags && publicTagFilters.some(tag => f.tags!.includes(tag)));
      
      // Sort fonts: those missing fewer of the selected tags (i.e. having more matching tags) come first
      filtered.sort((a, b) => {
        const aMatches = a.tags!.filter(t => publicTagFilters.includes(t)).length;
        const bMatches = b.tags!.filter(t => publicTagFilters.includes(t)).length;
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches; // Highest matches first
        }
        return 0; // Fallback to existing date order
      });

      return filtered;
    }

    return allFonts;
  }, [dbFonts, uploadQueue, id, user, childFontIds, isPublicAllFonts, publicTagFilters.join(',')]);

  const paginatedFonts = useMemo(() => {
    return displayFonts;
  }, [displayFonts]);

  // Dynamic weights loading for active visible/rendered fonts in the current page via secure RPC
  useEffect(() => {
    if (loading) return;
    const visibleFonts = paginatedFonts.slice(0, renderedCountInPage);
    if (visibleFonts.length === 0) return;

    let isSubscribed = true;

    const fetchWeightsForVisible = async () => {
      const currentParentIds = new Set(weightRelationships.map(r => r.parent_font_id));
      const fontsToFetch = visibleFonts.filter(f => !currentParentIds.has(f.id));

      if (fontsToFetch.length === 0) return;

      try {
        const fetchIds = fontsToFetch.map(f => f.id);
        const rels = await getWeightRelationshipsForFonts(fetchIds);
        
        if (!rels || rels.length === 0) return;
        
        const newRels: FontWeight[] = rels.map(r => ({
           id: `${r.parent_font_id}-${r.child_font_id}`,
           parent_font_id: r.parent_font_id,
           child_font_id: r.child_font_id,
        }) as FontWeight);

        if (isSubscribed && newRels.length > 0) {
          setWeightRelationships(prev => {
            const combined = [...prev, ...newRels];
            const unique = Array.from(new Map(combined.map(r => [`${r.parent_font_id}-${r.child_font_id}`, r])).values());
            return unique;
          });
        }
      } catch (err) {
        console.error('Failed to fetch weight rels', err);
      }
    };

    fetchWeightsForVisible();

    return () => {
      isSubscribed = false;
    };
  }, [paginatedFonts, renderedCountInPage, loading]);





  useEffect(() => {
    if (loading) return; 

    if (highlightedFont?.ts && highlightedFont.ts !== processedHighlightedId) {
      const parentRel = weightRelationships.find(w => w.child_font_id === highlightedFont.id);
      const targetId = parentRel ? parentRel.parent_font_id : highlightedFont.id;

      if (displayFonts.some(f => f.id === targetId)) {
        setTimeout(() => {
          const element = document.getElementById(`font-card-${targetId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setPulseFontId(targetId);
            setProcessedHighlightedId(highlightedFont.ts);
            
            if (parentRel) {
               const parentFont = displayFonts.find(f => f.id === targetId);
               if (parentFont) {
                 setTimeout(() => {
                   openWeightsModal(parentFont);
                   setModalPulseFontId(highlightedFont.id);
                   setTimeout(() => setModalPulseFontId(null), 3000);
                 }, 1200); // Give user enough time to see the main card pulse before opening modal
               }
            }
            
            // Remove pulse after 3 seconds (fade out handled by CSS transition)
            setTimeout(() => setPulseFontId(null), 3000);
          }
        }, 150); // small delay to ensure DOM layout
      }
    }
  }, [highlightedFont?.ts, loading, displayFonts.length, weightRelationships.length, processedHighlightedId]);

  useEffect(() => {
    if (loading) return; 
    
    if (fontParam && !selectedFontDetail) {
      const targetFont = isPublicAllFonts 
        ? displayFonts.find(f => f.name === fontParam)
        : displayFonts.find(f => f.id === fontParam);
        
      if (targetFont) {
        setSelectedFontDetail(targetFont);
        setActiveParentFontId(targetFont.id);
      }
    } else if (!fontParam && selectedFontDetail) {
      setSelectedFontDetail(null);
      setActiveParentFontId(null);
    }
  }, [fontParam, displayFonts, loading]);

  useEffect(() => {
    const loadFonts = async () => {
      const fontsToLoad: Font[] = [];
      paginatedFonts.slice(0, renderedCountInPage).forEach(item => {
        fontsToLoad.push(item);
      });

      if (weightsModal.isOpen) {
        if (weightsModal.parentFont) fontsToLoad.push(weightsModal.parentFont);
        weightsModal.weights.forEach(w => {
          if (w.child_font) fontsToLoad.push(w.child_font);
        });
        
        // Also load optimistic weights
        if (weightsModal.parentFont) {
          const optWeights = uploadQueue.filter(task => task.parentFontId === weightsModal.parentFont?.id);
          optWeights.forEach(opt => {
             fontsToLoad.push({
                id: opt.fontId || opt.id,
                name: opt.file.name,
                download_url: opt.downloadUrl || opt.localUrl || '',
                user_id: '', group_id: '', asset_id: '', created_at: '', updated_at: ''
             });
          });
        }
      }

      for (const font of fontsToLoad) {
        if (font.download_url && font.id) {
          const styleId = `style-${font.id}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            
            // Determine format
            let format = "format('truetype')";
            const lowerName = (font.name || '').toLowerCase();
            if (lowerName.endsWith('.woff2') || font.download_url.includes('.woff2')) format = "format('woff2')";
            else if (lowerName.endsWith('.woff') || font.download_url.includes('.woff')) format = "format('woff')";
            else if (lowerName.endsWith('.otf') || font.download_url.includes('.otf')) format = "format('opentype')";

            style.textContent = `
              @font-face {
                font-family: "${font.name}";
                src: url("${font.download_url}") ${format};
                font-display: swap;
              }
            `;
            document.head.appendChild(style);

            // Preload link to handle CORS explicitly as requested
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'font';
            link.href = font.download_url;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
          }
        }
      }
    };
    loadFonts();
  }, [paginatedFonts, renderedCountInPage, weightsModal.isOpen, weightsModal.weights, weightsModal.parentFont]);

  useEffect(() => {
    // Cleanup DOM style nodes and preloads when context, page, tag filter, or mode changes
    return () => {
      const dynamicStyles = document.querySelectorAll('style[id^="style-"]');
      dynamicStyles.forEach(el => el.remove());
      
      const dynamicLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      dynamicLinks.forEach(el => el.remove());
    };
  }, [id, currentPage, publicTagFilters.join(','), isPublicAllFonts]);

  useEffect(() => {
    const adjust = () => {
      if (toolbarTextareaRef.current) {
        toolbarTextareaRef.current.style.height = 'auto';
        toolbarTextareaRef.current.style.height = `${toolbarTextareaRef.current.scrollHeight}px`;
      }
    };
    adjust();
    const frameId = requestAnimationFrame(adjust);
    return () => cancelAnimationFrame(frameId);
  }, [globalPreviewText, publicTagFilters.join(','), isPublicAllFonts]);

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename.endsWith('.ttf') || filename.endsWith('.otf') || filename.endsWith('.woff') || filename.endsWith('.woff2') 
        ? filename : `${filename}.ttf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const handlePreviewChange = (fontId: string, text: string) => {
    setFontPreviews(prev => ({ ...prev, [fontId]: text }));
  };

  const getPreviewText = (fontId: string) => {
    const text = fontPreviews[fontId] !== undefined ? fontPreviews[fontId] : deferredGlobalPreviewText;
    return text === '' ? 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)' : text;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || (!id && !isPublicAllFonts) || !user || !isOwner) return;
    const allFiles = Array.from(e.target.files);
    
    let targetGroupId = id || null;

    if (allFiles.length > 10) addNotification('error', t('font.max_limit') || 'Max 10');
    const filesToProcess = allFiles.slice(0, 10);
    addToUploadQueue(filesToProcess, targetGroupId);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleWeightUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length || !uploadingWeightFor || !user || (!id && !isPublicAllFonts)) return;
    const files = Array.from(e.target.files);
    addToUploadQueue(files, id || null, uploadingWeightFor);
    setUploadingWeightFor(null);
    if (weightInputRef.current) weightInputRef.current.value = '';
  };

  const handleDeleteFont = async (fontId: string) => {
    if ((!id && !isPublicAllFonts) || !isOwner) return;
    try {
      // Optimistic update
      setDbFonts(prev => prev.filter(f => f.id !== fontId));
      removeFromQueueByFontId(fontId);
      setDeleteFontModal({ isOpen: false, fontId: null });

      // Run real deletion without blocking
      deleteFontPermanently(fontId)
        .then(() => {
          // fetchData() optional, let's keep it silent
        })
        .catch((error) => {
          console.error(error);
          addNotification('error', t('font.delete_error'));
          fetchData(); // Rollback
        });
        
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteWeight = async (childFontId: string) => {
    if (!weightsModal.parentFont || !isOwner) return;
    try {
      // Optimistic update
      setWeightsModal(prev => ({
        ...prev,
        weights: prev.weights.filter(w => w.child_font_id !== childFontId)
      }));
      removeFromQueueByFontId(childFontId);
      setDeleteWeightModal({ isOpen: false, childFontId: null });

      // Run real deletion
      deleteFontPermanently(childFontId)
        .then(() => {
          // Success
        })
        .catch(error => {
           console.error(error);
           addNotification('error', t('font.delete_weight_error'));
           // Rollback
           if (weightsModal.parentFont) {
             getFontWeights(weightsModal.parentFont.id).then(weights => {
               setWeightsModal(p => ({ ...p, weights: weights || [] }));
             });
           }
        });
        
    } catch (error) {
      console.error(error);
    }
  };

  const openWeightsModal = async (font: Font) => {
    setWeightsModal({ isOpen: true, parentFont: font, weights: [] });
    try {
      const weights = await getFontWeights(font.id);
      setWeightsModal({ isOpen: true, parentFont: font, weights: weights || [] });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdateTags = async () => {
    if (!tagEditModal.fontId) return;
    try {
      const targetFont = dbFonts.find(f => f.id === tagEditModal.fontId);
      if (!targetFont) return;
      
      const cleanNewTag = newSingleTag
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
        .trim();

      if (!cleanNewTag) {
        addNotification('error', dir === 'rtl' ? 'يرجى إدخال هاشتاغ صالح' : 'Please enter a valid tag');
        return;
      }

      const existingTags = targetFont.tags || [];
      if (existingTags.includes(cleanNewTag)) {
        addNotification('error', dir === 'rtl' ? 'هذا الهاشتاغ مضاف بالفعل لهذا الخط' : 'Tag already exists for this font');
        return;
      }

      const updatedTags = [...existingTags, cleanNewTag];
      await import('../services/fontService').then(m => m.updateFontTags(tagEditModal.fontId!, updatedTags));
      addNotification('success', dir === 'rtl' ? 'تم إضافة الهاشتاغ بنجاح!' : 'Tag added successfully!');
      setNewSingleTag('');
      fetchData(); // Automatically reflect the changes
    } catch (e) {
      console.error(e);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء إضافة الهاشتاغ' : 'Error adding tag');
    }
  };

  const handleRemoveTag = async (fontId: string, tagToRemove: string) => {
    try {
      const targetFont = dbFonts.find(f => f.id === fontId);
      if (!targetFont) return;

      const updatedTags = (targetFont.tags || []).filter(t => t !== tagToRemove);
      await import('../services/fontService').then(m => m.updateFontTags(fontId, updatedTags));
      addNotification('success', dir === 'rtl' ? 'تم إزالة الهاشتاغ بنجاح!' : 'Tag removed successfully!');
      fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء إزالة الهاشتاغ' : 'Error removing tag');
    }
  };

  const handleRenameHashtagGlobally = async (oldTag: string, newTag: string) => {
    const formattedNewTag = newTag
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
      .trim();

    if (!formattedNewTag) {
      addNotification('error', dir === 'rtl' ? 'الهاشتاغ الجديد غير صالح' : 'Invalid new tag');
      return;
    }
    
    try {
      setLoading(true);
      // Find all public fonts that contain this oldTag
      const allFonts = await getPublicFonts();
      const fontsWithOldTag = allFonts.filter(f => f.tags && f.tags.includes(oldTag));
      
      if (fontsWithOldTag.length === 0) {
        addNotification('error', dir === 'rtl' ? 'لم يتم العثور على خطوط مرتبطة بهذا الهاشتاغ' : 'No fonts found with this tag');
        setLoading(false);
        return;
      }
      
      const updatePromises = fontsWithOldTag.map(font => {
        const updatedTags = (font.tags || [])
          .map(t => t === oldTag ? formattedNewTag : t)
          .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate
        return import('../services/fontService').then(m => m.updateFontTags(font.id, updatedTags));
      });
      
      await Promise.all(updatePromises);
      addNotification('success', dir === 'rtl' ? `تم تعديل الهاشتاغ من #${oldTag} إلى #${formattedNewTag} في جميع الخطوط!` : `Tag renamed from #${oldTag} to #${formattedNewTag} in all fonts!`);
      
      // Update public filter state in the parent if it matches oldTag
      if (publicTagFilters.includes(oldTag) && onTagClick) {
        onTagClick(formattedNewTag);
        onTagClick(oldTag); // Toggle old one out
      }
      
      setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' });
      await fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء تعديل الهاشتاغ العام' : 'Error renaming global tag');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHashtagGlobally = async (tagToDelete: string) => {
    try {
      setLoading(true);
      const allFonts = await getPublicFonts();
      const fontsWithTag = allFonts.filter(f => f.tags && f.tags.includes(tagToDelete));
      
      if (fontsWithTag.length === 0) {
        addNotification('info', dir === 'rtl' ? `تم إزالة الهاشتاغ #${tagToDelete} بنجاح!` : `Tag #${tagToDelete} removed successfully!`);
        if (onClearTagFilter) onClearTagFilter();
        setLoading(false);
        return;
      }

      const updatePromises = fontsWithTag.map(font => {
        const updatedTags = (font.tags || []).filter(t => t !== tagToDelete);
        return import('../services/fontService').then(m => m.updateFontTags(font.id, updatedTags));
      });

      await Promise.all(updatePromises);
      addNotification('success', dir === 'rtl' ? `تم حذف الهاشتاغ #${tagToDelete} نهائياً من جميع الخطوط المرتبطة به!` : `Tag #${tagToDelete} permanently deleted from all associated fonts!`);
      
      if (onClearTagFilter) {
        onClearTagFilter();
      }
      setTagDeleteGlobalModal({ isOpen: false, tag: '' });
      await fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', dir === 'rtl' ? 'حدث خطأ أثناء حذف الهاشتاغ عالمياً' : 'Error deleting tag globally');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white opacity-40 animate-pulse">{t('common.loading')}</div>;
  if (!isPublicAllFonts && !group) return <div className="text-center py-20 text-white opacity-40">Group not found</div>;

  return (
    <div className="relative pb-32 max-lg:landscape:pb-16 pt-0" dir={dir}>
      {isPublicAllFonts && publicTagFilters.length > 0 ? (
        /* ======================== DETACHED DEDICATED HASHTAG VIEW ======================== */
        <div className="pb-8 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans" key="hashtag-isolate">
          <div className="flex flex-col gap-6">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
              <button 
                onClick={onClearTagFilter}
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/5 hover:bg-white/10 text-white hover:text-white border border-white/10 hover:border-white/20 hover:shadow-lg transition-all cursor-pointer active:scale-95 select-none shrink-0"
                title={dir === 'rtl' ? 'العودة للخطوط العامة' : 'Back to public fonts'}
              >
                {dir === 'rtl' ? (
                  <ArrowRight className="w-5 h-5 text-cyan-400" />
                ) : (
                  <ArrowLeft className="w-5 h-5 text-cyan-400" />
                )}
              </button>
              
              <span className="text-[10px] tracking-wider uppercase font-bold text-cyan-400 bg-cyan-400/5 px-2.5 py-1 rounded-md border border-cyan-400/10">
                {dir === 'rtl' ? 'التصفية المتعددة' : 'Multiple Filter'}
              </span>
            </div>

            {/* Huge Beautiful Hashtag Banner with Pencil/Trash Admin controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-7 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              {/* Dynamic decorative backdrop blur anchor */}
              <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
              
              <div className="flex flex-col gap-5 relative z-10 w-full">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    {publicTagFilters.map(filterTag => (
                      <div key={filterTag} className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                          <span className="font-mono text-xl font-bold leading-none">#</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-none font-display">
                          {filterTag}
                        </h2>
                        {/* Controls placed RIGHT BY the Hashtag as requested */}
                        {isAdmin && (
                          <div className="flex items-center gap-1 shrink-0 select-none mr-2">
                            <button
                              onClick={() => setTagRenameModal({ isOpen: true, oldTag: filterTag, newTag: filterTag })}
                              className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/35 text-white/60 hover:text-cyan-400 transition-all cursor-pointer"
                              title={dir === 'rtl' ? 'تعديل هذا الهاشتاغ عالمياً' : 'Edit this globally'}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setTagDeleteGlobalModal({ isOpen: true, tag: filterTag })}
                              className="w-7 h-7 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/35 text-white/60 hover:text-red-400 transition-all cursor-pointer"
                              title={dir === 'rtl' ? 'حذف هذا الهاشتاغ عالمياً' : 'Delete this globally'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-1 font-light">
                    {dir === 'rtl' ? (
                      <>تم العثور على <span className="text-cyan-400 font-bold font-mono">{displayFonts.length}</span> خطوط مرتبطة بهذا التصنيف</>
                    ) : (
                      <>Found <span className="text-cyan-400 font-bold font-mono">{displayFonts.length}</span> fonts related to this filter</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Consolidated Controls Container in Hashtag view */}
            <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              
              {/* Preview input */}
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.preview_text')}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={applyRandomText}
                      className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                      title={t('toolbar.random_text') || 'Random Text'}
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {globalPreviewText && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { setGlobalPreviewText(''); setFontPreviews({}); }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <textarea
                  ref={toolbarTextareaRef}
                  value={globalPreviewText}
                  onChange={(e) => {
                    setGlobalPreviewText(e.target.value);
                    setFontPreviews({});
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full bg-transparent border-0 p-0 text-white text-base md:text-lg focus:ring-0 outline-none resize-none placeholder:text-white/15 transition-all duration-300 leading-normal font-light text-right"
                  placeholder={t('toolbar.placeholder') || "اكتب نصاً للمعاينة..."}
                  rows={1}
                  style={{ minHeight: '32px', fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }}
                />
              </div>

              {/* Slider splitter */}
              <div className="w-full md:w-px md:h-auto h-px bg-white/5 shrink-0" />

              {/* Slider component */}
              <div className="w-full md:w-[220px] shrink-0 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.font_size')}</span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded-lg text-[10px] border border-cyan-400/10 font-medium">{fontSize}px</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <input 
                    type="range" 
                    min="20" 
                    max="50" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))} 
                    className="w-full h-1 bg-[#222] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 focus:outline-none focus:ring-0" 
                    dir="ltr"
                    style={{
                      background: `linear-gradient(to right, rgb(34, 211, 238) ${((fontSize - 20) / 30) * 100}%, #222 ${((fontSize - 20) / 30) * 100}%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== STANDARD VIEW (GROUPS & LIST CORES) ======================== */
        <div className="pb-8 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans" key="standard-main">
          <div className="flex flex-col gap-6" ref={toolbarRef}>
            {/* Top Row: Title/Group Name opposite/next to Button Controls! */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-3xl font-bold font-display text-white tracking-tight leading-tight">
                  {isPublicAllFonts ? 'الخطوط العامة' : group?.name}
                </h1>
              </div>

              {/* Controls aligned visually opposite the title */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Filter trigger */}
                {isPublicAllFonts && (
                  <button 
                    onClick={() => setIsTagModalOpen(true)}
                    className={`w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300 backdrop-blur-md relative cursor-pointer
                      ${publicTagFilters.length > 0 ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'}
                    `}
                    title={publicTagFilters.length > 0 ? (dir === 'rtl' ? `مصنف حسب: #${publicTagFilters.join(', #')}` : `Filtered by: #${publicTagFilters.join(', #')}`) : (dir === 'rtl' ? 'تصنيف بالهاشتاغات' : 'Filter by Tags')}
                  >
                    <Filter className="w-4 h-4" />
                    {publicTagFilters.length > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-400 border border-[#0a0a0a] text-[10px] text-black font-bold flex items-center justify-center -translate-y-0.5">
                        {publicTagFilters.length}
                      </span>
                    )}
                  </button>
                )}

                {/* Upload Action with direct upload logic */}
                {isOwner && (
                  <div className="relative flex items-center shrink-0 group">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-2.5 px-5 h-10 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 font-bold text-xs tracking-wide group/btn active:scale-95 text-right font-sans focus:outline-none shrink-0 cursor-pointer animate-fade-in"
                      title={t('font.upload') || 'رفع خط'}
                    >
                      <Upload className="w-4 h-4 text-cyan-400 shrink-0 group-hover/btn:-translate-y-0.5 group-hover/btn:scale-110 transition-transform duration-300" />
                      <span>{t('font.upload') || 'رفع خطوط جديدة'}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 relative block ml-0.5">
                        <span className="absolute inset-0 bg-cyan-400 rounded-full animate-ping opacity-75"></span>
                      </span>
                    </button>
                    {/* Perfect layout-safe micro hover tooltip */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-50 bg-[#0f0f0f] border border-white/5 py-1 px-2.5 rounded-xl text-[10px] text-white/50 shadow-[0_4px_20px_rgba(0,0,0,0.5)] whitespace-nowrap scale-95 group-hover:scale-100 font-light font-sans tracking-wide">
                      {dir === 'rtl' ? 'الحد الأقصى لكل دفعة: ١٠ ملفات' : 'Batch limit: 10 files max'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-header descriptions & Tag filters */}
            {((!isPublicAllFonts && group?.description) || (isPublicAllFonts && publicTagFilters.length > 0)) && (
              <div className="space-y-2 -mt-4">
                {!isPublicAllFonts && group?.description && (
                  <p className="text-sm text-white opacity-50 font-light leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {group.description}
                  </p>
                )}
                {isPublicAllFonts && publicTagFilters.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    {publicTagFilters.map(filterTag => (
                      <div key={filterTag} className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                        <span className="opacity-50 font-mono">#</span>
                        <span className="font-medium">{filterTag}</span>
                        {onTagClick && (
                          <button 
                            onClick={() => onTagClick(filterTag)}
                            className="ml-1.5 p-0.5 rounded-full hover:bg-cyan-500/25 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    {onClearTagFilter && publicTagFilters.length > 1 && (
                      <button 
                        onClick={onClearTagFilter}
                        className="text-xs bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-full transition-colors font-medium border border-red-500/20 cursor-pointer"
                      >
                        {dir === 'rtl' ? 'مسح الكل' : 'Clear All'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Unified Preview & Size Controls (Merged Single Card) */}
            <div className="w-full bg-[#141414] border border-white/5 rounded-3xl p-4 flex flex-col md:flex-row items-stretch gap-4 hover:bg-white/[0.02] transition-all duration-300 relative overflow-hidden group/unified">
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
              
              {/* Preview Text part - takes up remaining space */}
              <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.preview_text')}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={applyRandomText}
                      className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                      title={t('toolbar.random_text') || 'Random Text'}
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                    <AnimatePresence>
                      {globalPreviewText && (
                        <motion.button 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          onClick={() => { setGlobalPreviewText(''); setFontPreviews({}); }}
                          className="text-white/35 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all bg-white/5 active:scale-95 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <textarea
                  ref={toolbarTextareaRef}
                  value={globalPreviewText}
                  onChange={(e) => {
                    setGlobalPreviewText(e.target.value);
                    setFontPreviews({});
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  className="w-full bg-transparent border-0 p-0 text-white text-base md:text-lg focus:ring-0 outline-none resize-none placeholder:text-white/15 transition-all duration-300 leading-normal font-light text-right"
                  placeholder={t('toolbar.placeholder') || "اكتب نصاً للمعاينة..."}
                  rows={1}
                  style={{ minHeight: '32px', fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }}
                />
              </div>

              {/* Vertical Divider for desktop / Horizontal for mobile */}
              <div className="w-full md:w-px md:h-auto h-px bg-white/5 shrink-0" />

              {/* Font Size Selector part */}
              <div className="w-full md:w-[220px] shrink-0 flex flex-col justify-between gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-white/40 uppercase tracking-widest text-[9px] font-bold">{t('toolbar.font_size')}</span>
                  <span className="font-mono text-cyan-400 bg-cyan-400/5 px-2 py-0.5 rounded-lg text-[10px] border border-cyan-400/10 font-medium">{fontSize}px</span>
                </div>
                <div className="relative w-full h-8 flex items-center">
                  <input 
                    type="range" 
                    min="20" 
                    max="50" 
                    value={fontSize} 
                    onChange={(e) => setFontSize(Number(e.target.value))} 
                    className="w-full h-1 bg-[#222] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:bg-cyan-400 [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-110 active:[&::-webkit-slider-thumb]:scale-95 focus:outline-none focus:ring-0" 
                    dir="ltr"
                    style={{
                      background: `linear-gradient(to right, rgb(34, 211, 238) ${((fontSize - 20) / 30) * 100}%, #222 ${((fontSize - 20) / 30) * 100}%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={weightInputRef} onChange={handleWeightUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />

      <div className="w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {paginatedFonts.slice(0, renderedCountInPage).map((item, i) => (
            <motion.div
              key={item.metadata?.taskId || item.id}
              id={`font-card-${item.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={`group font-card-item bg-[#141414] p-4 rounded-2xl border transition-all duration-300 flex flex-col gap-3 relative overflow-hidden border-white/5 hover:border-white/10 cursor-pointer ${pulseFontId === item.id ? 'ring-1 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'ring-0 ring-transparent shadow-none'}`}
              onClick={() => {
                navigate(isPublicAllFonts ? `/fonts/${item.name}` : `/my-fonts/${item.id}${id ? `?group=${id}` : ''}`);
                setSelectedFontDetail(item);
                setActiveParentFontId(item.id);
              }}
            >
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-white/5 w-10 h-10 rounded-xl text-white opacity-60 group-hover:text-white group-hover:bg-white/10 transition-all shrink-0 flex items-center justify-center overflow-hidden">
                    {(!item.metadata?.isUploading || item.download_url) && (
                      <span style={{ fontFamily: `"${item.name}", sans-serif`, fontSize: '22px', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {dir === 'rtl' ? 'ع' : 'a'}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-medium text-white text-base opacity-50 flex-1 flex flex-wrap items-center gap-2 min-w-0">
                        <span dir="ltr" className="truncate text-left block">{formatFontName(item.name || '')}</span>
                        {item.metadata?.status === 'success' && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                      </div>
                      {item.metadata?.error && <span className="text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded">Failed</span>}
                    </div>
                  </div>
                </div>

                <div className="flex items-center shrink-0 gap-1.5 relative z-10 transition-all duration-300">
                  {item.download_url && !item.metadata?.isUploading && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); if (item.download_url) handleDownload(item.download_url, item.name); }} 
                      className="w-9 h-9 bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/30 text-white/70 hover:text-cyan-400 rounded-xl transition-all duration-300 flex items-center justify-center active:scale-90 cursor-pointer shadow-sm" 
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && !item.metadata?.isUploading && (
                    <button 
                      type="button" 
                      onClick={(e) => { e.stopPropagation(); setDeleteFontModal({ isOpen: true, fontId: item.id }); }} 
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
                  onClick={(e) => { e.stopPropagation(); }} 
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
                    whiteSpace: 'nowrap'
                  }} 
                />
              </div>

              {/* Bottom Hashtags & Weights Section with modern layered background (Separated & Larger) */}
              {(((isPublicAllFonts && ((item.tags && item.tags.length > 0) || isAdmin))) || ((parentFontIds.has(item.id) || isOwner) && !item.metadata?.isUploading)) && (
                <div className="mt-auto pt-2 bg-transparent flex items-center gap-1 relative z-20 border-t border-white/[0.02]" onClick={(e) => e.stopPropagation()}>
                  <div className="w-full bg-black/40 backdrop-blur-md rounded-xl p-1 flex items-center justify-between border border-white/5 relative overflow-hidden h-[34px]">
                    
                    {/* Tags Slider Area */}
                    <div className="flex-1 overflow-hidden relative h-full flex items-center">
                      <div className={`flex-1 flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap py-0.5 ${dir === 'rtl' ? 'pl-8' : 'pr-8'}`}>
                        {isPublicAllFonts && item.tags && item.tags.map(tag => (
                          <button 
                             key={tag} 
                             onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                             className="text-[10px] bg-white/[0.03] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 px-2.5 py-1 rounded-lg text-white/60 cursor-pointer transition-all duration-300 flex items-center gap-1 font-sans font-light shrink-0"
                          >
                            <span className="text-cyan-400 opacity-50 font-mono">#</span>
                            <span>{tag}</span>
                          </button>
                        ))}
                        {isPublicAllFonts && isAdmin && (
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
                      
                      {/* Elegant Fade Mask to conceal tags smoothly under the button */}
                      <div className={`absolute top-0 bottom-0 pointer-events-none z-10 ${
                        (((parentFontIds.has(item.id) || isOwner) && !item.metadata?.isUploading)) ? 'w-16' : 'w-8'
                      } ${
                        dir === 'rtl' 
                          ? 'left-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent' 
                          : 'right-0 bg-gradient-to-l from-black/80 via-black/50 to-transparent'
                      }`} />

                      {/* Weights action overlayed above gradient */}
                      {((parentFontIds.has(item.id) || isOwner) && !item.metadata?.isUploading) && (
                        <div className={`absolute z-20 top-1/2 -translate-y-1/2 px-1.5 ${
                          dir === 'rtl' ? 'left-0' : 'right-0'
                        }`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openWeightsModal(item);
                            }}
                            className={`w-6 h-6 cursor-pointer transition-all duration-300 flex items-center justify-center rounded-lg shrink-0 
                              ${parentFontIds.has(item.id) 
                                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-300 hover:scale-110 shadow-[0_0_15px_rgba(6,182,212,0.4)] animate-[pulse_1.8s_infinite]' 
                                : 'bg-white/5 border border-white/10 text-white/50 hover:bg-white/10 hover:border-white/20 hover:text-white'}`}
                            title={dir === 'rtl' ? 'أوزان الخط' : 'Font Weights'}
                          >
                            <Layers className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
          </AnimatePresence>
        
          {displayFonts.length === 0 && (
            <div className="col-span-full text-center py-20 text-white opacity-30 bg-[#141414] rounded-[2rem] border border-white/5 border-dashed">
              No fonts yet. {isOwner && 'Upload one to get started.'}
            </div>
          )}
        </div>
      </div>

      {/* Weights Modal */}
      {createPortal(
        <AnimatePresence>
          {weightsModal.isOpen && (
            <div className="fixed inset-0 z-[9999] flex flex-col justify-end">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setWeightsModal(prev => ({ ...prev, isOpen: false }))} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 300 }} className="bg-[#141414] border border-white/10 w-full max-w-lg mx-auto rounded-t-3xl p-5 pb-8 sm:pb-5 relative z-10 shadow-2xl max-h-[85vh] flex flex-col mt-auto">
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-white leading-tight font-display">{formatFontName(weightsModal.parentFont?.name || '')}</h3>
                    <span className="text-xs text-white opacity-40">{t('font.weights')}</span>
                  </div>
                  <button onClick={() => setWeightsModal(prev => ({ ...prev, isOpen: false }))} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <X className="w-5 h-5 text-white opacity-70" />
                  </button>
                </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar max-h-[310px] min-h-0 space-y-2">
                {/* Parent Font */}
                <div className={`bg-white/5 p-2 rounded-xl border flex flex-col gap-1 relative overflow-hidden transition-all duration-700 ${modalPulseFontId === weightsModal.parentFont?.id ? 'border-white/30 shadow-lg ring-1 ring-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-white/5 ring-0 ring-transparent shadow-none'}`}>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                           <span style={{ fontFamily: `"${weightsModal.parentFont?.name}", sans-serif`, fontSize: '14px', lineHeight: 1 }}>{dir === 'rtl' ? 'ع' : 'a'}</span>
                        </div>
                        <div>
                          <p className="text-white font-bold text-xs truncate max-w-[150px]">{formatFontName(weightsModal.parentFont?.name || '')}</p>
                        </div>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(weightsModal.parentFont?.download_url!, weightsModal.parentFont?.name!); }} className="p-1.5 hover:bg-white/10 rounded-full text-white opacity-50 hover:text-white transition-colors">
                        <Download className="w-3.5 h-3.5" />
                      </button>
                   </div>
                   <textarea value={getPreviewText(weightsModal.parentFont?.id || '')} onChange={(e) => handlePreviewChange(weightsModal.parentFont?.id || '', e.target.value)} className="w-full bg-transparent border-none outline-none text-white font-light resize-none h-8 overflow-hidden" style={{ fontFamily: weightsModal.parentFont?.name ? `"${weightsModal.parentFont.name}", sans-serif` : 'sans-serif', fontSize: '15px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }} />
                </div>

                {/* Weights */}
                {(() => {
                  const parentId = weightsModal.parentFont?.id;
                  if (!parentId) return null;

                  const relevantWeightTasks = uploadQueue.filter(task => task.parentFontId === parentId);
                  
                  const realWeights = weightsModal.weights.map(w => {
                     const childFont = w.child_font;
                     if (!childFont) return null;
                     const matchedTask = relevantWeightTasks.find(t => t.fontId === w.child_font_id || t.file.name === childFont.name);
                     if (matchedTask) {
                        return { 
                          id: w.id, 
                          font: { 
                            ...childFont, 
                            download_url: matchedTask.localUrl || childFont.download_url,
                            created_at: matchedTask.timestamp ? new Date(matchedTask.timestamp).toISOString() : childFont.created_at,
                            metadata: { ...childFont.metadata, taskId: matchedTask.id, status: matchedTask.status } 
                          }, 
                          isOptimistic: false, 
                          childFontId: w.child_font_id 
                        };
                     }
                     return { id: w.id, font: childFont, isOptimistic: false, childFontId: w.child_font_id };
                  }).filter(Boolean) as any[];

                  const existingTaskIds = new Set(realWeights.map(rw => rw.font?.metadata?.taskId).filter(Boolean));
                  
                  const optimisticWeights = relevantWeightTasks
                    .filter(task => !existingTaskIds.has(task.id) && !realWeights.some(real => real.childFontId === task.fontId || real.font?.name === task.file.name))
                    .map(task => ({
                    id: task.id,
                    font: { 
                      id: task.fontId || task.id, 
                      name: task.file.name, 
                      download_url: task.downloadUrl || task.localUrl || '', 
                      created_at: task.timestamp ? new Date(task.timestamp).toISOString() : new Date().toISOString(),
                      metadata: { isUploading: task.status !== 'success', status: task.status, taskId: task.id } 
                    },
                    isOptimistic: true, childFontId: task.fontId
                  }));

                  const allWeights = [...optimisticWeights, ...realWeights];
                  allWeights.sort((a, b) => {
                     const dateA = new Date((a as any).created_at || a.font?.created_at || 0);
                     const dateB = new Date((b as any).created_at || b.font?.created_at || 0);
                     return dateA.getTime() - dateB.getTime();
                  });

                  if (allWeights.length === 0) return <p className="text-center text-white opacity-30 py-8 text-sm">{t('font.no_weights')}</p>;

                  return allWeights.map((w) => (
                    <div key={w.font?.metadata?.taskId || w.id} className={`bg-white/5 p-2 rounded-xl border flex flex-col gap-1 group/item transition-all duration-700 ${modalPulseFontId === w.font?.id ? 'border-white/30 shadow-lg ring-1 ring-white/50 bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'border-white/5 ring-0 ring-transparent shadow-none'}`}>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden">
                               <span style={{ fontFamily: w.font?.name ? `"${w.font.name}", sans-serif` : 'sans-serif', fontSize: '14px', lineHeight: 1 }}>{dir === 'rtl' ? 'ع' : 'a'}</span>
                            </div>
                            <div className="flex items-center gap-2 min-w-0">
                              <p dir="ltr" className="text-white font-medium text-xs truncate max-w-[150px] text-left">{formatFontName(w.font?.name || '')}</p>
                              {w.font?.metadata?.status === 'success' && <Check className="w-3.5 h-3.5 text-white flex-shrink-0" />}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {!w.font?.metadata?.isUploading && (
                              <>
                                <button onClick={(e) => { e.stopPropagation(); handleDownload(w.font?.download_url!, w.font?.name!); }} className="p-2 -mr-1 hover:bg-white/10 rounded-full text-white opacity-50 hover:text-white transition-colors">
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {isOwner && !w.isOptimistic && (
                                  <button onClick={(e) => { e.stopPropagation(); setDeleteWeightModal({ isOpen: true, childFontId: w.childFontId || null }); }} className="p-2 -mr-1 hover:bg-red-500/10 rounded-full text-white opacity-30 hover:text-red-400 transition-colors" title="Delete Weight">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                       </div>
                       <textarea value={getPreviewText(w.font?.id || '')} onChange={(e) => handlePreviewChange(w.font?.id || '', e.target.value)} className="w-full bg-transparent border-none outline-none text-white font-light resize-none h-8 overflow-hidden" style={{ fontFamily: w.font?.name ? `"${w.font.name}", sans-serif` : 'sans-serif', fontSize: '15px', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', fontFeatureSettings: 'normal', fontVariantLigatures: 'normal' }} />
                    </div>
                  ));
                })()}
              </div>
              
              {isOwner && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <button onClick={() => { if (weightsModal.parentFont) { setUploadingWeightFor(weightsModal.parentFont.id); weightInputRef.current?.click(); } }} className="w-full py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />{t('font.add_weight')}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Tags Selection Modal */}
      {createPortal(
        <AnimatePresence>
          {isTagModalOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" dir={dir}>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => setIsTagModalOpen(false)} 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                transition={{ type: "spring", damping: 25, stiffness: 350 }} 
                className="bg-[#0f0f0f]/95 border border-white/10 w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-[0_10px_40px_rgba(0,0,0,0.8)] max-h-[80vh] flex flex-col font-sans"
              >
                <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                      <Filter className="w-4 h-4" />
                    </div>
                    <h3 className="text-md font-bold text-white tracking-tight font-display">{dir === 'rtl' ? 'تصنيف الخطوط حسب الهاشتاغ' : 'Filter Fonts by Tag'}</h3>
                  </div>
                  <button 
                    onClick={() => setIsTagModalOpen(false)} 
                    className="p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X className="w-4 h-4 text-white opacity-70" />
                  </button>
                </div>

                <div className="overflow-y-auto pr-1 custom-scrollbar flex-1 mb-5">
                  {availableTags.length === 0 ? (
                    <div className="text-sm text-white/40 py-8 text-center font-light">{dir === 'rtl' ? 'لا توجد هاشتاغات متاحة حالياً للتصنيف' : 'No tags available for filtering'}</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1" dir="rtl">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            onTagClick?.(tag);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 border font-light cursor-pointer
                            ${publicTagFilters.includes(tag) 
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)] scale-105' 
                              : 'bg-white/[0.03] text-white/70 border-white/5 hover:border-white/20 hover:text-white'
                            }
                          `}
                        >
                          <span className="opacity-40 font-mono">#</span>
                          <span>{tag}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {publicTagFilters.length > 0 && (
                  <button
                    onClick={() => {
                      onClearTagFilter?.();
                      setIsTagModalOpen(false);
                    }}
                    className="w-full py-2.5 rounded-xl text-xs text-red-400 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 hover:border-red-500/20 transition-all font-light mt-auto cursor-pointer"
                  >
                    إلغاء التصفية النشطة
                  </button>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <ConfirmationModal
        isOpen={deleteFontModal.isOpen}
        onClose={() => setDeleteFontModal({ isOpen: false, fontId: null })}
        onConfirm={() => {
          if (deleteFontModal.fontId) {
            handleDeleteFont(deleteFontModal.fontId);
          }
        }}
        title={t('font.delete_title') || 'Delete Font'}
        message={t('font.delete_confirm') || 'Are you sure you want to delete this font?'}
        confirmText={t('common.delete')}
        variant="danger"
      />

      <ConfirmationModal
        isOpen={deleteWeightModal.isOpen}
        onClose={() => setDeleteWeightModal({ isOpen: false, childFontId: null })}
        onConfirm={() => {
          if (deleteWeightModal.childFontId) {
            handleDeleteWeight(deleteWeightModal.childFontId);
          }
        }}
        title={t('font.delete_weight_title') || 'Delete Weight'}
        message={t('font.delete_weight_confirm') || 'Are you sure you want to delete this weight?'}
        confirmText={t('common.delete')}
        variant="danger"
      />

      <AnimatePresence>
        {tagEditModal.isOpen && (() => {
          const currentFont = dbFonts.find(f => f.id === tagEditModal.fontId);
          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans" dir={dir}>
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={() => {
                  setTagEditModal({ isOpen: false, fontId: null, tagsText: '' });
                  setNewSingleTag('');
                }} 
                className="absolute inset-0 bg-black/80 backdrop-blur-md" 
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 15 }} 
                className="relative bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col gap-5 z-10"
              >
                <div>
                   <h3 className="text-white font-bold text-lg mb-1 font-display">{dir === 'rtl' ? 'إدارة هاشتاغات الخط' : 'Manage Font Tags'}</h3>
                   <p className="text-white/40 text-xs font-light">{dir === 'rtl' ? 'لخط:' : 'For font:'} <span className="text-cyan-400 font-mono text-xs">{formatFontName(currentFont?.name || '')}</span></p>
                </div>

                {/* Existing Tags Chips list */}
                <div>
                  <h4 className="text-white/60 text-xs font-medium mb-2.5">{dir === 'rtl' ? 'الهاشتاغات الحالية المضافة:' : 'Current added tags:'}</h4>
                  {(!currentFont?.tags || currentFont.tags.length === 0) ? (
                    <div className="text-white/30 text-xs py-2 font-light">{dir === 'rtl' ? 'لا توجد هاشتاغات مضافة بعد لهذا الخط' : 'No tags added yet for this font'}</div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {currentFont.tags.map(tag => (
                        <div 
                          key={tag} 
                          className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-xl bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/10 text-cyan-400 text-xs font-light transition-colors"
                        >
                          <span className="opacity-50 font-mono">#</span>
                          <span>{tag}</span>
                          <button 
                            onClick={() => handleRemoveTag(currentFont.id, tag)}
                            className="p-0.5 rounded-md hover:bg-cyan-500/20 text-cyan-400/50 hover:text-cyan-300 transition-colors cursor-pointer"
                            title={dir === 'rtl' ? 'إزالة الهاشتاغ' : 'Remove tag'}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add new Tag Input with frozen `#` prefix */}
                <div className="space-y-2">
                  <label className="text-white/60 text-xs font-medium">{dir === 'rtl' ? 'إضافة هاشتاغ جديد:' : 'Add new tag:'}</label>
                  <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/50 rounded-2xl px-4 py-3.5 transition-all duration-300">
                    <span className="text-cyan-400 font-bold select-none text-base mr-1 font-mono">#</span>
                    <input 
                      type="text" 
                      value={newSingleTag} 
                      autoFocus
                      onChange={(e) => {
                        const val = e.target.value;
                        const cleaned = val
                          .replace(/\s+/g, '_')
                          .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                        setNewSingleTag(cleaned);
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleUpdateTags();
                        }
                      }}
                      className="w-full bg-transparent border-none p-0 text-white text-sm outline-none focus:ring-0 leading-none placeholder:text-white/20 font-sans"
                      placeholder={dir === 'rtl' ? 'اكتب_الهاشتاغ' : 'type_tag'}
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 font-light pr-1">{dir === 'rtl' ? 'يبدأ بالرمز # تلقائياً. المسافات تتحول تلقائياً إلى شرطة سفلية _' : 'Auto prepended with #. Spaces turn into underscores _'}</p>
                </div>

                <div className="flex justify-end gap-2.5 mt-2 border-t border-white/5 pt-4">
                  <button 
                    onClick={() => {
                      setTagEditModal({ isOpen: false, fontId: null, tagsText: '' });
                      setNewSingleTag('');
                    }} 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button 
                    onClick={handleUpdateTags} 
                    className="px-6 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    {dir === 'rtl' ? 'إضافة الهاشتاغ' : 'Add Tag'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {tagRenameModal.isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 font-sans" dir={dir}>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' })} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative bg-[#0f0f0f]/95 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col gap-5 z-10"
            >
              <div>
                 <h3 className="text-white font-bold text-lg mb-1 font-display">{dir === 'rtl' ? 'تعديل الهاشتاغ العام' : 'Edit Global Tag'}</h3>
                 <p className="text-white/40 text-xs font-light">{dir === 'rtl' ? 'سيتم تعديل هذا الهاشتاغ عند' : 'This will modify the tag for'} <span className="text-cyan-400 font-bold">{dir === 'rtl' ? 'كل الخطوط المرتبطة به' : 'all associated fonts'}</span> {dir === 'rtl' ? 'في قاعدة البيانات' : 'in the database'}</p>
              </div>

              <div className="text-xs text-white/50 bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
                <span>{dir === 'rtl' ? 'الهاشتاغ القديم:' : 'Old Tag:'}</span>
                <span className="text-sm font-bold text-red-400 font-mono">#{tagRenameModal.oldTag}</span>
              </div>

              {/* Rename Tag Input with frozen `#` prefix */}
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-medium">{dir === 'rtl' ? 'الاسم الجديد للهاشتاغ:' : 'New Tag Name:'}</label>
                <div className="relative flex items-center bg-white/[0.03] border border-white/10 focus-within:border-cyan-500/50 rounded-2xl px-4 py-3.5 transition-all duration-300">
                  <span className="text-cyan-400 font-bold select-none text-base mr-1 font-mono">#</span>
                  <input 
                    type="text" 
                    value={tagRenameModal.newTag} 
                    autoFocus
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = val
                        .replace(/\s+/g, '_')
                        .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '');
                      setTagRenameModal(p => ({ ...p, newTag: cleaned }));
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleRenameHashtagGlobally(tagRenameModal.oldTag, tagRenameModal.newTag);
                      }
                    }}
                    className="w-full bg-transparent border-none p-0 text-white text-sm outline-none focus:ring-0 leading-none placeholder:text-white/20 font-sans"
                    placeholder="الاسم_الجديد"
                    dir="ltr"
                  />
                </div>
                <p className="text-[10px] text-white/30 font-light pr-1">{dir === 'rtl' ? 'يقبل فقط الحروف والأرقام والشرطة السفلية _' : 'Only accepts letters, numbers, and underscores _'}</p>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4">
                <button 
                  onClick={() => setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' })} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button 
                  onClick={() => handleRenameHashtagGlobally(tagRenameModal.oldTag, tagRenameModal.newTag)} 
                  className="px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  {dir === 'rtl' ? 'تعديل الاسم' : 'Rename'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Isolated Font View */}
      <AnimatePresence>
        {selectedFontDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[155] ${activeTheme.bg} transition-colors duration-700 flex flex-col font-sans select-none overflow-hidden`}
            dir={dir}
          >
            {/* Background Aesthetic Atmosphere Mesh */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              <div className={`absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full blur-[150px] opacity-[0.06] ${activeTheme.accentGlow} animate-pulse duration-[8s]`} />
              <div className={`absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[180px] opacity-[0.04] ${activeTheme.accentGlow} animate-pulse duration-[12s]`} />
              {/* Thin Blueprint Grid Overlay in Dark Themes */}
              <div className="absolute inset-0 bg-[radial-gradient(#ffffff03_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
            </div>

            {/* Top Navigation & Action Header */}
            <header className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-300 ${isDetailScrolled ? 'border-white/20 bg-[#080808]/80' : 'border-transparent bg-transparent'} relative z-[200] backdrop-blur-md`}>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    navigate(isPublicAllFonts ? '/fonts' : `/my-fonts${id ? `?group=${id}` : ''}`);
                    setSelectedFontDetail(null);
                    setSelectedGlyphZoom(null);
                    setIsDetailScrolled(false);
                  }}
                  className={`flex items-center gap-2 h-11 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/30 text-white/80 hover:text-white transition-all cursor-pointer active:scale-95 font-display`}
                  title={dir === 'rtl' ? 'العودة للخلف' : 'Back'}
                >
                  {dir === 'rtl' ? <ArrowRight className="w-4 h-4 text-white" /> : <ArrowLeft className="w-4 h-4 text-white" />}
                  <span className="text-xs font-bold">{dir === 'rtl' ? 'رجوع' : 'Back'}</span>
                </button>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-2.5">
                {/* Direct Download in Header */}
                {selectedFontDetail.download_url && (
                  <button
                    onClick={() => handleDownload(selectedFontDetail.download_url!, selectedFontDetail.name)}
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer active:scale-95 shadow-md shadow-white/5 focus:outline-none shrink-0 border border-white/10`}
                    title={dir === 'rtl' ? 'تحميل ملف الخط مباشرة' : 'Download font directly'}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                )}

                {/* External Actions Dropdown */}
                <div className="relative external-menu-container">
                  <button
                    onClick={() => setIsExternalMenuOpen(!isExternalMenuOpen)}
                    className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl ${isExternalMenuOpen ? 'bg-white text-black' : 'bg-white hover:bg-gray-200 text-black'} transition-all cursor-pointer active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.15)] focus:outline-none shrink-0`}
                    title={dir === 'rtl' ? 'إجراءات إضافية' : 'More actions'}
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {isExternalMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className={`absolute top-[calc(100%+8px)] ${dir === 'rtl' ? 'left-0' : 'right-0'} w-[200px] bg-[#1a1d24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 p-1.5`}
                      >
                        <button
                          disabled={isTransferring}
                          onClick={() => {
                            setIsExternalMenuOpen(false);
                            handleTransferToLab(selectedFontDetail);
                          }}
                          className={`flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer group disabled:opacity-50`}
                        >
                          {isTransferring ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin shrink-0" />
                          ) : (
                            <Beaker className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 group-hover:text-amber-400 transition-colors" />
                          )}
                          <span className="text-xs font-bold leading-none">{dir === 'rtl' ? 'الفتح بالمختبر' : 'Open in Lab'}</span>
                        </button>
                        
                        <div className="h-[1px] w-full bg-white/5 my-0.5" />

                        <button
                          onClick={() => {
                            setIsExternalMenuOpen(false);
                            handleOpenSaveModal();
                          }}
                          className={`flex items-center gap-3 px-3 py-3 w-full text-left rounded-xl hover:bg-cyan-500/10 hover:text-cyan-400 text-white transition-colors cursor-pointer group`}
                        >
                          <Copy className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100 transition-colors" />
                          <span className="text-xs font-bold leading-none shrink-0">{dir === 'rtl' ? 'الحفظ بمساحتي' : 'Save to Workspace'}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </header>

            {/* Main Content Workspace - Vertical Stack, single-column */}
            <main 
              onScroll={(e) => {
                const target = e.currentTarget;
                setIsDetailScrolled(target.scrollTop > 10);
                
                if (detailLayoutMode === 'glyphs' && target.scrollHeight - target.scrollTop <= target.clientHeight + 800) {
                  setRenderedGlyphCount(prev => prev + 200);
                }
              }}
              className="flex-1 overflow-y-auto w-full max-w-[1240px] mx-auto flex flex-col gap-6 p-4 md:p-6 pb-24 relative z-10 custom-scrollbar"
            >
              
              {/* TOP DASHBOARD CONTROL AREA (Stacked side-by-side on wide screens) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none shrink-0">
                
                {/* 1. LAYOUT COMPASS - CHOOSE MODE */}
                <div className={`${activeTheme.cardBg} rounded-3xl p-5 border ${activeTheme.borderColor} flex flex-col gap-4`}>
                  <div className="flex items-center gap-2 border-b border-white/[0.03] pb-2.5">
                    <Layout className="w-4 h-4 text-white/80" />
                    <span className={`text-[11px] uppercase tracking-wider font-bold ${activeTheme.textSecondary}`}>
                      {dir === 'rtl' ? 'نمط المعاينة البصرية' : 'Preview Layout Mode'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'poem', label: dir === 'rtl' ? 'أبيات الشعر' : 'Classical Poem', icon: BookOpen },
                      { id: 'paragraph', label: dir === 'rtl' ? 'محتوى مقالي' : 'Extended Text', icon: Edit3 },
                      { id: 'glyphs', label: dir === 'rtl' ? 'خريطة المحارف' : 'Glyph Explorer', icon: Sliders },
                      { id: 'poster', label: dir === 'rtl' ? 'عرض إبداعي' : 'Artistic Poster', icon: Sparkles }
                    ].map(mode => {
                      const Icon = mode.icon;
                      const isActive = detailLayoutMode === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => setDetailLayoutMode(mode.id as any)}
                          className={`flex items-center gap-2.5 p-3 rounded-2xl cursor-pointer text-xs select-none text-right transition-all duration-300 border ${
                            isActive 
                              ? 'bg-white/10 border-white/20 text-white font-bold shadow-lg shadow-white/5'
                              : 'bg-white/[0.02] border-white/5 text-white/50 font-normal hover:bg-white/5 hover:text-white/80'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-current'}`} />
                          <span>{mode.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. SPEC SHEET & METADATA info */}
                <div className={`${activeTheme.cardBg} rounded-3xl p-5 border ${activeTheme.borderColor} flex flex-col gap-3.5 relative z-30`}>
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30 pb-1.5 border-b border-white/[0.03] font-display">
                    <span>{dir === 'rtl' ? 'المواصفات الفنية للخط' : 'Technical Font Specifications'}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div className="flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center">
                      <span className={activeTheme.textSecondary}>{dir === 'rtl' ? 'الصيغة' : 'Format'}</span>
                      <span className={`${activeTheme.text} font-bold font-mono mt-1 uppercase`}>
                        {getFontFormat(selectedFontDetail.download_url)}
                      </span>
                    </div>
                    <div className={`flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center relative group/weights weights-menu-container ${isWeightsMenuOpen ? 'z-50' : 'z-10'}`}>
                      <span className={activeTheme.textSecondary}>{dir === 'rtl' ? 'الأوزان' : 'Weights'}</span>
                      
                      {selectedFontWeights.length > 0 ? (
                        <div className="relative mt-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsWeightsMenuOpen(!isWeightsMenuOpen);
                            }}
                            className={`w-full bg-white/[0.05] border border-white/10 ${activeTheme.text} hover:bg-white/10 font-bold text-[10px] rounded px-2 py-1 transition-colors flex items-center justify-between gap-1`}
                          >
                            <span className="flex-1 text-center font-mono">
                              {selectedFontDetail?.id === activeParentFontId 
                                ? (dir === 'rtl' ? 'أساسي' : 'Base')
                                : truncateTwoDots(formatFontName(selectedFontWeights.find(w => w.child_font_id === selectedFontDetail?.id)?.child_font?.name || selectedFontDetail?.name || ''), 10)}
                            </span>
                            <ChevronDown className="w-3 h-3 shrink-0" />
                          </button>
                          
                          <AnimatePresence>
                            {isWeightsMenuOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute top-full left-1/2 -translate-x-1/2 min-w-[140px] md:min-w-[170px] mt-2 bg-[#1a1d24] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[100] max-h-[160px] overflow-y-auto custom-scrollbar font-sans"
                              >
                                <button
                                  onClick={() => {
                                    const parentFont = dbFonts.find(f => f.id === activeParentFontId);
                                    if (parentFont) setSelectedFontDetail(parentFont);
                                    setIsWeightsMenuOpen(false);
                                  }}
                                  className={`w-full text-center px-3 py-2 text-[10px] font-bold transition-colors ${selectedFontDetail?.id === activeParentFontId ? 'bg-cyan-500/20 text-cyan-400 font-mono' : 'text-white/80 hover:bg-white/10 font-mono'}`}
                                >
                                  {dir === 'rtl' ? 'أساسي' : 'Base'}
                                </button>
                                {selectedFontWeights.map(w => (
                                  <button
                                    key={w.child_font_id}
                                    onClick={() => {
                                      if (w.child_font) {
                                        setSelectedFontDetail(w.child_font as Font);
                                      }
                                      setIsWeightsMenuOpen(false);
                                    }}
                                    className={`w-full text-center px-3 py-2 text-[10px] font-bold transition-colors ${selectedFontDetail?.id === w.child_font_id ? 'bg-cyan-500/20 text-cyan-400 font-mono' : 'text-white/80 hover:bg-white/10 font-mono'}`}
                                  >
                                    {truncateTwoDots(formatFontName(w.child_font?.name || ''), 10)}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ) : (
                        <span className={`${activeTheme.text} font-bold mt-1 text-[11px] truncate`}>
                          -
                        </span>
                      )}

                      {isOwner && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeParentFontId) {
                              setUploadingWeightFor(activeParentFontId);
                              weightInputRef.current?.click();
                            }
                          }}
                          className="absolute -bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover/weights:opacity-100 bg-cyan-500/90 text-black text-[9px] font-bold px-2 py-0.5 rounded-full border border-cyan-400 transition-all hover:bg-cyan-400 whitespace-nowrap shadow-[0_0_10px_rgba(34,211,238,0.4)]"
                        >
                          + {dir === 'rtl' ? 'إضافة وزن' : 'Add weight'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col bg-white/[0.01] border border-white/5 p-2 rounded-xl text-center">
                      <span className={activeTheme.textSecondary}>{dir === 'rtl' ? 'اللغات' : 'Languages'}</span>
                      <span className={`${activeTheme.text} font-bold mt-1 truncate`} title={detectedLangs.length > 0 ? detectedLangs.join(', ') : getSupportedLanguages()}>
                        {getSupportedLanguages()}
                      </span>
                    </div>
                  </div>

                  {/* Isolated Tag view within details */}
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-white/[0.03] pt-3">
                    <div className="flex items-center justify-between">
                      <span className={`${activeTheme.textSecondary} text-[11px] font-bold`}>{dir === 'rtl' ? 'الهاشتاغات' : 'Tags'}</span>
                      {isOwner && baseFontForMetadata && (
                        <button 
                          onClick={() => setTagEditModal({ isOpen: true, fontId: baseFontForMetadata.id, tagsText: baseFontForMetadata.tags?.join(', ') || '' })}
                          className="hover:bg-white/10 p-1 rounded transition-colors text-white/50 hover:text-white"
                          title={dir === 'rtl' ? 'تعديل الهاشتاغات' : 'Edit Tags'}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    {(!baseFontForMetadata?.tags || baseFontForMetadata.tags.length === 0) ? (
                      <span className={`font-light ${activeTheme.textSecondary} opacity-40 text-xs`}>{dir === 'rtl' ? 'لا يوجد هاشتاغات' : 'No tags found'}</span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {baseFontForMetadata.tags.map(tag => (
                          <button 
                            key={tag} 
                            onClick={(e) => {
                               e.stopPropagation();
                               navigate(isPublicAllFonts ? '/fonts' : `/my-fonts${id ? `?group=${id}` : ''}`);
                               setSelectedFontDetail(null);
                               setSelectedGlyphZoom(null);
                               setIsDetailScrolled(false);
                               onTagClick?.(tag);
                            }}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border ${activeTheme.accentBg} hover:bg-white/10 transition-colors select-none font-medium cursor-pointer flex items-center gap-1`}
                          >
                            <span className="opacity-50 font-mono text-cyan-400">#</span>
                            <span>{tag}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* PRIMARY INTERACTIVE PREVIEW SANDBOX (THE LONG TEXT SPACE - ثابت عادي بالشاشة) */}
              <div 
                className={`min-h-[420px] flex flex-col rounded-3xl border ${activeTheme.borderColor} ${activeTheme.cardBg} transition-all duration-300 relative overflow-hidden shadow-2xl p-6 md:p-8 shrink-0`}
              >
                {/* Absolute subtle background decorative seal */}
                {backdropChars.map((item, idx) => (
                  <div
                    key={idx}
                    className={item.className}
                    style={{ 
                      fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                      fontSize: item.fontSize || '280px'
                    }}
                  >
                    {item.char}
                  </div>
                ))}

                {/* RENDERING MODE: CLASSICAL POEM (أبيات الشعر) */}
                {detailLayoutMode === 'poem' && (
                  <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">
                    {/* Sub-Selection: Visual Preset Poetry Switcher */}
                    <div className="flex gap-2 pb-2 overflow-x-auto select-none no-scrollbar border-b border-white/[0.03] shrink-0">
                      {POEMS.map((poem, idx) => (
                        <button
                          key={poem.title}
                          onClick={() => setSelectedPoemIndex(idx)}
                          className={`px-4 py-2 rounded-2xl cursor-pointer text-xs font-bold whitespace-nowrap transition-all flex flex-col items-start gap-1 border ${
                            selectedPoemIndex === idx
                              ? 'bg-white/10 border-white/20 text-white font-bold'
                              : 'bg-white/[0.02] border-white/5 text-white/50 hover:bg-white/5'
                          }`}
                        >
                          <span className="leading-none">{poem.title}</span>
                          <span className="text-[9px] opacity-60 font-light font-sans">{poem.author}</span>
                        </button>
                      ))}
                    </div>

                    {/* Main Poem Textarea Wrapper - FIXED size to 15px directly */}
                    <div className="flex-1 overflow-y-auto pr-1 min-h-[250px]">
                      <textarea
                        value={getPoemText(selectedFontDetail.id)}
                        onChange={(e) => handlePoemChange(selectedFontDetail.id, e.target.value)}
                        className={`w-full h-full min-h-[240px] bg-transparent border-none outline-none resize-none leading-loose focus:ring-0 text-center select-text font-serif ${activeTheme.text} transition-all`}
                        style={{
                          fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                          fontSize: '15px',
                          lineHeight: '1.9',
                          fontFeatureSettings: 'normal',
                          fontVariantLigatures: 'normal'
                        }}
                        placeholder={dir === 'rtl' ? 'ضع أبيات قصيدتك وعش سحر الكلمة...' : 'Write your classical poetry lines here...'}
                      />
                    </div>

                    {/* Designer seal watermark */}
                    <div className={`mt-auto pt-2 border-t border-white/[0.02] flex items-center justify-end ${activeTheme.textSecondary} text-[10px]`}>
                      <div className="font-sans text-white/80 font-medium">
                        {POEMS[selectedPoemIndex].author}
                      </div>
                    </div>
                  </div>
                )}

                {/* RENDERING MODE: PARAGRAPH (الكتابة النثرية الحرة) */}
                {detailLayoutMode === 'paragraph' && (
                  <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full">
                    {/* Short helper note */}
                    <div className={`border-b border-white/[0.03] pb-2 text-[10px] uppercase font-bold tracking-widest ${activeTheme.textSecondary} select-none`}>
                      {dir === 'rtl' ? 'معمل النثر الحر (اكتب أوعدّل بحرية)' : 'Prose Creative Sandbox (Fully Editable)'}
                    </div>

                    {/* Main Paragraph Textarea - FIXED size to 15px directly */}
                    <div className="flex-1 overflow-y-auto min-h-[250px]">
                      <textarea
                        value={getPreviewText(selectedFontDetail.id)}
                        onChange={(e) => handlePreviewChange(selectedFontDetail.id, e.target.value)}
                        className={`w-full h-full min-h-[240px] bg-transparent border-none outline-none resize-none px-2 focus:ring-0 ${activeTheme.text} transition-all font-light`}
                        style={{
                          fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                          fontSize: '15px',
                          lineHeight: '1.8'
                        }}
                        placeholder={dir === 'rtl' ? 'ابدأ بصنع عباراتك البديعة هنا...' : 'Type anything dynamically to check the flow...'}
                      />
                    </div>

                    {/* Tiny status metric */}
                    <div className={`mt-auto pt-2 border-t border-white/[0.02] flex justify-end ${activeTheme.textSecondary} text-[9px] font-sans`}>
                      <span>
                        {getPreviewText(selectedFontDetail.id).length} {dir === 'rtl' ? 'حرف' : 'chars'}
                      </span>
                    </div>
                  </div>
                )}

                {/* RENDERING MODE: GLYPHS MAP (خارطة الحروف للجغرافيين) */}
                {detailLayoutMode === 'glyphs' && (
                  <div className="flex-1 flex flex-col gap-5 overflow-hidden h-full">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/[0.03] pb-3 select-none">
                      <div className="flex flex-col font-sans">
                        <span className="text-cyan-400 text-xs font-bold leading-none">
                          {dir === 'rtl' ? 'اضغط على المحرف واستمتع!!' : 'Press on glyph and enjoy!!'}
                        </span>
                      </div>
                      
                      {/* Search input inside glyph map */}
                      <div className="relative w-full md:w-56 shrink-0 font-sans">
                        <input
                          type="text"
                          placeholder={dir === 'rtl' ? 'ابحث عن محرف معين...' : 'Search for glyph...'}
                          value={glyphSearch}
                          onChange={(e) => setGlyphSearch(e.target.value)}
                          className={`w-full bg-white/[0.02] border border-white/5 rounded-xl py-1.5 px-3.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyan-400/30 transition-colors`}
                        />
                      </div>
                    </div>

                    {/* Characters Explorer Grid */}
                    <div 
                      className="flex-1 pr-1 flex flex-col gap-4 select-none min-h-[250px]"
                    >
                      {loadingGlyphs ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-12 gap-3 font-sans">
                          <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-white/40">{dir === 'rtl' ? 'جاري استخراج خارطة المحارف للخط...' : 'Extracting glyphs map...'}</span>
                        </div>
                      ) : filteredGlyphs.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-12 text-xs text-white/30 font-sans">
                          {dir === 'rtl' ? 'لم يتم العثور على محارف تطابق البحث' : 'No matching glyphs found'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(40px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(45px,1fr))] gap-1.5 sm:gap-2 pb-8 p-1">
                          {filteredGlyphs.slice(0, renderedGlyphCount).map((glyph, idx) => (
                            <button
                              key={`${glyph.unicode || idx}-${glyph.index}`}
                              onClick={() => setSelectedGlyphZoom({ char: glyph.char, name: glyph.name, svgPath: glyph.svgPath, svgViewBox: glyph.svgViewBox })}
                              className="h-[40px] md:h-[45px] p-2 rounded-xl bg-white/[0.02] border border-white/5 text-white/90 hover:border-white hover:text-white hover:bg-white/5 hover:scale-[1.12] flex items-center justify-center cursor-pointer transition-all duration-300 active:scale-95 shadow-lg shadow-black/30"
                              style={{
                                gridColumn: `span ${Math.min(glyph.colSpan || 1, 6)}`
                              }}
                              title={(glyph.unicode ? `U+${glyph.unicode}` : '') + (glyph.name ? ` (${glyph.name})` : '')}
                            >
                              {glyph.svgPath ? (
                                <svg viewBox={glyph.svgViewBox} className="w-full h-full fill-current">
                                  <path d={glyph.svgPath} />
                                </svg>
                              ) : (
                                <span className="text-center overflow-visible whitespace-nowrap leading-none" style={{ fontFamily: `"${selectedFontDetail.name}", sans-serif`, fontSize: '18px' }}>
                                  {glyph.char}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Footer characters description */}
                    <div className={`mt-auto pt-2 border-t border-white/[0.02] flex justify-end ${activeTheme.textSecondary} text-[9px] font-sans`}>
                      <span>{selectedFontDetail.name}</span>
                    </div>
                  </div>
                )}

                {/* RENDERING MODE: EDITORIAL POSTER (ملصق احترافي دعائي) */}
                {detailLayoutMode === 'poster' && (
                  <div className="flex-1 flex flex-col justify-between h-full relative p-4 border border-white/5 rounded-3xl overflow-hidden bg-gradient-to-br from-[#101010]/95 via-transparent to-transparent">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 border-r border-t border-white/10 rounded-tr-3xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 border-l border-b border-white/10 rounded-bl-3xl" />
                    
                    <div className="flex flex-col mt-0 relative z-10 text-right">
                      {/* Large Headline Quote */}
                      <div className="flex flex-col gap-4 text-right">
                        <h2 
                          className={`font-extrabold leading-tight tracking-tight ${activeTheme.text}`}
                          style={{
                            fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                            fontSize: '28px'
                          }}
                        >
                          خطوطنا تعبر عن مشاعرنا، وترسم بجمالها لوحة أفكارنا
                        </h2>
                        <p 
                          className={`text-xs ${activeTheme.textSecondary} max-w-lg leading-relaxed mt-1`}
                          style={{
                            fontFamily: `"${selectedFontDetail.name}", sans-serif`,
                            fontSize: '14px'
                          }}
                        >
                          {dir === 'rtl' 
                            ? 'صمم من أجل كتابة عربية فصحى تتمتع بالرقي والأصالة والخطوط المنسابة، هذا الخط هو رفيق مثالي لتجسيد المخطوطات والملصقات البديعة الراقية.'
                            : 'Specially engineered for Arabic typography, highlighting flow, elegance and historic heritage in modern UI compositions.'}
                        </p>
                      </div>
                    </div>

                    {/* Editorial Watermark Footer */}
                    <div className="flex flex-row justify-between items-center mt-auto pt-4 pb-1 border-t border-white/[0.05] bg-black/40 rounded-b-3xl -mx-4 px-4 -mb-4 relative z-10 shrink-0 select-none gap-4">
                      <div className="flex flex-col gap-1 text-right sm:text-left">
                        <span className={`text-[10px] tracking-widest ${activeTheme.textSecondary} uppercase font-mono`}>
                          {formatFontName(selectedFontDetail.name)}
                        </span>
                      </div>
                      <div className="text-right font-display select-none pb-1">
                        <span className="text-sm font-bold tracking-widest text-white leading-none">
                          Fontat
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </main>

            {/* Giant ZOOM LENS Portal overlay for calligraphic glyph zoom */}
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

                    <div className="text-[10px] uppercase font-bold tracking-widest text-[#cbd5e1]/30">
                      {dir === 'rtl' ? 'معاينة هندسية مكبرة' : 'Macro Geometry Preview'}
                    </div>

                    {/* Character Lens display */}
                    <div 
                      className="text-[110px] select-all leading-none py-10 text-white cursor-help select-text font-serif"
                      style={{
                        fontFamily: `"${selectedFontDetail.name}", sans-serif`
                      }}
                      title="اسحب أو انسخ الحرف"
                    >
                      {selectedGlyphZoom?.svgPath ? (
                        <svg viewBox={selectedGlyphZoom.svgViewBox} className="w-[120px] h-[120px] fill-current">
                          <path d={selectedGlyphZoom.svgPath} />
                        </svg>
                      ) : (
                        selectedGlyphZoom?.char
                      )}
                    </div>

                    {/* Metadata detail & Copy Action */}
                    <div className="w-full flex flex-col gap-3 pb-2 mt-4">
                      {selectedGlyphZoom?.name && (
                        <div className="text-white/40 text-xs font-mono">{selectedGlyphZoom.name}</div>
                      )}
                      
                      {selectedGlyphZoom?.char && (
                        <button
                          onClick={() => {
                            if (selectedGlyphZoom?.char) {
                              navigator.clipboard.writeText(selectedGlyphZoom.char);
                              addNotification('success', dir === 'rtl' ? 'تم نسخ المحرف للحافظة!' : 'Copied to clipboard!');
                            }
                          }}
                          className="w-full py-3 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-xs shadow-lg shadow-cyan-400/10"
                        >
                          <Copy className="w-4 h-4" />
                          <span>{dir === 'rtl' ? 'نسخ هذا المحرف كـ نص' : 'Copy Character Text'}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Hyperdrive Digital Portal Portal Animation Overlay */}
            <AnimatePresence>
              {isTransferring && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[120] bg-black flex flex-col items-center justify-center text-center p-6 select-none"
                >
                  <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
                    {/* Ring Animations */}
                    {[1, 2, 3].map(ringIdx => (
                      <motion.div
                        key={ringIdx}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: [0.5, 2.5], opacity: [0, 0.5, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: ringIdx * 0.9, ease: 'easeOut' }}
                        className="absolute inset-0 m-auto w-[250px] h-[250px] border border-cyan-400/20 rounded-full"
                      />
                    ))}
                    {/* Glowing Stars */}
                    <div className="absolute inset-0 bg-[radial-gradient(#22d3ee08_1px,transparent_1px)] [background-size:24px_24px]" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-cyan-400/10 border-2 border-cyan-400/40 border-t-transparent animate-spin flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                      <Dices className="w-8 h-8 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight text-white font-display">
                        {dir === 'rtl' ? 'رقمنة الخط ونقله لمختبر الـ UI...' : 'Digitizing and Transferring to Lab...'}
                      </h2>
                      <p className="text-[#94a3b8] text-sm font-light leading-relaxed max-w-sm mx-auto">
                        {dir === 'rtl' 
                          ? 'يتم أخذ عينة فيزيائية ثنائية وتجهيز كود التحميل الفوري للمحاكاة ثلاثية الأبعاد.' 
                          : 'Preparing vectors and layout coordinates for advanced multi-axis rendering in the Lab.'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Font Modal */}
      <AnimatePresence>
        {isSaveModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans"
            dir={dir}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f1115] border border-white/10 p-6 rounded-3xl w-full max-w-sm shadow-2xl flex flex-col gap-5"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold text-lg">
                  {dir === 'rtl' ? 'حفظ الخط في حسابي' : 'Save to my account'}
                </h3>
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 text-white/60" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-white/60 text-xs font-semibold px-1">
                    {dir === 'rtl' ? 'أين تريد حفظ هذا الخط؟' : 'Where to save this font?'}
                  </label>
                  <select
                    className="w-full bg-[#16191f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/40 appearance-none cursor-pointer"
                    value={saveToGroupId}
                    onChange={(e) => setSaveToGroupId(e.target.value)}
                  >
                    <option value="new" className="bg-[#16191f] font-bold text-cyan-400">
                      {dir === 'rtl' ? ' إنشاء مجموعة جديدة...' : ' Create new group...'}
                    </option>
                    {userGroups.map(g => (
                      <option key={g.id} value={g.id} className="bg-[#16191f]">
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>

                {saveToGroupId === 'new' && (
                  <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="text-white/60 text-xs font-semibold px-1">
                      {dir === 'rtl' ? 'اسم المجموعة الجديدة' : 'New group name'}
                    </label>
                    <input
                      type="text"
                      className="w-full bg-[#16191f] border border-white/5 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400/40"
                      placeholder={dir === 'rtl' ? 'مثال: خطوطي المفضلة' : 'e.g. My Favorites'}
                      value={newSaveGroupName}
                      onChange={(e) => setNewSaveGroupName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') executeFontSave();
                      }}
                      autoFocus
                    />
                  </div>
                )}
                
                {selectedFontWeights.length > 0 && (
                   <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3 text-xs text-cyan-400/80 flex flex-col gap-1">
                     <div className="flex items-center gap-2 font-bold mb-1">
                       <Check className="w-3.5 h-3.5" />
                       {dir === 'rtl' ? 'حفظ الأوزان' : 'Weights Inclusion'}
                     </div>
                     <p>
                        {dir === 'rtl' 
                          ? `هذا الخط يحتوي على ${selectedFontWeights.length} وزن، سيتم حفظها وربطها بالخط الأساسي تلقائياً.` 
                          : `This font has ${selectedFontWeights.length} weights, they will be saved and linked automatically.`}
                     </p>
                   </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsSaveModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all cursor-pointer"
                >
                  {dir === 'rtl' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  onClick={executeFontSave}
                  disabled={isSavingFont}
                  className="px-6 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSavingFont ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : <Copy className="w-4 h-4" />}
                  {dir === 'rtl' ? 'تأكيد الحفظ' : 'Confirm Save'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={tagDeleteGlobalModal.isOpen}
        onClose={() => setTagDeleteGlobalModal({ isOpen: false, tag: '' })}
        onConfirm={() => {
          if (tagDeleteGlobalModal.tag) {
            handleDeleteHashtagGlobally(tagDeleteGlobalModal.tag);
          }
        }}
        title={dir === 'rtl' ? 'حذف الهاشتاغ نهائياً' : 'Delete Globally'}
        message={dir === 'rtl' ? `هل أنت متأكد من رغبتك في حذف الهاشتاغ #${tagDeleteGlobalModal.tag} نهائياً؟ سيتم إزالته من جميع الخطوط كلياً.` : `Are you sure you want to delete #${tagDeleteGlobalModal.tag} globally? This will remove it from all fonts.`}
        confirmText={dir === 'rtl' ? 'حذف الهاشتاغ' : 'Delete Tag'}
        variant="danger"
      />
    </div>
  );
};
