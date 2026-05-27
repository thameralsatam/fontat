import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { uploadFontToGroup, uploadFontWeight, getGroupFonts, getFontWeights } from '../services/fontService';
import { useLanguage } from './LanguageContext';
import { Group } from '../types';

interface UploadTask {
  id: string;
  file: File;
  groupId: string | null;
  parentFontId?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  fontId?: string;
  tempId?: string;
  localUrl?: string;
  downloadUrl?: string | null;
  timestamp?: number;
}

interface Notification {
  id: string;
  type: 'upload' | 'warning' | 'info' | 'success' | 'error';
  message: string;
  details?: string;
  isExpanded: boolean;
  timestamp: number;
}

interface GlobalContextType {
  uploadQueue: UploadTask[];
  addToUploadQueue: (files: File[], groupId: string | null, parentFontId?: string) => void;
  retryUpload: (taskId: string) => void;
  clearCompletedUploads: () => void;
  removeFromQueueByFontId: (fontId: string) => void;
  notifications: Notification[];
  addNotification: (type: 'upload' | 'warning' | 'info' | 'success' | 'error', message: string, details?: string) => void;
  toggleNotification: (id: string) => void;
  removeNotification: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeTab: 'all' | 'public' | 'private';
  setActiveTab: (tab: 'all' | 'public' | 'private') => void;
  
  // New state for Layout/BottomNav integration
  activeGroup: Group | null;
  setActiveGroup: (group: Group | null) => void;
  onRenameGroup: (group: Group) => void;
  setOnRenameGroup: (fn: (group: Group) => void) => void;
  onDeleteGroup: (group: Group) => void;
  setOnDeleteGroup: (fn: (group: Group) => void) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [uploadQueue, setUploadQueue] = useState<UploadTask[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'public' | 'private'>('all');
  
  // New state
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [onRenameGroup, setOnRenameGroup] = useState<(group: Group) => void>(() => () => {});
  const [onDeleteGroup, setOnDeleteGroup] = useState<(group: Group) => void>(() => () => {});

  const processingRef = useRef(false);
  const { t } = useLanguage();

  // --- Notifications Logic ---
  const addNotification = useCallback((type: 'upload' | 'warning' | 'info' | 'success' | 'error', message: string, details?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => {
      const isDuplicate = prev.some(n => n.message === message && n.type === type && Date.now() - n.timestamp < 2000);
      if (isDuplicate) return prev;
      return [...prev, {
        id,
        type,
        message,
        details,
        isExpanded: false,
        timestamp: Date.now()
      }];
    });
    
    if (type !== 'upload') {
      const timeout = type === 'warning' ? 20000 : 15000;
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, timeout);
    }
  }, []);

  const toggleNotification = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isExpanded: !n.isExpanded } : n
    ));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- Offline Detection ---
  useEffect(() => {
    const handleOnline = () => {
      addNotification('success', t('error.connection_restored'), t('error.connection_restored_desc'));
    };
    const handleOffline = () => {
      addNotification('error', t('error.no_connection'), t('error.no_connection_desc'));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addNotification]);

  // --- Upload Logic ---
  const addToUploadQueue = useCallback(async (files: File[], groupId: string | null, parentFontId?: string) => {
    // 1. Handle Limit (Max 10)
    let filesToProcess = files;
    if (files.length > 10) {
      addNotification('error', t('common.error') || 'Error');
      filesToProcess = files.slice(0, 10);
    }

    // 2. Check for duplicates (DB + Current Queue) BEFORE adding to state
    try {
      // Check against DB
      let dbDuplicateNames = new Set<string>();
      if (parentFontId) {
        // Check if this font name already exists as a weight for this parent
        const weights = await getFontWeights(parentFontId);
        dbDuplicateNames = new Set(weights.map(w => w.child_font?.name || ''));
      } else {
        // Check against group fonts
        const groupFonts = await getGroupFonts(groupId);
        dbDuplicateNames = new Set(groupFonts.map(f => f.name));
      }

      // Check against Current Queue (Pending/Uploading)
      const queueDuplicateNames = new Set(uploadQueue.map(t => t.file.name));

      const uniqueFiles: File[] = [];
      const duplicateNames: string[] = [];

      filesToProcess.forEach(file => {
        if (dbDuplicateNames.has(file.name) || queueDuplicateNames.has(file.name)) {
          duplicateNames.push(file.name);
        } else {
          uniqueFiles.push(file);
        }
      });

      // 3. Notify about duplicates
      if (duplicateNames.length > 0) {
        const title = t('font.duplicate_title');
        let details = '';

        if (duplicateNames.length <= 5) {
          details = duplicateNames.map(name => `• ${name}`).join('\n');
        } else {
          details = `• ${duplicateNames.slice(0, 5).map(name => name).join('\n')}\n...and ${duplicateNames.length - 5} more`;
        }

        addNotification('error', title, details);
      }

      // 4. Add ONLY unique files to queue
      if (uniqueFiles.length > 0) {
        const newTasks: UploadTask[] = uniqueFiles.map((file, index) => ({
          id: Math.random().toString(36).substr(2, 9),
          tempId: `temp-${Date.now()}-${index}`,
          file,
          localUrl: URL.createObjectURL(file),
          groupId,
          parentFontId,
          status: 'pending',
          progress: 0,
          timestamp: Date.now() + index // Index 0 gets smaller timestamp to appear FIRST (above index 1)
        }));

        setUploadQueue(prev => [...prev, ...newTasks]);
      }

    } catch (error) {
      console.error('Error checking duplicates:', error);
      // Fallback: If check fails, add all (safety net, though duplicates will fail in processNext)
      const newTasks: UploadTask[] = filesToProcess.map((file, index) => ({
        id: Math.random().toString(36).substr(2, 9),
        tempId: `temp-${Date.now()}-${index}`,
        file,
        localUrl: URL.createObjectURL(file),
        groupId,
        parentFontId,
        status: 'pending',
        progress: 0,
        timestamp: Date.now() + index
      }));
      setUploadQueue(prev => [...prev, ...newTasks]);
    }
  }, [uploadQueue, addNotification, t]);

  // Process Queue Effect
  useEffect(() => {
    const processNext = async () => {
      if (processingRef.current) return;

      const nextTask = uploadQueue.find(t => t.status === 'pending');
      if (!nextTask) return;

      processingRef.current = true;

      const attemptUpload = async (retries: number): Promise<any> => {
        try {
          // Mark as uploading
          setUploadQueue(prev => prev.map(t => t.id === nextTask.id ? { ...t, status: 'uploading' } : t));

          // Simulate delay for UI smoothness
          await new Promise(resolve => setTimeout(resolve, 500));

          let font;
          if (nextTask.parentFontId) {
            // It's a weight upload
            font = await uploadFontWeight(nextTask.file, nextTask.parentFontId, nextTask.groupId);
          } else {
            // It's a normal font upload
            const res = await uploadFontToGroup(nextTask.file, nextTask.groupId);
            font = res.font;
          }

          // Mark as success
          setUploadQueue(prev => prev.map(t => 
            t.id === nextTask.id ? { 
              ...t, 
              status: 'success', 
              fontId: font.id, 
              downloadUrl: font.download_url, 
              progress: 100 
            } : t
          ));

        } catch (error: any) {
          if (retries > 0 && !error.message?.includes('already in the group')) {
            console.warn(`Upload failed, retrying... (${retries} left)`, error);
            await new Promise(res => setTimeout(res, 1000)); // wait before retry
            return attemptUpload(retries - 1);
          } else {
            console.error(`Upload failed for ${nextTask.file.name}`, error);
            setUploadQueue(prev => prev.map(t => 
              t.id === nextTask.id ? { ...t, status: 'error', error: error.message || 'Upload failed' } : t
            ));
            
            if (error.message?.includes('already in the group')) {
              addNotification('error', t('font.duplicate_title') || 'Duplicate font', error.message);
            } else {
              addNotification('error', error.message || t('common.error') || 'Error');
            }
          }
        }
      };

      await attemptUpload(2); // max 2 retries
      processingRef.current = false;
    };

    processNext();
  }, [uploadQueue, addNotification, t]);

  const retryUpload = useCallback((taskId: string) => {
    setUploadQueue(prev => prev.map(task => 
      task.id === taskId ? { ...task, status: 'pending', error: undefined } : task
    ));
  }, []);

  const clearCompletedUploads = useCallback(() => {
    setUploadQueue(prev => prev.filter(t => t.status !== 'success'));
  }, []);

  const removeFromQueueByFontId = useCallback((fontId: string) => {
    setUploadQueue(prev => prev.filter(t => t.fontId !== fontId));
  }, []);

  // Completion Detector
  const wasUploadingRef = useRef(false);
  useEffect(() => {
    const isUploading = uploadQueue.some(t => t.status === 'pending' || t.status === 'uploading');
    
    if (wasUploadingRef.current && !isUploading) {
      // Just finished a batch
      const successCount = uploadQueue.filter(t => t.status === 'success').length;
      if (successCount > 0) {
         // Auto-clear success tasks after 3 seconds to remove checkmarks
         setTimeout(() => {
           setUploadQueue(prev => prev.filter(t => t.status !== 'success'));
         }, 3000);
      }
    }
    
    wasUploadingRef.current = isUploading;
  }, [uploadQueue, t]);

  // Sync Upload Notification
  useEffect(() => {
    const uploadingCount = uploadQueue.filter(t => t.status === 'uploading' || t.status === 'pending').length;
    
    setNotifications(prev => {
      const uploadNotif = prev.find(n => n.type === 'upload');
      
      if (uploadingCount > 0) {
        const msg = t('font.uploading_progress').replace('{current}', (uploadQueue.length - uploadingCount + 1).toString()).replace('{total}', uploadQueue.length.toString());
        if (uploadNotif) {
          return prev.map(n => n.id === uploadNotif.id ? { ...n, message: msg } : n);
        } else {
          return [...prev, {
            id: 'global-upload-progress',
            type: 'upload',
            message: msg,
            isExpanded: false,
            timestamp: Date.now()
          }];
        }
      } else {
        if (uploadNotif) {
          return prev.filter(n => n.type !== 'upload');
        }
        return prev;
      }
    });
  }, [uploadQueue, t]);

  return (
    <GlobalContext.Provider value={{
      uploadQueue,
      addToUploadQueue,
      retryUpload,
      clearCompletedUploads,
      removeFromQueueByFontId,
      notifications,
      addNotification,
      toggleNotification,
      removeNotification,
      searchQuery,
      setSearchQuery,
      activeTab,
      setActiveTab,
      activeGroup,
      setActiveGroup,
      onRenameGroup,
      setOnRenameGroup,
      onDeleteGroup,
      setOnDeleteGroup
    }}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};
