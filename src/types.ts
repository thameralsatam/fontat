export type Group = {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  is_owner?: boolean;
  font_count?: number;
};

export type FontAsset = {
  id: string;
  hash: string;
  storage_path: string;
  download_url: string;
  size: number;
  created_at: string;
};

export type Font = {
  id: string;
  name: string;
  user_id: string;
  group_id: string;
  asset_id: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  
  // Joined asset fields (from RPC)
  hash?: string;
  storage_path?: string;
  download_url?: string;
  size?: number;
};

export type FontWeight = {
  id: string;
  parent_font_id: string;
  child_font_id: string;
  created_at: string;
  child_font?: Font;
};

export type Language = 'ar' | 'en';

export interface RPCFontResult {
  result_font_id?: string;
  status?: string;
  message?: string;
  upload_required?: boolean;
}

export type NotificationType = 'update' | 'alert' | 'info' | 'promotion';

export type NotificationSlide = {
  id: string;
  title: string;
  description: string;
  image_url?: string;
};

export type Notification = {
  id: string;
  user_id: string | null;
  type: NotificationType;
  slides: NotificationSlide[];
  created_at: string;
};

export type NotificationPreferences = {
  updates: boolean;
  alerts: boolean;
  info: boolean;
};


