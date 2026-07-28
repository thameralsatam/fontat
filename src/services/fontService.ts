// @ts-ignore
import { supabase } from '../lib/supabase';
import { Font, FontWeight } from '../types';

void supabase;

export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// TODO: reconnect to Supabase
// Previously used:
// 1. supabase.rpc('prepare_font_upload', { p_name, p_hash, p_group_id })
// 2. supabase.storage.from('fonts').upload(...) & getPublicUrl(...)
// 3. supabase.rpc('save_new_font', { p_name, p_hash, p_storage_path, p_download_url, p_size, p_group_id })
export const uploadFontToGroup = async (
  file: File,
  groupId: string | null,
  _allowDuplicate: boolean = false
): Promise<{ font: Font; isNewUpload: boolean }> => {
  try {
    const hash = await calculateFileHash(file);
    const blobUrl = URL.createObjectURL(file);
    const newFont: Font = {
      id: `font-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: 'demo-user',
      asset_id: `asset-${Date.now()}`,
      group_id: groupId || 'demo-group-1',
      name: file.name.replace(/\.[^/.]+$/, ''),
      download_url: blobUrl,
      size: file.size,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      hash: hash,
      metadata: { tags: [] }
    };

    const key = `fontat_disconnected_fonts_${groupId || 'all'}`;
    const currentFonts = await getGroupFonts(groupId);
    const updated = [newFont, ...currentFonts];
    localStorage.setItem(key, JSON.stringify(updated));

    return { font: newFont, isNewUpload: true };
  } catch (error) {
    console.error('Error in uploadFontToGroup (disconnected mode):', error);
    throw error;
  }
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_font_smart', { p_action: 'delete' }))
export const deleteFontPermanently = async (_fontId: string) => {
  return { success: true };
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_font_smart', { p_action: 'update' }))
export const updateFontName = async (_fontId: string, _newName: string) => {
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_font_smart', { p_action: 'update' }))
export const updateFontTags = async (_fontId: string, _tags: string[]) => {
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('get_my_fonts', { p_group_id: groupId }))
export const getGroupFonts = async (groupId: string | null): Promise<Font[]> => {
  const key = `fontat_disconnected_fonts_${groupId || 'all'}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }
  return [];
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('get_public_fonts'))
export const getPublicFonts = async (): Promise<Font[]> => {
  const cached = localStorage.getItem('fontat_disconnected_public_fonts');
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }
  return [];
};

// TODO: reconnect to Supabase (previously used: supabase.storage.from('fonts').upload & supabase.rpc('add_weight_directly'))
export const uploadFontWeight = async (
  file: File,
  _parentFontId: string,
  groupId: string | null
): Promise<Font> => {
  try {
    const hash = await calculateFileHash(file);
    const blobUrl = URL.createObjectURL(file);
    const weightFont: Font = {
      id: `weight-${Date.now()}`,
      user_id: 'demo-user',
      asset_id: `asset-${Date.now()}`,
      name: file.name,
      hash: hash,
      download_url: blobUrl,
      group_id: groupId || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return weightFont;
  } catch (error) {
    console.error('Error in uploadFontWeight (disconnected mode):', error);
    throw error;
  }
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('get_my_weights', { p_font_id: parentFontId }))
export const getFontWeights = async (_parentFontId: string): Promise<FontWeight[]> => {
  return [];
};

// TODO: reconnect to Supabase (previously used: supabase.from('font_weights').select('parent_font_id, child_font_id'))
export const getAllWeightRelationships = async (): Promise<{ parent_font_id: string, child_font_id: string }[]> => {
  return [];
};

// TODO: reconnect to Supabase (previously used: supabase.from('font_weights').select(...).in(...))
export const getWeightRelationshipsForFonts = async (_fontIds: string[]): Promise<{ parent_font_id: string, child_font_id: string }[]> => {
  return [];
};


