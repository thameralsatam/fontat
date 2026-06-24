import { useEffect, useState, useRef, useMemo, useDeferredValue } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Group, FontWeight, Font } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { deleteFontPermanently, getGroupFonts, getFontWeights, getPublicFonts, getWeightRelationshipsForFonts } from '../services/fontService';
import { getGroups } from '../services/groupService';
import { AnimatePresence } from 'framer-motion';
import { saveFontHistory } from '../lib/db';
// @ts-ignore

import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { FontCard } from '../components/font/FontCard';
import { GroupToolbar } from '../components/font/GroupToolbar';
import { FontWeightsModal } from '../components/font/FontWeightsModal';
import { SaveFontModal } from '../components/font/SaveFontModal';
import { TagsEditModal } from '../components/font/TagsEditModal';
import { TagRenameModal } from '../components/font/TagRenameModal';
import { DetailedFontView } from '../components/font/DetailedFontView';
import { GlobalTagFilterBanner } from '../components/font/GlobalTagFilterBanner';
import { FontsPagination } from '../components/font/FontsPagination';
import { FuturisticHint } from '../components/font/FuturisticHint';
import { GlobalTagSelectionModal } from '../components/font/GlobalTagSelectionModal';
import { formatFontName } from '../utils/text';



import { POEMS } from '../constants/poems';

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
  const [parsedGlyphs, setParsedGlyphs] = useState<{ char: string; index: number; unicode?: string; colSpan?: number; name?: string; svgPath?: string; svgViewBox?: string }[]>([]);
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

  // ✅ FIX: نحدّث الـ ref كل ما يتغير الـ state
  useEffect(() => {
    renderedCountRef.current = renderedCountInPage;
  }, [renderedCountInPage]);



  // Toolbar State
  const [fontSize, setFontSize] = useState(25); // Default size
  const [globalPreviewText, setGlobalPreviewText] = useState(() => {
    if (isPublicAllFonts) {
      return localStorage.getItem('fontinfo_preview_public') || 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)';
    } else if (id) {
      return localStorage.getItem(`fontinfo_preview_group_${id}`) || localStorage.getItem('fontinfo_preview_private') || 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)';
    }
    return 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)';
  });
  const deferredGlobalPreviewText = useDeferredValue(globalPreviewText);

  useEffect(() => {
    if (isPublicAllFonts) {
      localStorage.setItem('fontinfo_preview_public', globalPreviewText);
    } else if (id) {
      localStorage.setItem(`fontinfo_preview_group_${id}`, globalPreviewText);
      localStorage.setItem('fontinfo_preview_private', globalPreviewText);
    }
  }, [globalPreviewText, isPublicAllFonts, id]);

  useEffect(() => {
    const saved = isPublicAllFonts
      ? localStorage.getItem('fontinfo_preview_public')
      : (id ? (localStorage.getItem(`fontinfo_preview_group_${id}`) || localStorage.getItem('fontinfo_preview_private')) : null);
    
    setGlobalPreviewText(saved || 'اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)');
    setFontPreviews({});
  }, [id, isPublicAllFonts]);
  const [fontPreviews, setFontPreviews] = useState<Record<string, string>>({});
  const [pulseFontId, setPulseFontId] = useState<string | null>(null);
  const [modalPulseFontId, setModalPulseFontId] = useState<string | null>(null);
  const [processedHighlightedId, setProcessedHighlightedId] = useState<number | null>(null);
  const [showFuturisticHint, setShowFuturisticHint] = useState(() => {
    return !localStorage.getItem('fontinfo_hint_dismissed');
  });
  const toolbarTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fontGridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const uploadedSessionFontsRef = useRef<Record<string, { localUrl: string, name: string, taskId: string }>>({});
  // ✅ FIX: ref لـ renderedCountInPage — يمنع API call عند كل scroll
  const renderedCountRef = useRef(7);

  useEffect(() => {
    uploadQueue.forEach(task => {
      if (task.status === 'success' && task.localUrl) {
        const idKey = task.fontId || task.id;
        if (!uploadedSessionFontsRef.current[idKey]) {
          uploadedSessionFontsRef.current[idKey] = {
            localUrl: task.localUrl,
            name: task.file.name,
            taskId: task.id
          };
        }
      }
    });
  }, [uploadQueue]);



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
          // Retain localUrl in sessionLocalUrl to prevent Flash Of Unstyled Text (FOUT) when DB refreshes
          return { 
            ...dbFont, 
            download_url: dbFont.download_url || matchedTask.downloadUrl || '',
            sessionLocalUrl: matchedTask.localUrl,
            created_at: matchedTask.timestamp ? new Date(matchedTask.timestamp).toISOString() : dbFont.created_at,
            metadata: { ...dbFont.metadata, taskId: matchedTask.id, status: matchedTask.status } 
          } as Font & { sessionLocalUrl?: string };
       }

       // Preserve local URL during active session to prevent broken font preview and FOUT
       const sessionFont = uploadedSessionFontsRef.current[dbFont.id];
       if (sessionFont) {
          return {
             ...dbFont,
             sessionLocalUrl: sessionFont.localUrl,
             metadata: { ...dbFont.metadata, taskId: sessionFont.taskId, status: 'success' }
          } as Font & { sessionLocalUrl?: string };
       }

       return dbFont as Font & { sessionLocalUrl?: string };
    });

    const optimisticItems: (Font & { sessionLocalUrl?: string })[] = relevantQueueItems.map(task => ({
      id: task.fontId || task.id,
      group_id: id!,
      asset_id: '', 
      name: task.file.name,
      size: task.file.size,
      download_url: task.downloadUrl || '',
      sessionLocalUrl: task.localUrl,
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

  const ITEMS_PER_PAGE = 15;
  const paginatedFonts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayFonts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayFonts, currentPage]);

  // Continuous progressive font rendering using a single high-performance sentinel observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setRenderedCountInPage((prev) => Math.min(prev + 6, paginatedFonts.length));
        }
      },
      {
        root: null,
        rootMargin: '100px 0px 400px 0px', // Pre-trigger loading of next fonts before they enter the screen
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [paginatedFonts.length, renderedCountInPage]);

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
        const fetchIds = fontsToFetch.map(f => f.id).filter(id => id && id.length === 36 && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
        if (fetchIds.length === 0) return;
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
        const anyFont = font as any;
        const fontUrl = anyFont.sessionLocalUrl || font.download_url;
        if (fontUrl && font.id) {
          const styleId = `style-${font.metadata?.taskId || font.id}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            
            // Determine format
            let format = "format('truetype')";
            const lowerName = (font.name || '').toLowerCase();
            if (lowerName.endsWith('.woff2') || fontUrl.includes('.woff2')) format = "format('woff2')";
            else if (lowerName.endsWith('.woff') || fontUrl.includes('.woff')) format = "format('woff')";
            else if (lowerName.endsWith('.otf') || fontUrl.includes('.otf')) format = "format('opentype')";

            style.textContent = `
              @font-face {
                font-family: "${font.name}";
                src: url("${fontUrl}") ${format};
                font-display: swap;
              }
            `;
            document.head.appendChild(style);

            // Preload link to handle CORS explicitly as requested
            if (fontUrl.startsWith('http')) {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'font';
              link.href = fontUrl;
              link.crossOrigin = 'anonymous';
              document.head.appendChild(link);
            }
          }
        }
      }
    };
    loadFonts();
  }, [paginatedFonts, renderedCountInPage, weightsModal.isOpen, weightsModal.weights, weightsModal.parentFont]);

  useEffect(() => {
    // Cleanup DOM style nodes and preloads when context, tag filter, or mode changes
    return () => {
      const dynamicStyles = document.querySelectorAll('style[id^="style-"]');
      dynamicStyles.forEach(el => el.remove());
      
      const dynamicLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
      dynamicLinks.forEach(el => el.remove());
    };
  }, [id, publicTagFilters.join(','), isPublicAllFonts]);

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
        <GlobalTagFilterBanner
          publicTagFilters={publicTagFilters}
          displayFontsLength={displayFonts.length}
          isAdmin={isAdmin}
          onClearTagFilter={() => onClearTagFilter?.()}
          setTagRenameModal={setTagRenameModal as any}
          setTagDeleteGlobalModal={setTagDeleteGlobalModal as any}
          globalPreviewText={globalPreviewText}
          setGlobalPreviewText={setGlobalPreviewText}
          setFontPreviews={setFontPreviews}
          fontSize={fontSize}
          setFontSize={setFontSize}
          toolbarTextareaRef={toolbarTextareaRef as any}
          dir={dir as 'ltr' | 'rtl' | 'auto'}
          t={t}
        />
      ) : (
        <GroupToolbar
          isPublicAllFonts={isPublicAllFonts}
          group={group}
          publicTagFilters={publicTagFilters}
          setIsTagModalOpen={setIsTagModalOpen}
          dir={dir as "rtl" | "ltr" | "auto"}
          isOwner={isOwner}
          fileInputRef={fileInputRef}
          handleFileUpload={handleFileUpload}
          onTagClick={onTagClick}
          onClearTagFilter={onClearTagFilter}
          toolbarTextareaRef={toolbarTextareaRef}
          globalPreviewText={globalPreviewText}
          setGlobalPreviewText={setGlobalPreviewText}
          setFontPreviews={setFontPreviews}
          fontSize={fontSize}
          setFontSize={setFontSize}
          t={t}
        />
      )}

      <input type="file" ref={weightInputRef} onChange={handleWeightUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />

      <div ref={fontGridRef} className="w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence>
            {paginatedFonts.slice(0, renderedCountInPage).map((item, i) => (
            <FontCard
              key={item.metadata?.taskId || item.id}
              item={item}
              index={i}
              pulseFontId={pulseFontId}
              setShowFuturisticHint={setShowFuturisticHint}
              navigate={navigate}
              isPublicAllFonts={isPublicAllFonts}
              groupId={id}
              setSelectedFontDetail={setSelectedFontDetail}
              setActiveParentFontId={setActiveParentFontId}
              dir={dir}
              handleDownload={handleDownload}
              isOwner={isOwner}
              setDeleteFontModal={setDeleteFontModal}
              getPreviewText={getPreviewText}
              handlePreviewChange={handlePreviewChange}
              fontSize={fontSize}
              parentFontIds={parentFontIds}
              isAdmin={isAdmin}
              onTagClick={onTagClick}
              setTagEditModal={setTagEditModal as any}
              openWeightsModal={openWeightsModal}
            />
          ))}
          </AnimatePresence>
        
          {displayFonts.length === 0 && (
            <div className="col-span-full text-center py-20 text-white opacity-30 bg-[#141414] rounded-[2rem] border border-white/5 border-dashed">
              {t('font.no_fonts')} {isOwner && t('font.start_upload')}
            </div>
          )}
        </div>

        {/* Single sentinel for high-performance lazy scroll loading */}
        {paginatedFonts.length > renderedCountInPage && (
          <div ref={sentinelRef} className="h-4 w-full bg-transparent" />
        )}

        {/* Modern Glass Pagination UI */}
        <FontsPagination
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          displayFontsLength={displayFonts.length}
          itemsPerPage={ITEMS_PER_PAGE}
          dir={dir as 'ltr' | 'rtl' | 'auto'}
          t={t}
        />
      </div>

      {/* Weights Modal */}
      <FontWeightsModal
        weightsModal={weightsModal}
        setWeightsModal={setWeightsModal}
        modalPulseFontId={modalPulseFontId}
        dir={dir as "rtl" | "ltr" | "auto"}
        t={t}
        handleDownload={handleDownload}
        getPreviewText={getPreviewText}
        handlePreviewChange={handlePreviewChange}
        uploadQueue={uploadQueue}
        uploadedSessionFontsRef={uploadedSessionFontsRef}
        isOwner={isOwner}
        setDeleteWeightModal={setDeleteWeightModal}
        setUploadingWeightFor={setUploadingWeightFor}
        weightInputRef={weightInputRef}
      />

      {/* Tags Selection Modal */}
      <GlobalTagSelectionModal
        isTagModalOpen={isTagModalOpen}
        setIsTagModalOpen={setIsTagModalOpen}
        dir={dir as 'ltr' | 'rtl' | 'auto'}
        availableTags={availableTags}
        publicTagFilters={publicTagFilters}
        onTagClick={onTagClick}
        onClearTagFilter={() => onClearTagFilter?.()}
      />

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

      <TagsEditModal
        tagEditModal={tagEditModal}
        setTagEditModal={setTagEditModal as any}
        dbFonts={dbFonts}
        dir={dir as "rtl" | "ltr" | "auto"}
        t={t}
        newSingleTag={newSingleTag}
        setNewSingleTag={setNewSingleTag}
        handleRemoveTag={handleRemoveTag}
        handleUpdateTags={handleUpdateTags}
      />

      <TagRenameModal
        tagRenameModal={tagRenameModal}
        setTagRenameModal={setTagRenameModal}
        dir={dir as "rtl" | "ltr" | "auto"}
        t={t}
        handleRenameHashtagGlobally={handleRenameHashtagGlobally}
      />

      <DetailedFontView
        selectedFontDetail={selectedFontDetail}
        setSelectedFontDetail={setSelectedFontDetail}
        activeTheme={activeTheme}
        dir={dir as "rtl" | "ltr" | "auto"}
        navigate={navigate}
        isPublicAllFonts={isPublicAllFonts}
        id={id}
        setSelectedGlyphZoom={setSelectedGlyphZoom}
        isDetailScrolled={isDetailScrolled}
        setIsDetailScrolled={setIsDetailScrolled}
        handleDownload={handleDownload}
        isExternalMenuOpen={isExternalMenuOpen}
        setIsExternalMenuOpen={setIsExternalMenuOpen}
        isTransferring={isTransferring}
        handleTransferToLab={handleTransferToLab}
        handleOpenSaveModal={handleOpenSaveModal}
        detailLayoutMode={detailLayoutMode}
        setDetailLayoutMode={setDetailLayoutMode as any}
        setRenderedGlyphCount={setRenderedGlyphCount}
        getFontFormat={getFontFormat}
        selectedFontWeights={selectedFontWeights}
        isWeightsMenuOpen={isWeightsMenuOpen}
        setIsWeightsMenuOpen={setIsWeightsMenuOpen}
        activeParentFontId={activeParentFontId}
        dbFonts={dbFonts}
        isOwner={isOwner}
        setUploadingWeightFor={setUploadingWeightFor}
        weightInputRef={weightInputRef}
        detectedLangs={detectedLangs}
        getSupportedLanguages={getSupportedLanguages}
        baseFontForMetadata={baseFontForMetadata}
        setTagEditModal={setTagEditModal as any}
        backdropChars={backdropChars}
        selectedPoemIndex={selectedPoemIndex}
        setSelectedPoemIndex={setSelectedPoemIndex}
        getPoemText={getPoemText}
        handlePoemChange={handlePoemChange}
        getPreviewText={getPreviewText}
        handlePreviewChange={handlePreviewChange}
        glyphSearch={glyphSearch}
        setGlyphSearch={setGlyphSearch}
        loadingGlyphs={loadingGlyphs}
        filteredGlyphs={filteredGlyphs}
        renderedGlyphCount={renderedGlyphCount}
        selectedGlyphZoom={selectedGlyphZoom}
        addNotification={addNotification}
        truncateTwoDots={truncateTwoDots}
        formatFontName={formatFontName}
      />

      {/* Save Font Modal */}
      <SaveFontModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        dir={dir as "rtl" | "ltr" | "auto"}
        saveToGroupId={saveToGroupId}
        setSaveToGroupId={setSaveToGroupId}
        userGroups={userGroups}
        newSaveGroupName={newSaveGroupName}
        setNewSaveGroupName={setNewSaveGroupName}
        executeFontSave={executeFontSave}
        isSavingFont={isSavingFont}
        selectedFontWeightsCount={selectedFontWeights.length}
      />

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

      <FuturisticHint
        showFuturisticHint={showFuturisticHint}
        setShowFuturisticHint={setShowFuturisticHint}
        dir={dir as 'ltr' | 'rtl' | 'auto'}
      />
    </div>
  );
};