import { supabase } from '../lib/supabase';
import { Notification, NotificationPreferences } from '../types';

// Get notifications
export const getNotifications = async (userId: string | null): Promise<Notification[]> => {
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

// Delete notification
export const deleteNotification = async (id: string): Promise<void> => {
  const { error } = await supabase.from('notifications').delete().eq('id', id);
  if (error) throw error;
};

// Get User Preferences
export const getUserNotificationPreferences = async (userId: string): Promise<NotificationPreferences> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('notification_preferences')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data?.notification_preferences || { updates: true, alerts: true, info: true };
};

// Update User Preferences
export const updateUserNotificationPreferences = async (
  userId: string,
  preferences: NotificationPreferences
): Promise<void> => {
  const { error } = await supabase
    .from('profiles')
    .update({ notification_preferences: preferences })
    .eq('id', userId);

  if (error) throw error;
};
