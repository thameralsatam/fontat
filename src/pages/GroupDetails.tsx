import { useEffect, useState, useRef, useMemo, useDeferredValue } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Group, FontWeight, Font } from '../types';

void supabase;
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { deleteFontPermanently, getGroupFonts, getFontWeights, getPublicFonts, getWeightRelationshipsForFonts } from '../services/fontService';
import { getGroups } from '../services/groupService';
import { AnimatePresence, motion } from 'framer-motion';
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
import { GlobalTagSelectionModal } from '../components/font/GlobalTagSelectionModal';
import { formatFontName } from '../utils/text';
import { useFontAnalyzer } from '../components/font/useFontAnalyzer';
import { useFontTagActions } from '../components/font/useFontTagActions';
import { SortOption, sortFonts } from '../utils/sortUtils';

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
  const [selectedFontWeights, setSelectedFontWeights] = useState<any[]>([]);
  const [isDetailScrolled, setIsDetailScrolled] = useState(false);
  const [detailLayoutMode, setDetailLayoutMode] = useState<'poem' | 'paragraph' | 'glyphs' | 'poster'>('poem');
  const [selectedGlyphZoom, setSelectedGlyphZoom] = useState<{char?: string, name?: string, svgPath?: string, svgViewBox?: string} | null>(null);

  const {
    backdropChars,
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
  } = useFontAnalyzer(selectedFontDetail, dir as 'rtl' | 'ltr' | 'auto');
  
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

  const {
    tagEditModal,
    setTagEditModal,
    isTagModalOpen,
    setIsTagModalOpen,
    newSingleTag,
    setNewSingleTag,
    tagRenameModal,
    setTagRenameModal,
    tagDeleteGlobalModal,
    setTagDeleteGlobalModal,
    availableTags,
    handleUpdateTags,
    handleRemoveTag,
    handleRenameHashtagGlobally,
    handleDeleteHashtagGlobally
  } = useFontTagActions({
    dbFonts,
    dir: dir as 'rtl' | 'ltr' | 'auto',
    addNotification,
    fetchData,
    setLoading,
    publicTagFilters,
    onTagClick,
    onClearTagFilter
  });
  
  // Pagination & Sorting State (15 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [isChangingPage, setIsChangingPage] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('oldest_first');

  const handlePageChange = async (newPage: number) => {
    if (isChangingPage) return;
    setIsChangingPage(true);
    
    // 1. Smooth fade out (wait 250ms for opacity to reach 0)
    await new Promise(resolve => setTimeout(resolve, 250));
    
    // 2. Scroll to top (while fonts are completely invisible)
    try {
      document.documentElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Additional instant fallback to ensure it reaches top
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 450);
    
    // 3. Wait for the scroll animation to complete (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));
    
    // 4. Now load and render the new page of fonts
    setCurrentPage(newPage);
    
    // 5. Very short delay to let state update and fonts mount
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // 6. Smooth fade back in
    setIsChangingPage(false);
  };

  const [publicFontsTotal, setPublicFontsTotal] = useState(0);

  useEffect(() => {
    // Reset page of fonts when switching contexts, tags, or sort order
    setCurrentPage(1);
  }, [id, isPublicAllFonts, publicTagFilters.join(','), sortBy]);



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
  const [, setShowFuturisticHint] = useState(() => {
    return !localStorage.getItem('fontinfo_hint_dismissed');
  });
  const toolbarTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fontGridRef = useRef<HTMLDivElement>(null);

  const uploadedSessionFontsRef = useRef<Record<string, { localUrl: string, name: string, taskId: string, completedAt?: number }>>({});

  useEffect(() => {
    uploadQueue.forEach(task => {
      if (task.status === 'success' && task.localUrl) {
        const idKey = task.fontId || task.id;
        if (!uploadedSessionFontsRef.current[idKey]) {
          uploadedSessionFontsRef.current[idKey] = {
            localUrl: task.localUrl,
            name: task.file.name,
            taskId: task.id,
            completedAt: task.completedAt || Date.now()
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
  }, [id, user?.id, isPublicAllFonts, publicTagFilters.join(','), sortBy, currentPage]);

  async function fetchData() {
    if (isPublicAllFonts) {
      // Public mode: fetch page of public fonts based on currentPage (offset calculation)
      setGroup(null);
      setLoading(true);
      try {
        let p_sort = 'newest';
        if (sortBy === 'oldest_first') p_sort = 'oldest';
        else if (sortBy === 'newest_first') p_sort = 'newest';
        else if (sortBy === 'alpha_az') p_sort = 'name_asc';

        // If tag filters are active, fetch a larger pool (300 fonts) so we can filter client-side
        const limit = publicTagFilters.length > 0 ? 300 : 15;
        const offset = publicTagFilters.length > 0 ? 0 : (currentPage - 1) * 15;

        const { fonts, totalCount } = await getPublicFonts(p_sort, limit, offset);
        setDbFonts(fonts || []);
        setPublicFontsTotal(totalCount);
      } catch (err) {
        console.error("Error fetching public fonts:", err);
      } finally {
        setWeightRelationships([]);
        setLoading(false);
      }
      return;
    }

    if (!user) {
      setGroup(null);
      setDbFonts([]);
      setWeightRelationships([]);
      setLoading(false);
      return;
    }

    if (!id) return;

    // Fetch group using our group service which maps the fields correctly
    try {
      if (user) {
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
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
    
    const fontsData = await getGroupFonts(id);
    setDbFonts(fontsData || []);
    
    setWeightRelationships([]);
    setLoading(false);
  };

  const ensureFontCardVisible = (fontId: string) => {
    setTimeout(() => {
      const element = document.getElementById(`font-card-${fontId}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const isFullyVisible = rect.top >= 0 && rect.bottom <= vh;
        if (!isFullyVisible) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setPulseFontId(fontId);
        setTimeout(() => setPulseFontId(null), 3000);
      }
    }, 250);
  };

  const wasUploadingRef = useRef(false);
  useEffect(() => {
    const isUploading = uploadQueue.some(t => (t.groupId === id || (isPublicAllFonts && !t.groupId)) && (t.status === 'pending' || t.status === 'uploading'));
    if (wasUploadingRef.current && !isUploading) {
      const successfulFontIds = uploadQueue
        .filter(t => t.status === 'success' && t.fontId && (t.groupId === id || (isPublicAllFonts && !t.groupId)))
        .map(t => t.fontId!);

      fetchData();
      if (successfulFontIds.length > 0) {
        const lastFontId = successfulFontIds[successfulFontIds.length - 1];
        ensureFontCardVisible(lastFontId);
      }

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
            metadata: { ...dbFont.metadata, taskId: matchedTask.id, status: matchedTask.status, completedAt: matchedTask.completedAt } 
          } as Font & { sessionLocalUrl?: string };
       }

       // Preserve local URL during active session to prevent broken font preview and FOUT
       const sessionFont = uploadedSessionFontsRef.current[dbFont.id];
       if (sessionFont) {
          return {
             ...dbFont,
             sessionLocalUrl: sessionFont.localUrl,
             metadata: { ...dbFont.metadata, taskId: sessionFont.taskId, status: 'success', completedAt: sessionFont.completedAt }
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
        taskId: task.id,
        completedAt: task.completedAt
      }
    }));

    const filteredOptimisticItems = optimisticItems.filter(optItem => {
      if (optItem.metadata?.status !== 'success') return true;
      const realFontId = optItem.id;
      return !mappedDbFonts.some(dbFont => dbFont.id === realFontId);
    });

    const allFonts = [...mappedDbFonts, ...filteredOptimisticItems].filter(f => !childFontIds.has(f.id));

    // Sort fonts according to selected sortBy rule (default: oldest to newest)
    const sortedFonts = sortFonts(allFonts, sortBy);

    if (isPublicAllFonts && publicTagFilters.length > 0) {
      let filtered = sortedFonts.filter(f => {
        const fontTags = f.tags || f.metadata?.tags || [];
        return publicTagFilters.some(tag => fontTags.includes(tag));
      });
      
      // Sort fonts: those missing fewer of the selected tags (i.e. having more matching tags) come first
      filtered.sort((a, b) => {
        const aTags = a.tags || a.metadata?.tags || [];
        const bTags = b.tags || b.metadata?.tags || [];
        const aMatches = aTags.filter((t: string) => publicTagFilters.includes(t)).length;
        const bMatches = bTags.filter((t: string) => publicTagFilters.includes(t)).length;
        
        if (aMatches !== bMatches) {
          return bMatches - aMatches; // Highest matches first
        }
        return 0; // Fallback to current sort order
      });

      return filtered;
    }

    return sortedFonts;
  }, [dbFonts, uploadQueue, id, user, childFontIds, isPublicAllFonts, publicTagFilters.join(','), sortBy]);

  const ITEMS_PER_PAGE = 15;
  const paginatedFonts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return displayFonts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [displayFonts, currentPage]);

  const fontsToRender = useMemo(() => {
    if (isPublicAllFonts) {
      if (publicTagFilters.length > 0) {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return displayFonts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
      }
      return displayFonts; // Already paginated to 15 items server-side
    }
    return paginatedFonts;
  }, [isPublicAllFonts, displayFonts, paginatedFonts, publicTagFilters.length, currentPage]);

  // Dynamic weights loading for active visible/rendered fonts in the current page via secure RPC
  useEffect(() => {
    if (loading) return;
    const visibleFonts = fontsToRender;
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
  }, [fontsToRender, loading]);





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
      fontsToRender.forEach(item => {
        fontsToLoad.push(item);
      });

      if (selectedFontDetail) {
        if (!fontsToLoad.some(f => f.id === selectedFontDetail.id)) {
          fontsToLoad.push(selectedFontDetail);
        }
      }

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
  }, [fontsToRender, weightsModal.isOpen, weightsModal.weights, weightsModal.parentFont, selectedFontDetail]);

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
    return fontPreviews[fontId] !== undefined ? fontPreviews[fontId] : deferredGlobalPreviewText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const allFiles = Array.from(files);
    
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (!user) {
      addNotification('error', t('auth.login_required') || 'يرجى تسجيل الدخول أولاً');
      return;
    }

    if (!id && !isPublicAllFonts) return;

    let targetGroupId = id || null;

    if (allFiles.length > 10) addNotification('error', t('font.max_limit') || 'Max 10');
    const filesToProcess = allFiles.slice(0, 10);
    addToUploadQueue(filesToProcess, targetGroupId);
  };

  const handleWeightUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const allFiles = Array.from(files);

    if (weightInputRef.current) weightInputRef.current.value = '';

    if (!user) {
      addNotification('error', t('auth.login_required') || 'يرجى تسجيل الدخول أولاً');
      return;
    }

    if (!uploadingWeightFor || (!id && !isPublicAllFonts)) return;

    addToUploadQueue(allFiles, id || null, uploadingWeightFor);
    setUploadingWeightFor(null);
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
          sortBy={sortBy}
          setSortBy={setSortBy}
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
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
      )}

      <input type="file" ref={weightInputRef} onChange={handleWeightUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />

      <div ref={fontGridRef} className="w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
        <motion.div
          animate={{ opacity: isChangingPage ? 0 : 1 }}
          transition={{ duration: 0.25, ease: 'easeInOut' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          <AnimatePresence>
            {fontsToRender.map((item, i) => (
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
        </motion.div>

        {/* Unified Modern Glass Pagination UI */}
        <FontsPagination
          currentPage={currentPage}
          setCurrentPage={handlePageChange}
          displayFontsLength={
            isPublicAllFonts
              ? (publicTagFilters.length > 0 ? displayFonts.length : publicFontsTotal)
              : displayFonts.length
          }
          itemsPerPage={ITEMS_PER_PAGE}
          dir={dir as 'ltr' | 'rtl' | 'auto'}
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
    </div>
  );
};