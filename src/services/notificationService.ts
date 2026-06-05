import { supabase } from '../lib/supabase';
import { Notification, NotificationPreferences } from '../types';

// Get notifications
export const getNotifications = async (_userId: string | null): Promise<Notification[]> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return [];
    }
    const { data, error } = await supabase.rpc('get_my_notifications');
    
    if (error) {
      console.warn("Error loading notifications:", error.message);
      return [];
    }
    
    return data || [];
  } catch (error: any) {
    console.warn("Network error or configuration issue when fetching notifications:", error.message || error);
    return [];
  }
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

// Delete notification
export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
};

// Get User Preferences (Local Storage Only)
export const getUserNotificationPreferences = async (_userId: string): Promise<NotificationPreferences> => {
  const local = localStorage.getItem('fontat_notification_prefs');
  if (local) {
    try {
      return JSON.parse(local);
    } catch(e) {}
  }
  return { updates: true, alerts: true, info: true };
};

// Update User Preferences (Local Storage Only)
export const updateUserNotificationPreferences = async (
  _userId: string,
  preferences: NotificationPreferences
): Promise<void> => {
  localStorage.setItem('fontat_notification_prefs', JSON.stringify(preferences));
};

