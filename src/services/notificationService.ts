import { supabase } from '../lib/supabase';
import { Notification, NotificationPreferences } from '../types';

void supabase;

// TODO: reconnect to Supabase (previously used: supabase.rpc('get_my_notifications'))
export const getNotifications = async (_userId: string | null): Promise<Notification[]> => {
  return [];
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('send_notification'))
export const createNotification = async (
  _type: string,
  _slides: any[],
  _userId: string | null = null
) => {
  return { success: true };
};

// TODO: reconnect to Supabase (previously used: supabase.storage.from('notifications').upload & getPublicUrl)
export const uploadNotificationImage = async (file: File): Promise<string> => {
  return URL.createObjectURL(file);
};

// TODO: reconnect to Supabase (previously used: supabase.from('notifications').delete().eq('id', id))
export const deleteNotification = async (_id: string): Promise<void> => {
};

// Get User Preferences (Local Storage Only)
export const getUserNotificationPreferences = async (_userId: string): Promise<NotificationPreferences> => {
  const defaultPrefs: NotificationPreferences = { all_notifications: true, updates: true, alerts: true, info: true, promotion: true };
  const local = localStorage.getItem('fontat_notification_prefs');
  if (local) {
    try {
      const parsed = JSON.parse(local);
      return { ...defaultPrefs, ...parsed };
    } catch(e) {}
  }
  return defaultPrefs;
};

// Update User Preferences (Local Storage Only)
export const updateUserNotificationPreferences = async (
  _userId: string,
  preferences: NotificationPreferences
): Promise<void> => {
  localStorage.setItem('fontat_notification_prefs', JSON.stringify(preferences));
};


