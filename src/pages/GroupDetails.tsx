import { useEffect, useState, useRef, useMemo, useDeferredValue } from 'react';
import { createPortal } from 'react-dom';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Group, FontWeight, Font } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { deleteFontPermanently, getGroupFonts, getFontWeights, getPublicFonts } from '../services/fontService';
import { getGroups } from '../services/groupService';
import { Trash2, Download, X, Layers, Upload, Plus, Check, Dices, Filter, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  publicTagFilter = null,
  onClearTagFilter,
  onTagClick
}: { 
  groupId?: string, 
  groupData?: Group,
  highlightedFont?: { id: string, ts: number },
  isPublicAllFonts?: boolean,
  publicTagFilter?: string | null,
  onClearTagFilter?: () => void,
  onTagClick?: (tag: string) => void
}) => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = groupId || paramId;

  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { addToUploadQueue, uploadQueue, addNotification, removeFromQueueByFontId } = useGlobal();
  
  const [group, setGroup] = useState<Group | null>(groupData || null);

  // Sync with parent updates
  useEffect(() => {
    if (groupData) {
      setGroup(groupData);
    }
  }, [groupData]);

  const isAdmin = user?.user_metadata?.role === 'admin';
  const isOwner = isAdmin || (!isPublicAllFonts && (group?.is_owner === true || group?.user_id === user?.id));
  const [dbFonts, setDbFonts] = useState<Font[]>([]);
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
  
  // Pagination / Infinite scroll state
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    // Reset visible count when switching contexts
    setVisibleCount(20);
  }, [id, isPublicAllFonts, publicTagFilter]);

  useEffect(() => {
    const handleScroll = () => {
      // Increase visibleCount when nearing the bottom of the page
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
        setVisibleCount(prev => prev + 20);
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
  const [expandedFontId, setExpandedFontId] = useState<string | null>(null);
  const [focusedFontId, setFocusedFontId] = useState<string | null>(null);
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.font-card-item')) {
        setFocusedFontId(null);
        setExpandedFontId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

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
  }, [id, user?.id, isPublicAllFonts, publicTagFilter]);

  const fetchData = async () => {
    if (isPublicAllFonts) {
      // Public mode: fetch all public fonts, ignoring group logic
      setGroup(null);
      let fontsData = await getPublicFonts();
      
      setDbFonts(fontsData || []);
      
      if (fontsData && fontsData.length > 0) {
        const allRels: FontWeight[] = [];
        for (const font of fontsData) {
          try {
            const fontRels = await getFontWeights(font.id);
            allRels.push(...fontRels);
          } catch (err) {
            console.error(`Failed to fetch weights for ${font.id}`, err);
          }
        }
        setWeightRelationships(allRels);
      }
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
    
    // Fetch weights relationships per font since getAllWeightsRelationships is deprecated
    if (fontsData && fontsData.length > 0) {
      const allRels: FontWeight[] = [];
      for (const font of fontsData) {
        try {
          const fontRels = await getFontWeights(font.id);
          allRels.push(...fontRels);
        } catch (err) {
          console.error(`Failed to fetch weights for ${font.id}`, err);
        }
      }
      setWeightRelationships(allRels);
    }
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

    if (isPublicAllFonts && publicTagFilter) {
      return allFonts.filter(f => f.tags && f.tags.includes(publicTagFilter));
    }

    return allFonts;
  }, [dbFonts, uploadQueue, id, user, childFontIds, isPublicAllFonts, publicTagFilter]);

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
            setFocusedFontId(targetId);
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
    const loadFonts = async () => {
      const fontsToLoad: Font[] = [];
      displayFonts.forEach(item => {
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
  }, [displayFonts, weightsModal.isOpen, weightsModal.weights, weightsModal.parentFont]);

  useEffect(() => {
    if (toolbarTextareaRef.current) {
      toolbarTextareaRef.current.style.height = 'auto';
      toolbarTextareaRef.current.style.height = `${toolbarTextareaRef.current.scrollHeight}px`;
    }
  }, [globalPreviewText]);

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
        addNotification('error', 'يرجى إدخال هاشتاغ صالح');
        return;
      }

      const existingTags = targetFont.tags || [];
      if (existingTags.includes(cleanNewTag)) {
        addNotification('error', 'هذا الهاشتاغ مضاف بالفعل لهذا الخط');
        return;
      }

      const updatedTags = [...existingTags, cleanNewTag];
      await import('../services/fontService').then(m => m.updateFontTags(tagEditModal.fontId!, updatedTags));
      addNotification('success', 'تم إضافة الهاشتاغ بنجاح!');
      setNewSingleTag('');
      fetchData(); // Automatically reflect the changes
    } catch (e) {
      console.error(e);
      addNotification('error', 'حدث خطأ أثناء إضافة الهاشتاغ');
    }
  };

  const handleRemoveTag = async (fontId: string, tagToRemove: string) => {
    try {
      const targetFont = dbFonts.find(f => f.id === fontId);
      if (!targetFont) return;

      const updatedTags = (targetFont.tags || []).filter(t => t !== tagToRemove);
      await import('../services/fontService').then(m => m.updateFontTags(fontId, updatedTags));
      addNotification('success', 'تم إزالة الهاشتاغ بنجاح!');
      fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', 'حدث خطأ أثناء إزالة الهاشتاغ');
    }
  };

  const handleRenameHashtagGlobally = async (oldTag: string, newTag: string) => {
    const formattedNewTag = newTag
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g, '')
      .trim();

    if (!formattedNewTag) {
      addNotification('error', 'الهاشتاغ الجديد غير صالح');
      return;
    }
    
    try {
      setLoading(true);
      // Find all public fonts that contain this oldTag
      const allFonts = await getPublicFonts();
      const fontsWithOldTag = allFonts.filter(f => f.tags && f.tags.includes(oldTag));
      
      if (fontsWithOldTag.length === 0) {
        addNotification('error', 'لم يتم العثور على خطوط مرتبطة بهذا الهاشتاغ');
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
      addNotification('success', `تم تعديل الهاشتاغ من #${oldTag} إلى #${formattedNewTag} في جميع الخطوط!`);
      
      // Update public filter state in the parent if it matches oldTag
      if (publicTagFilter === oldTag && onTagClick) {
        onTagClick(formattedNewTag);
      }
      
      setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' });
      await fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', 'حدث خطأ أثناء تعديل الهاشتاغ العام');
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
        addNotification('info', `تم إزالة الهاشتاغ #${tagToDelete} بنجاح!`);
        if (onClearTagFilter) onClearTagFilter();
        setLoading(false);
        return;
      }

      const updatePromises = fontsWithTag.map(font => {
        const updatedTags = (font.tags || []).filter(t => t !== tagToDelete);
        return import('../services/fontService').then(m => m.updateFontTags(font.id, updatedTags));
      });

      await Promise.all(updatePromises);
      addNotification('success', `تم حذف الهاشتاغ #${tagToDelete} نهائياً من جميع الخطوط المرتبطة به!`);
      
      if (onClearTagFilter) {
        onClearTagFilter();
      }
      setTagDeleteGlobalModal({ isOpen: false, tag: '' });
      await fetchData();
    } catch (e) {
      console.error(e);
      addNotification('error', 'حدث خطأ أثناء حذف الهاشتاغ عالمياً');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-white opacity-40 animate-pulse">{t('common.loading')}</div>;
  if (!isPublicAllFonts && !group) return <div className="text-center py-20 text-white opacity-40">Group not found</div>;

  return (
    <div className="relative pb-32 max-lg:landscape:pb-16 pt-0" dir={dir}>
      {isPublicAllFonts && publicTagFilter ? (
        /* ======================== DETACHED DEDICATED HASHTAG VIEW ======================== */
        <div className="pb-8 pt-4 px-4 md:px-8 w-full xl:max-w-[1600px] mx-auto font-sans" key="hashtag-isolate">
          <div className="flex flex-col gap-6">
            {/* Top Navigation Row */}
            <div className="flex items-center justify-between">
              <button 
                onClick={onClearTagFilter}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/5 hover:border-white/10 transition-all text-xs font-medium cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>العودة للخطوط العامة</span>
              </button>
              
              <span className="text-[10px] tracking-wider uppercase font-bold text-cyan-400 bg-cyan-400/5 px-2.5 py-1 rounded-md border border-cyan-400/10">
                صفحة التصنيف
              </span>
            </div>

            {/* Huge Beautiful Hashtag Banner with Pencil/Trash Admin controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-[#121212] to-[#0d0d0d] p-7 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden group">
              {/* Dynamic decorative backdrop blur anchor */}
              <div className="absolute right-0 top-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-cyan-500/10 transition-all duration-700" />
              
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.15)] shrink-0">
                  <span className="font-mono text-3xl font-bold leading-none">#</span>
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-none">
                      {publicTagFilter}
                    </h1>
                    
                    {/* Controls placed RIGHT BY the Hashtag as requested */}
                    {isAdmin && (
                      <div className="flex items-center gap-1 shrink-0 select-none">
                        <button
                          onClick={() => setTagRenameModal({ isOpen: true, oldTag: publicTagFilter, newTag: publicTagFilter })}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-cyan-500/10 hover:border-cyan-500/35 text-white/60 hover:text-cyan-400 transition-all cursor-pointer active:scale-90"
                          title="تعديل هذا الهاشتاغ عالمياً"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setTagDeleteGlobalModal({ isOpen: true, tag: publicTagFilter })}
                          className="w-8 h-8 rounded-lg bg-white/5 border border-white/15 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/35 text-white/60 hover:text-red-400 transition-all cursor-pointer active:scale-90"
                          title="حذف هذا الهاشتاغ عالمياً"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-2 font-light">
                    تم العثور على <span className="text-cyan-400 font-bold font-mono">{displayFonts.length}</span> خطوط مرتبطة بهذا التصنيف
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
                <h1 className="text-2xl md:text-3xl font-light text-white tracking-tight leading-tight">
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
                      ${publicTagFilter ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)] scale-105' : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30 hover:text-white'}
                    `}
                    title={publicTagFilter ? `مصنف حسب: #${publicTagFilter}` : 'تصنيف بالهاشتاغات'}
                  >
                    <Filter className="w-4 h-4" />
                    {publicTagFilter && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border border-[#0a0a0a]" />
                    )}
                  </button>
                )}

                {/* Upload Action with direct upload logic */}
                {isOwner && (
                  <div className="flex items-center">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".ttf,.otf,.woff,.woff2" multiple />
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="flex items-center gap-2.5 px-5 h-10 rounded-full bg-cyan-400/10 text-cyan-400 border border-cyan-400/30 hover:bg-cyan-400/20 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.25)] transition-all duration-300 font-bold text-xs tracking-wide group active:scale-95 text-right font-sans focus:outline-none shrink-0 cursor-pointer"
                      title={t('font.upload') || 'رفع خط'}
                    >
                      <Upload className="w-4 h-4 text-cyan-400 shrink-0 group-hover:-translate-y-0.5 group-hover:scale-110 transition-transform duration-300 animate-pulse" />
                      <span>{t('font.upload') || 'رفع خطوط جديدة'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-header descriptions & Tag filters */}
            {((!isPublicAllFonts && group?.description) || (isPublicAllFonts && publicTagFilter)) && (
              <div className="space-y-2 -mt-4">
                {!isPublicAllFonts && group?.description && (
                  <p className="text-sm text-white opacity-50 font-light leading-relaxed max-w-2xl whitespace-pre-wrap">
                    {group.description}
                  </p>
                )}
                {isPublicAllFonts && publicTagFilter && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-xs text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                      <span className="opacity-50 font-mono">#</span>
                      <span className="font-medium">{publicTagFilter}</span>
                      {onClearTagFilter && (
                        <button 
                          onClick={onClearTagFilter}
                          className="ml-1.5 p-0.5 rounded-full hover:bg-cyan-500/25 transition-colors opacity-70 hover:opacity-100 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
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
            {displayFonts.slice(0, visibleCount).map((item, i) => (
            <motion.div
              key={item.metadata?.taskId || item.id}
              id={`font-card-${item.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
              className={`font-card-item bg-[#141414] p-4 rounded-2xl border transition-all duration-700 group flex flex-col gap-3 relative overflow-hidden ${focusedFontId === item.id ? 'border-white/30 shadow-lg' : 'border-white/5 hover:border-white/10'} ${pulseFontId === item.id ? 'ring-1 ring-white/50 shadow-[0_0_20px_rgba(255,255,255,0.15)]' : 'ring-0 ring-transparent shadow-none'}`}
              onClick={() => {
                if (expandedFontId !== item.id) setExpandedFontId(item.id);
                setFocusedFontId(item.id);
              }}
              onTouchStart={() => setFocusedFontId(item.id)}
              onMouseEnter={() => setFocusedFontId(item.id)}
            >
              {(parentFontIds.has(item.id) || isOwner) && !item.metadata?.isUploading && (
                <div className={`absolute bottom-0 ${dir === 'rtl' ? 'left-0 rounded-tr-2xl' : 'right-0 rounded-tl-2xl'} p-2 z-20 transition-all duration-300 bg-[#141414] ${expandedFontId === item.id || focusedFontId === item.id ? 'opacity-100 pointer-events-auto'  : 'opacity-0 pointer-events-none'}`}>
                  <button onClick={(e) => { e.stopPropagation(); openWeightsModal(item); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90 group/weight" title="Weights">
                     <Layers className={`w-3.5 h-3.5 transition-colors ${parentFontIds.has(item.id) ? 'text-white opacity-60 group-hover/weight:text-white' : 'text-white opacity-20 group-hover/weight:text-white opacity-40'}`} />
                  </button>
                </div>
              )}

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

                <div className={`flex items-center shrink-0 transition-all duration-300 ${expandedFontId === item.id || focusedFontId === item.id ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                   {item.download_url && !item.metadata?.isUploading && (
                    <button onClick={(e) => { e.stopPropagation(); if (item.download_url) handleDownload(item.download_url, item.name); }} className="p-3 -mr-1 hover:bg-white/10 rounded-full text-white opacity-40 hover:opacity-100 transition-all active:scale-90 cursor-pointer" title="Download">
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  {isOwner && !item.metadata?.isUploading && (
                    <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteFontModal({ isOpen: true, fontId: item.id }); }} className="p-3 -mr-1 hover:bg-red-500/10 rounded-full text-white opacity-40 hover:opacity-100 transition-all active:scale-90 cursor-pointer" title="Delete">
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
                    if (e.target) {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }
                  }} 
                  onFocus={(e) => {
                    e.stopPropagation();
                    if (expandedFontId !== item.id) setExpandedFontId(item.id);
                    setFocusedFontId(item.id);
                    if (e.target) {
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }
                  }}
                  onClick={(e) => { e.stopPropagation(); if (expandedFontId !== item.id) setExpandedFontId(item.id); setFocusedFontId(item.id); }} 
                  className={`w-full bg-transparent border-none outline-none text-white font-light resize-none transition-all duration-300 focus:bg-white/5 focus:rounded-xl focus:p-3 -ml-3 p-3 overflow-hidden ${expandedFontId === item.id || focusedFontId === item.id ? 'z-10 relative' : ''}`} 
                  style={{ 
                    fontFamily: `"${item.name}", sans-serif`, 
                    fontSize: `${fontSize}px`, 
                    lineHeight: '1.6',
                    height: expandedFontId === item.id || focusedFontId === item.id ? undefined : `calc(${fontSize * 1.6}px + 24px)`,
                    minHeight: `calc(${fontSize * 1.6}px + 24px)`,
                    fontFeatureSettings: 'normal',
                    fontVariantLigatures: 'normal'
                  }} 
                />
              </div>

              {/* Bottom Hashtags Section with modern layered background (Separated & Larger) */}
              {isPublicAllFonts && ((item.tags && item.tags.length > 0) || isAdmin) && (
                <div className="mt-auto pt-2 bg-transparent flex flex-wrap items-center gap-1 relative z-20 border-t border-white/[0.02]" onClick={(e) => e.stopPropagation()}>
                  <div className="w-full bg-black/30 backdrop-blur-md rounded-xl p-1.5 flex flex-wrap items-center gap-1 border border-white/5">
                    {item.tags && item.tags.map(tag => (
                      <button 
                        key={tag} 
                        onClick={(e) => { e.stopPropagation(); onTagClick?.(tag); }}
                        className="text-xs bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 px-2.5 py-1 rounded-lg text-white/60 cursor-pointer transition-all duration-300 flex items-center gap-1 font-sans font-light"
                      >
                        <span className="text-cyan-400 opacity-50 font-mono">#</span>
                        <span>{tag}</span>
                      </button>
                    ))}
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagEditModal({ isOpen: true, fontId: item.id, tagsText: '' });
                        }}
                        className="w-7 h-7 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer shrink-0"
                        title="إضافة هاشتاغ جديد"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
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
                    <h3 className="text-lg font-bold text-white leading-tight">{formatFontName(weightsModal.parentFont?.name || '')}</h3>
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
                    <h3 className="text-md font-bold text-white tracking-tight">تصنيف الخطوط حسب الهاشتاغ</h3>
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
                    <div className="text-sm text-white/40 py-8 text-center font-light">لا توجد هاشتاغات متاحة حالياً للتصنيف</div>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1" dir="rtl">
                      {availableTags.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            onTagClick?.(tag);
                            setIsTagModalOpen(false);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs transition-all duration-300 flex items-center gap-2 border font-light cursor-pointer
                            ${publicTagFilter === tag 
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

                {publicTagFilter && (
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
                   <h3 className="text-white font-bold text-lg mb-1">إدارة هاشتاغات الخط</h3>
                   <p className="text-white/40 text-xs font-light">لخط: <span className="text-cyan-400 font-mono text-xs">{formatFontName(currentFont?.name || '')}</span></p>
                </div>

                {/* Existing Tags Chips list */}
                <div>
                  <h4 className="text-white/60 text-xs font-medium mb-2.5">الهاشتاغات الحالية المضافة:</h4>
                  {(!currentFont?.tags || currentFont.tags.length === 0) ? (
                    <div className="text-white/30 text-xs py-2 font-light">لا توجد هاشتاغات مضافة بعد لهذا الخط</div>
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
                            title="إزالة الهاشتاغ"
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
                  <label className="text-white/60 text-xs font-medium">إضافة هاشتاغ جديد:</label>
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
                      placeholder="اكتب_الهاشتاغ"
                      dir="ltr"
                    />
                  </div>
                  <p className="text-[10px] text-white/30 font-light pr-1">يبدأ بالرمز # تلقائياً. المسافات تتحول تلقائياً إلى شرطة سفلية _</p>
                </div>

                <div className="flex justify-end gap-2.5 mt-2 border-t border-white/5 pt-4">
                  <button 
                    onClick={() => {
                      setTagEditModal({ isOpen: false, fontId: null, tagsText: '' });
                      setNewSingleTag('');
                    }} 
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
                  >
                    إغلاق
                  </button>
                  <button 
                    onClick={handleUpdateTags} 
                    className="px-6 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                  >
                    إضافة الهاشتاغ
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
                 <h3 className="text-white font-bold text-lg mb-1">تعديل الهاشتاغ العام</h3>
                 <p className="text-white/40 text-xs font-light">سيتم تعديل هذا الهاشتاغ عند <span className="text-cyan-400 font-bold">كل الخطوط المرتبطة به</span> في قاعدة البيانات</p>
              </div>

              <div className="text-xs text-white/50 bg-white/[0.02] border border-white/5 p-3 rounded-2xl flex flex-col gap-1">
                <span>الهاشتاغ القديم:</span>
                <span className="text-sm font-bold text-red-400 font-mono">#{tagRenameModal.oldTag}</span>
              </div>

              {/* Rename Tag Input with frozen `#` prefix */}
              <div className="space-y-2">
                <label className="text-white/60 text-xs font-medium">الاسم الجديد للهاشتاغ:</label>
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
                <p className="text-[10px] text-white/30 font-light pr-1">يقبل فقط الحروف والأرقام والشرطة السفلية _</p>
              </div>

              <div className="flex justify-end gap-2.5 border-t border-white/5 pt-4">
                <button 
                  onClick={() => setTagRenameModal({ isOpen: false, oldTag: '', newTag: '' })} 
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-2xl text-white/60 hover:text-white transition-all text-sm font-medium cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => handleRenameHashtagGlobally(tagRenameModal.oldTag, tagRenameModal.newTag)} 
                  className="px-5 py-2 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-black transition-all text-sm font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  تعديل الاسم
                </button>
              </div>
            </motion.div>
          </div>
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
        title="حذف الهاشتاغ نهائياً"
        message={`هل أنت متأكد من رغبتك في حذف الهاشتاغ #${tagDeleteGlobalModal.tag} نهائياً؟ سيتم إزالته من جميع الخطوط كلياً.`}
        confirmText="حذف الهاشتاغ"
        variant="danger"
      />
    </div>
  );
};
