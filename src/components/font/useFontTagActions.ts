import { useState, useMemo } from 'react';
import { Font } from '../../types';
import { getPublicFonts } from '../../services/fontService';

export function useFontTagActions({
  dbFonts,
  dir,
  addNotification,
  fetchData,
  setLoading,
  publicTagFilters,
  onTagClick,
  onClearTagFilter
}: {
  dbFonts: Font[];
  dir: 'rtl' | 'ltr' | 'auto';
  addNotification: (type: 'success' | 'error' | 'info', msg: string) => void;
  fetchData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  publicTagFilters: string[];
  onTagClick?: (tag: string) => void;
  onClearTagFilter?: () => void;
}) {
  const [tagEditModal, setTagEditModal] = useState<{ isOpen: boolean, fontId: string | null, tagsText: string }>({ isOpen: false, fontId: null, tagsText: '' });
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newSingleTag, setNewSingleTag] = useState('');
  const [tagRenameModal, setTagRenameModal] = useState<{ isOpen: boolean, oldTag: string, newTag: string }>({ isOpen: false, oldTag: '', newTag: '' });
  const [tagDeleteGlobalModal, setTagDeleteGlobalModal] = useState<{ isOpen: boolean, tag: string }>({ isOpen: false, tag: '' });

  // Extract all unique tags
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>();
    dbFonts.forEach(f => {
      const fontTags = f.tags || f.metadata?.tags || [];
      if (Array.isArray(fontTags)) {
        fontTags.forEach(t => {
          if (t && typeof t === 'string' && t.trim()) {
            tagsSet.add(t.trim());
          }
        });
      }
    });
    return Array.from(tagsSet).sort();
  }, [dbFonts]);

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

      const existingTags = targetFont.tags || targetFont.metadata?.tags || [];
      if (existingTags.includes(cleanNewTag)) {
        addNotification('error', dir === 'rtl' ? 'هذا الهاشتاغ مضاف بالفعل لهذا الخط' : 'Tag already exists for this font');
        return;
      }

      const updatedTags = [...existingTags, cleanNewTag];
      await import('../../services/fontService').then(m => m.updateFontTags(tagEditModal.fontId!, updatedTags));
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

      const existingTags = targetFont.tags || targetFont.metadata?.tags || [];
      const updatedTags = existingTags.filter(t => t !== tagToRemove);
      await import('../../services/fontService').then(m => m.updateFontTags(fontId, updatedTags));
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
        return import('../../services/fontService').then(m => m.updateFontTags(font.id, updatedTags));
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
        return import('../../services/fontService').then(m => m.updateFontTags(font.id, updatedTags));
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

  return {
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
  };
}
