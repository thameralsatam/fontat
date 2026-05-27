import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { Group } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useGlobal } from '../contexts/GlobalContext';
import { Folder, Plus, MoreVertical, Grid } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import { GroupDetails } from './GroupDetails';
import { SmartSearch, SearchResult } from '../components/SmartSearch';

import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { updateGroup, deleteGroupSmart, createGroupSmart, getGroups } from '../services/groupService';

export const FontsPage = ({ mode = 'private' }: { mode?: 'public' | 'private' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAllGroupsOpen, setIsAllGroupsOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [viewingGroupId, setViewingGroupId] = useState<string | null>(null);
  const [publicTagFilters, setPublicTagFilters] = useState<string[]>([]);
  const [highlightedFont, setHighlightedFont] = useState<{id: string, ts: number} | undefined>();
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  
  // Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; groupId: string | null }>({
    isOpen: false,
    groupId: null
  });
  
  const { t, dir } = useLanguage();
  const { user } = useAuth();
  const { addNotification } = useGlobal();
  const isAdmin = user?.user_metadata?.role === 'admin';

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
    setPublicTagFilters([]);
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'groups' }, () => {
         // Silently fetch groups to keep UI in sync without user interruption
         fetchGroups();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mode]);

  const fetchGroups = async () => {
    if (mode === 'public') {
      setGroups([]);
      return;
    }
    
    try {
      const data = await getGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
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
    
    if (viewingGroupId !== groupId) {
      // Switch group and close options
      setViewingGroupId(groupId);
      setOptionsOpenGroupId(null);
      setMenuPosition(null);
    }
  };

  const handleOptionsClick = (e: React.MouseEvent<HTMLElement>, groupId: string) => {
    e.stopPropagation();
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

        fetchGroups();
        if (data) {
          setGroups(prev => prev.map(g => g.id === data.id ? data : g));
          if ((mode === 'public' && !data.is_public) || (mode === 'private' && data.is_public)) {
            setViewingGroupId(null);
          }
        }
        setIsModalOpen(false);
        setGroupName('');
        setGroupDesc('');
        setSelectedGroup(null);
      } catch (error: any) {
        console.error('Error updating group:', error);
        addNotification('error', error.message || t('group.update_error'));
      }
    } else {
      // Create
      try {
        const data = await createGroupSmart(groupName, groupDesc, isPublic);

        fetchGroups();
        if (data) {
          if ((mode === 'public' && data.is_public) || (mode === 'private' && !data.is_public)) {
            setGroups(prev => {
              const cleaned = prev.filter(g => g.id !== data.id);
              return [data, ...cleaned];
            });
            setViewingGroupId(data.id);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
        addNotification('success', t('group.create_success'));
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
    <div className="pb-32 max-lg:landscape:pb-16 pt-0">
      {/* Search Bar */}
      <div className="mb-6 w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
        <SmartSearch 
          mode={mode} 
          onSelect={async (rawRes) => {
            if ('type' in rawRes && rawRes.type === 'tag') {
              // User selected a tag
              setViewingGroupId(null);
              setPublicTagFilters([rawRes.tag]);
              return;
            }

            // Normal font result
            const res = rawRes as SearchResult;
            let meta = res.metadata;
            if (typeof meta === 'string') {
              try { meta = JSON.parse(meta); } catch(e) {}
            }
            let groupId = meta?.group_id;
            
            if (!groupId && res.id) {
              const { data } = await supabase.from('fonts').select('group_id').eq('id', res.id).single();
              if (data) groupId = data.group_id;
            }

            // Fallback: finding group by group_name
            if (!groupId && res.group_name && mode === 'private') {
               const allMyGroups = await getGroups();
               let found = allMyGroups.find(g => g.name === res.group_name);
               if (found) groupId = found.id;
            }
            
            if (mode === 'public') {
               setViewingGroupId(null);
               setHighlightedFont({ id: res.id, ts: Date.now() });
            } else if (groupId) {
               setViewingGroupId(groupId);
               setHighlightedFont({ id: res.id, ts: Date.now() });
            } else {
               addNotification('error', dir === 'rtl' ? 'عذراً، لم نتمكن من الوصول للمجموعة الخاصة بهذا الخط.' : 'Sorry, we could not access the group for this font.');
            }
          }} 
        />
      </div>

      {/* Modern Group Tabs Bar - Only visible in private mode */}
      {mode === 'private' && (
        <div className="w-full bg-[#080808]/90 backdrop-blur-xl sticky top-0 z-30 pt-4 pb-0">
          <div className="flex items-center gap-2 xl:max-w-[1600px] mx-auto px-4 md:px-8 pb-3">
            
            {/* Scrollable Groups */}
            <div className="overflow-x-auto scrollbar-hide flex-1 touch-pan-x relative mask-fade-edges">
            <div className="flex items-center gap-1.5 w-max px-1">
              <AnimatePresence mode='popLayout'>
                {displayedGroups.map(group => (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex items-center"
                  >
                    <button
                      onClick={(e) => handleGroupClick(e, group.id)}
                      className={`relative py-2 text-[13px] font-medium transition-all whitespace-nowrap flex items-center justify-center rounded-xl group/tab ${
                        viewingGroupId === group.id
                          ? 'text-white ' + ((mode === 'private' || isAdmin) ? 'ps-4 pe-8' : 'px-4')
                          : 'px-4 text-white/40 hover:text-white/90 hover:bg-white/[0.04]'
                      }`}
                    >
                      {viewingGroupId === group.id && (
                        <motion.div
                          layoutId="activeTabPill"
                          className="absolute inset-0 bg-white/10 rounded-xl"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 block transition-all">{group.name}</span>
                      
                      {viewingGroupId === group.id && (mode === 'private' || isAdmin) && (
                        <div 
                          onClick={(e) => handleOptionsClick(e, group.id)}
                          className="absolute end-1 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-lg hover:bg-white/20 transition-colors cursor-pointer flex items-center justify-center text-white/70 hover:text-white"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Create Button */}
              {(mode === 'private' || isAdmin) && user && (
                <motion.div layout className="pl-1 flex items-center" transition={{ duration: 0.2 }}>
                  <button
                    onClick={handleOpenCreate}
                    className="h-[34px] w-[34px] rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0"
                    title={t('groups.create')}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </div>
          </div>

          <div className="w-px h-6 bg-white/10 shrink-0 mx-1 hidden sm:block" />

          {/* All Groups Modal Toggle */}
          <button 
            onClick={() => setIsAllGroupsOpen(true)}
            className="h-[34px] w-[34px] sm:w-auto sm:px-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/10 hover:border-white/10 text-white/50 hover:text-white flex items-center justify-center transition-all shrink-0 gap-2 focus:ring-2 focus:ring-white/20 outline-none"
          >
            <Grid className="w-4 h-4" />
            <span className="text-[12px] hidden sm:block">{t('groups.title')}</span>
          </button>
        </div>
      </div>
      )}

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
                  className="flex items-center gap-3 px-3 py-2 text-sm text-white opacity-80 hover:text-white hover:bg-white/10 rounded-xl transition-colors w-full text-left active:bg-white/20"
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
        {mode === 'public' ? (
          <GroupDetails 
            isPublicAllFonts={true}
            publicTagFilters={publicTagFilters}
            onClearTagFilter={() => setPublicTagFilters([])}
            onTagClick={tag => setPublicTagFilters(prev => 
              prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
            )}
            highlightedFont={highlightedFont}
          />
        ) : viewingGroupId ? (
          <GroupDetails 
            groupId={viewingGroupId}
            groupData={groups.find(g => g.id === viewingGroupId)}
            highlightedFont={highlightedFont}
          />
        ) : (
          /* Default View (No group selected) */
           <div className="text-center py-20 max-lg:landscape:py-8 text-white opacity-20 w-full xl:max-w-[1600px] mx-auto px-4 md:px-8">
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
              <span className={`text-xs ${groupName.length > 25 ? 'text-red-500' : 'text-white opacity-30'}`}>
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
              <span className={`text-xs ${groupDesc.length > 100 ? 'text-red-500' : 'text-white opacity-30'}`}>
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

      {/* All Groups Modal */}
      <Modal
        isOpen={isAllGroupsOpen}
        onClose={() => setIsAllGroupsOpen(false)}
        title={t('groups.title') || 'All Groups'}
      >
        <div className="pt-2 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {displayedGroups.map((group) => (
              <div 
                key={group.id}
                onClick={(e) => {
                  handleGroupClick(e as any, group.id);
                  setIsAllGroupsOpen(false);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group/allcard ${
                  viewingGroupId === group.id 
                    ? 'bg-white/10 border-white/20' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex shrink-0 items-center justify-center text-white/50 group-hover/allcard:text-white transition-colors">
                  <Folder className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-white font-medium text-sm leading-tight truncate group-hover/allcard:text-white transition-colors">{group.name}</h3>
                    {viewingGroupId === group.id && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    )}
                  </div>
                  {group.description && (
                    <p className="text-white/40 text-xs truncate mt-0.5">{group.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          {displayedGroups.length === 0 && (
            <div className="py-20 text-center text-white/30 flex flex-col items-center justify-center">
              <Folder className="w-12 h-12 mb-4 opacity-20" />
              <p>No groups available</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
