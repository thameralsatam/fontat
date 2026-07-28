import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Notification, NotificationPreferences } from '../types';
import { getNotifications, getUserNotificationPreferences } from '../services/notificationService';

// Manage read state in localStorage (Last 30 days logic can be done by fetching and filtering, or simply storing IDs)
const READ_NOTIFICATIONS_KEY = 'fontat_read_notifications';
const DELETED_NOTIFICATIONS_KEY = 'fontat_deleted_notifications';
const PREFS_KEY = 'fontat_notification_prefs';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  reloadNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load read and deleted IDs from localStorage
  useEffect(() => {
    try {
      const storedRead = localStorage.getItem(READ_NOTIFICATIONS_KEY);
      if (storedRead) {
        const parsed = JSON.parse(storedRead);
        if (Array.isArray(parsed)) setReadIds(new Set(parsed));
      }
      
      const storedDeleted = localStorage.getItem(DELETED_NOTIFICATIONS_KEY);
      if (storedDeleted) {
        const parsed = JSON.parse(storedDeleted);
        if (Array.isArray(parsed)) {
            const now = Date.now();
            const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
            // Filter out old deleted entries
            const valid = parsed.filter(item => {
               if (typeof item === 'string') return true; // keep old string records temporarily
               if (item && item.deletedAt) {
                   return (now - item.deletedAt) < thirtyDaysMs;
               }
               return true;
            });
            const ids = valid.map(item => typeof item === 'string' ? item : item.id).filter(Boolean);
            setDeletedIds(new Set(ids));
            // Update local storage if we filtered some out
            if (valid.length !== parsed.length) {
               localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(valid));
            }
        }
      }
    } catch (e) {
      console.error('Failed to parse read/deleted notifications from local storage', e);
    }
  }, []);

  const deletedIdsRef = React.useRef(deletedIds);
  useEffect(() => {
    deletedIdsRef.current = deletedIds;
  }, [deletedIds]);

  const userId = user?.id || null;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Load user preferences
      let prefs: NotificationPreferences = { all_notifications: true, updates: true, alerts: true, info: true, promotion: true };
      if (userId) {
        try { prefs = await getUserNotificationPreferences(userId); } catch(e) {}
      } else {
        try {
           const stored = localStorage.getItem(PREFS_KEY);
           if (stored) {
              const parsed = JSON.parse(stored);
              prefs = { ...prefs, ...parsed };
           }
        } catch(e) {}
      }

      const data = await getNotifications(userId);
      
      // Optional: Filter notifications to last 30 days max for performance/storage optimization
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const currentDeleted = deletedIdsRef.current;
      const filteredData = data.filter(n => {
          if (new Date(n.created_at) <= thirtyDaysAgo) return false;
          // Hide manually deleted items
          if (currentDeleted.has(n.id)) return false;
          
          // Alert is critical and cannot be disabled
          if (n.type === 'alert') return true;
          
          // If all notifications are disabled globally, hide others
          if (!prefs.all_notifications) return false;

          // Also hide based on preferences if it's general
          if (n.type === 'update' && !prefs.updates) return false;
          if (n.type === 'info' && !prefs.info) return false;
          if (n.type === 'promotion' && !prefs.promotion) return false;
          
          return true;
      });
      
      setNotifications(filteredData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadNotifications();
    // Refresh interval every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  const deleteNotification = useCallback((notificationId: string) => {
    setDeletedIds(prev => {
        const newSet = new Set(prev);
        newSet.add(notificationId);
        
        // We can store it as objects with timestamp to clear after 30 days
        const toStore = Array.from(newSet).map(id => ({ id, deletedAt: Date.now() }));
        localStorage.setItem(DELETED_NOTIFICATIONS_KEY, JSON.stringify(toStore));
        return newSet;
    });
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setReadIds(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      
      // Limit local storage array size to avoid bloating (keep max 100 to 200 IDs)
      const idsArray = Array.from(newSet);
      if (idsArray.length > 200) {
          idsArray.shift(); // Remove oldest
      }
      
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(idsArray));
      return new Set(idsArray);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const newSet = new Set(prev);
      notifications.forEach(n => newSet.add(n.id));
      localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify(Array.from(newSet).slice(-200)));
      return newSet;
    });
  }, [notifications]);

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  return (
    <NotificationContext.Provider value={{
      notifications: notifications.map(n => ({ ...n, is_read: readIds.has(n.id) })),
      unreadCount,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      reloadNotifications: loadNotifications,
      loading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useAppNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useAppNotifications must be used within a NotificationProvider');
  }
  return context;
};
