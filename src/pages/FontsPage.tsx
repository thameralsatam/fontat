import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { Group, Font } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { Folder, Plus, Search, X, Download } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import { GroupDetails } from './GroupDetails';
import { SmartSearch } from '../components/SmartSearch';

import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { updateGroup, deleteGroupSmart, createGroupSmart, getGroups, getPublicGroups } from '../services/groupService';
import { getGroupFonts, getPublicFonts } from '../services/fontService';
import { FadeSection } from '../components/FadeSection';

export const FontsPage = ({ mode = 'private' }: { mode?: 'public' | 'private' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [fontResults, setFontResults] = useState<Font[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);
  const [highlightedFont, setHighlightedFont] = useState<{id: string, ts: number} | undefined>();
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [fontPreviews, setFontPreviews] = useState<Record<string, string>>({});
  const [globalPreviewText] = useState('اللهـم صـلِّ وسـلم عـلى نبينـا محـمد (2026 - ١٤٤٧)');
  const [loadedFontDetails, setLoadedFontDetails] = useState<Record<string, Font>>({});
  const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

  const handlePreviewChange = (fontId: string, text: string) => {
    setFontPreviews(prev => ({
      ...prev,
      [fontId]: text
    }));
  };

  const getPreviewText = (fontId: string) => {
    return fontPreviews[fontId] || globalPreviewText;
  };
  
  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; groupId: string | null }>({
    isOpen: false,
    groupId: null
  });
  
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { addNotification } = useGlobal();
  const isAdmin = user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  // Initialize from URL
  useEffect(() => {
    const groupId = searchParams.get('group');
    if (groupId) {
      setViewingGroupId(groupId);
    }
  }, []);

  // Update URL when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (viewingGroupId) {
      params.set('group', viewingGroupId);
    }
    setSearchParams(params, { replace: true });
  }, [viewingGroupId, setSearchParams]);

  // Clear viewing group when mode changes
  useEffect(() => {
    setViewingGroupId(null);
  }, [mode]);

  useEffect(() => {
    fetchGroups();
  }, [user, mode]);

  // Realtime synchronization
  useEffect(() => {
    // Only set up realtime if we are on the public mode (or always, to get immediate updates)
    // Actually, listening to all group changes ensures the UI stays perfectly synced across multiple tabs.
    const channel = supabase
      .channel('groups_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, (payload) => {
         // Silently fetch groups to keep UI in sync without user interruption
         fetchGroups(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode]);

  const loadFontDetails = async (fontIds: string[]) => {
    const idsToLoad = fontIds.filter(id => !loadedFontDetails[id] && !loadingDetails[id]);
    if (idsToLoad.length === 0) return;

    setLoadingDetails(prev => ({ ...prev, ...Object.fromEntries(idsToLoad.map(id => [id, true])) }));

    try {
      // Need to fetch details. We can use getGroupFonts(null) and find what we need since we can't query private table.
      // But if we already have it in search, it's fine.
      const fonts = await getGroupFonts(''); // we pass empty string or handled by service
      const matchedFonts = fonts.filter(f => idsToLoad.includes(f.id));
      
      setLoadedFontDetails(prev => ({ ...prev, ...Object.fromEntries(matchedFonts.map(f => [f.id, f])) }));
    } catch (e) {
      console.error(e);
    }
    
    setLoadingDetails(prev => ({ ...prev, ...Object.fromEntries(idsToLoad.map(id => [id, false])) }));
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename.endsWith('.ttf') || filename.endsWith('.otf') || filename.endsWith('.woff') || filename.endsWith('.woff2') 
        ? filename 
        : `${filename}.ttf`; // Fallback extension if missing
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      window.open(url, '_blank');
    }
  };

  // Load fonts for preview using FontFace API
  useEffect(() => {
    const loadFonts = async () => {
      // Collect all fonts that need loading
      const fontsToLoad: Font[] = Object.values(loadedFontDetails);

      for (const font of fontsToLoad) {
        if (font.download_url && font.id) {
          const styleId = `style-${font.id}`;
          if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;

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
  }, [loadedFontDetails]);

  // Search implementation removed because we now use the SmartSearch component directly.
  
  const fetchGroups = async (hideLoader = false) => {
    if (!hideLoader) setLoading(true);
    try {
      const data = mode === 'public' ? await getPublicGroups() : await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      if (!hideLoader) setLoading(false);
    }
  };

  const [optionsOpenGroupId, setOptionsOpenGroupId] = useState<string | null>(null);
  const optionsRef = useRef<HTMLDivElement>(null);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setOptionsOpenGroupId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const handleGroupClick = (e: React.MouseEvent<HTMLElement>, groupId: string) => {
    e.stopPropagation(); // Prevent bubbling
    
    if (viewingGroupId === groupId) {
      // Toggle options if already viewing
      if (mode === 'private' || isAdmin) {
        if (optionsOpenGroupId === groupId) {
          setOptionsOpenGroupId(null);
          setMenuPosition(null);
        } else {
          const rect = e.currentTarget.getBoundingClientRect();
          const menuWidth = Math.max(160, rect.width);
          const screenWidth = window.innerWidth;
          
          let left = rect.left;
          
          // Ensure menu stays within screen bounds with some padding
          if (left + menuWidth > screenWidth - 16) {
            left = screenWidth - menuWidth - 16;
          }
          
          if (left < 16) {
            left = 16;
          }

          setMenuPosition({ top: rect.bottom + 6, left, width: rect.width });
          setOptionsOpenGroupId(groupId);
        }
      }
    } else {
      // Switch group and close options
      setViewingGroupId(groupId);
      setOptionsOpenGroupId(null);
      setMenuPosition(null);
    }
  };

  const handleEditGroup = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    setSelectedGroup(group);
    setGroupName(group.name);
    setGroupDesc(group.description || '');
    setIsPublic(group.is_public);
    setIsEditMode(true);
    setIsModalOpen(true);
    setOptionsOpenGroupId(null);
  };

  const handleDeleteClick = (e: React.MouseEvent, groupId: string) => {
    e.stopPropagation();
    setDeleteModal({ isOpen: true, groupId });
    setOptionsOpenGroupId(null);
  };

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setGroupName('');
    setGroupDesc('');
    setIsPublic(mode === 'public');
    setIsModalOpen(true);
    setOptionsOpenGroupId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !user) return;
    
    if (isEditMode && selectedGroup) {
      // Edit
      try {
        const data = await updateGroup(selectedGroup.id, {
          name: groupName,
          description: groupDesc,
          is_public: isPublic
        });

        if (data) {
          fetchGroups(true);
          setGroups(prev => prev.map(g => g.id === data.id ? data : g));
          if ((mode === 'public' && !data.is_public) || (mode === 'private' && data.is_public)) {
            setViewingGroupId(null);
          }
        }
      } catch (error: any) {
        console.error('Error updating group:', error);
        addNotification('error', error.message || t('group.update_error'));
      }
    } else {
      // Create
      try {
        const data = await createGroupSmart(groupName, groupDesc, isPublic);

        if (data) {
          fetchGroups(true);
          if ((mode === 'public' && data.is_public) || (mode === 'private' && !data.is_public)) {
            setGroups(prev => {
              const cleaned = prev.filter(g => g.id !== data.id);
              return [data, ...cleaned];
            });
            setViewingGroupId(data.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          addNotification('success', t('group.create_success'));
        }
        
        setIsModalOpen(false);
        setGroupName('');
        setGroupDesc('');
        setSelectedGroup(null);
      } catch (error: any) {
        console.error('Error creating group:', error);
        addNotification('error', error.message || t('group.create_error'));
      }
    }
  };

  const deleteGroup = async (id: string) => {
    try {
      await deleteGroupSmart(id);
      setGroups(prev => prev.filter(g => g.id !== id));
      if (viewingGroupId === id) setViewingGroupId(null);
      addNotification('success', t('group.delete_success'));
    } catch (error: any) {
      console.error('Error deleting group:', error);
      addNotification('error', error.message || t('group.delete_error'));
    }
  };

  // Filter groups for Chips
  const displayedGroups = groups.filter(g => {
    if (mode === 'public') return g.is_public;
    if (mode === 'private') return true;
    return false;
  });

  return (
    <FadeSection className="pb-32 max-lg:landscape:pb-16 pt-0">
      {/* Search Bar */}
      <div className="mb-6 w-full max-w-2xl lg:max-w-4xl mx-auto -mt-6 px-4">
        <SmartSearch 
          mode={mode} 
          onSelect={async (res) => {
            let meta = res.metadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch(e) {}
            }
            let groupId = meta?.group_id;
            
            if (!groupId && res.id) {
              const { data, error } = await supabase.from('fonts').select('group_id').eq('id', res.id).single();
              if (data) groupId = data.group_id;
            }

            // Fallback: finding group by group_name
            if (!groupId && res.group_name) {
               const allMyGroups = await getGroups();
               let found = allMyGroups.find(g => g.name === res.group_name);
               if (!found) {
                  const allPublic = await getPublicGroups();
                  found = allPublic.find(g => g.name === res.group_name);
               }
               if (found) groupId = found.id;
            }
            
            if (groupId) {
              setViewingGroupId(groupId);
              setHighlightedFont({ id: res.id, ts: Date.now() });
            } else {
              addNotification('error', `عذراً، لم نتمكن من الوصول للمجموعة الخاصة بهذا الخط. قد يكون السبب تحديث قاعدة البيانات الأخير حيث كانت الدالة smart_search تعيد سابقاً group_id ضمن النتائج، لكنها الآن لا تعيده ولم نتمكن من استخراجه من id الخط أو اسمه. يرجى إضافة group_id لمخرجات دالة smart_search أو السماح للقراءة من جدول الخطوط.`);
            }
          }} 
        />
      </div>

      {/* Slim Chips Bar */}
      <div className="bg-[#080808] py-2 overflow-x-auto scrollbar-hide w-full touch-pan-x max-w-3xl lg:max-w-5xl xl:max-w-7xl mx-auto px-4 md:px-8">
        {/* Dynamic Groups Chips */}
        <div className="flex items-center gap-2 px-4 w-max">
          <AnimatePresence mode='popLayout'>
            {displayedGroups.map(group => (
              <motion.div
                key={group.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={(e) => handleGroupClick(e, group.id)}
                  className={`h-[25px] px-3 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap flex items-center justify-center ${
                    viewingGroupId === group.id
                      ? 'bg-white/20 text-white border-white/20'
                      : 'bg-transparent text-white/70 border-white/10 hover:text-white hover:border-white/30'
                  }`}
                >
                  {group.name}
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {/* Create Button (at the end) - Only for Private or Admin */}
          {(mode === 'private' || isAdmin) && user && (
            <motion.div layout transition={{ duration: 0.2 }}>
              <button
                onClick={handleOpenCreate}
                className="h-[25px] w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
                title={t('groups.create')}
              >
                <Plus className="w-3 h-3" />
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* Context Menu Overlay */}
      {createPortal(
        <AnimatePresence>
          {optionsOpenGroupId && menuPosition && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ type: "spring", duration: 0.2, bounce: 0 }}
              style={{
                position: 'fixed',
                top: menuPosition.top,
                left: menuPosition.left,
                zIndex: 9999,
                minWidth: Math.max(160, menuPosition.width),
                maxWidth: '90vw',
                transformOrigin: 'top center'
              }}
              ref={optionsRef}
              className="flex flex-col bg-[#1C1C1E]/80 border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {/* Options */}
              <div className="flex flex-col p-1">
                <button
                  onClick={(e) => {
                    const group = groups.find(g => g.id === optionsOpenGroupId);
                    if (group) handleEditGroup(e, group);
                  }}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left active:bg-white/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                  </svg>
                  <span>{t('common.edit')}</span>
                </button>
                
                <button
                  onClick={(e) => handleDeleteClick(e, optionsOpenGroupId)}
                  className="flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left active:bg-red-500/20"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                  <span>{t('common.delete')}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Main Content Area */}
      <div className="space-y-8 mt-4 w-full">
        {/* Group Fonts View */}
        {viewingGroupId ? (
          <GroupDetails 
            groupId={viewingGroupId}
            groupData={groups.find(g => g.id === viewingGroupId)}
            highlightedFont={highlightedFont}
          />
        ) : (
          /* Default View (No group selected) */
           <div className="text-center py-20 max-lg:landscape:py-8 text-white/20 w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
             <p>{t('groups.select_to_view')}</p>
           </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? t('common.edit') : t('groups.create')}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-300">{t('group.name_placeholder')}</label>
              <span className={`text-xs ${groupName.length > 25 ? 'text-red-500' : 'text-white/30'}`}>
                {groupName.length}/25
              </span>
            </div>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              maxLength={25}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-[#141414] text-white focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all"
              placeholder={t('group.name_placeholder')}
              required
              autoFocus
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-gray-300">{t('group.desc_placeholder')}</label>
              <span className={`text-xs ${groupDesc.length > 100 ? 'text-red-500' : 'text-white/30'}`}>
                {groupDesc.length}/100
              </span>
            </div>
            <textarea
              value={groupDesc}
              onChange={(e) => setGroupDesc(e.target.value)}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-700 bg-[#141414] text-white focus:ring-2 focus:ring-white/20 focus:border-white/50 outline-none transition-all resize-none h-24"
              placeholder={t('group.desc_placeholder')}
            />
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 px-1">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isPublic} 
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
              <span className="text-sm font-medium text-gray-300">
                {dir === 'rtl' ? 'مجموعة عامة' : 'Public Group'}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="bg-white text-black px-6 py-2 rounded-xl hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] font-medium active:scale-95"
            >
              {isEditMode ? t('common.save') : t('groups.create')}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, groupId: null })}
        onConfirm={() => {
          if (deleteModal.groupId) {
            deleteGroup(deleteModal.groupId);
          }
        }}
        title={t('groups.delete_confirm_title') || 'Delete Group'}
        message={t('groups.delete_confirm') || 'Are you sure you want to delete this group? This action cannot be undone.'}
        confirmText={t('common.delete')}
        variant="danger"
      />
    </FadeSection>
  );
};
