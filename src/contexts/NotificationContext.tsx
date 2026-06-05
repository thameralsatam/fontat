import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Notification, NotificationPreferences } from '../types';
import { getNotifications, getUserNotificationPreferences } from '../services/notificationService';

// Manage read state in localStorage (Last 30 days logic can be done by fetching and filtering, or simply storing IDs)
const READ_NOTIFICATIONS_KEY = 'fontat_read_notifications';
const PREFS_KEY = 'fontat_notification_prefs';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  reloadNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load read IDs from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setReadIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error('Failed to parse read notifications from local storage', e);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      // Load user preferences
      let prefs: NotificationPreferences = { updates: true, alerts: true, info: true };
      if (user) {
        try { prefs = await getUserNotificationPreferences(user.id); } catch(e) {}
      } else {
        try {
           const stored = localStorage.getItem(PREFS_KEY);
           if (stored) prefs = JSON.parse(stored);
        } catch(e) {}
      }

      const data = await getNotifications(user?.id || null);
      
      // Optional: Filter notifications to last 30 days max for performance/storage optimization
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const filteredData = data.filter(n => {
          if (new Date(n.created_at) <= thirtyDaysAgo) return false;
          // Also hide based on preferences if it's general
          if (n.type === 'update' && !prefs.updates) return false;
          if (n.type === 'alert' && !prefs.alerts) return false;
          if ((n.type === 'info' || n.type === 'promotion') && !prefs.info) return false;
          return true;
      });
      
      setNotifications(filteredData);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
    // Refresh interval every 5 minutes
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

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
