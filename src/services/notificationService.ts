import { supabase } from '../lib/supabase';
import { Notification, NotificationPreferences } from '../types';

// Get notifications
export const getNotifications = async (_userId: string | null = null): Promise<Notification[]> => {
  const { data, error } = await supabase.rpc('get_my_notifications');
  
  if (error) {
    console.error("Error loading notifications:", error.message);
    throw error;
  }
  
  return data || [];
};

// Create a new general notification (admin only)
export const createNotification = async (
  type: string,
  slides: any[],
  userId: string | null = null
) => {
  const { data, error } = await supabase.rpc('send_notification', {
    p_user_id: userId,
    p_type: type,
    p_slides: slides
  });

  if (error) {
    console.error("فشل الإرسال:", error.message);
    throw error;
  }
  return data;
};

// Upload an image for a notification slide
export const uploadNotificationImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('notifications')
    .upload(fileName, file, { upsert: false });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('notifications').getPublicUrl(fileName);
  return data.publicUrl;
};

// Delete notification (Handled client-side via localStorage in NotificationContext)
export const deleteNotification = async (_id: string): Promise<void> => {
  // Notification deletion is handled locally via localStorage
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



