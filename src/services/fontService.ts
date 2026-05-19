import { supabase } from '../lib/supabase';
import { Font, FontWeight } from '../types';

export const calculateFileHash = async (file: File): Promise<string> => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

export const uploadFontToGroup = async (
  file: File,
  groupId: string,
  allowDuplicate: boolean = false
): Promise<{ font: Font; isNewUpload: boolean }> => {
  try {
    const hash = await calculateFileHash(file);

    // 1. Prepare upload
    const { data: prepareResult, error: prepareError } = await supabase.rpc('prepare_font_upload', {
      p_name: file.name,
      p_hash: hash,
      p_group_id: groupId
    });

    if (prepareError) throw prepareError;

    // Based on strict user instructions:
    if (prepareResult.needs_upload === false && prepareResult.duplicate === true) {
      if (!allowDuplicate) {
        throw new Error('This font is already in the group.');
      }
      
      // If it's a duplicate but we allow it (e.g. for weight linking), fetch and return it
      const fonts = await getGroupFonts(groupId);
      const existingFont = fonts.find((f: Font) => f.id === prepareResult.font_id || f.hash === hash);
      if (!existingFont) throw new Error('Duplicate font linked but could not be retrieved.');
      return { font: existingFont, isNewUpload: false };
    }

    if (prepareResult.needs_upload === false && prepareResult.linked === true) {
      // Font was successfully linked (existed in storage but not in this group)
      const fonts = await getGroupFonts(groupId);
      
      const existingFont = fonts.find((f: Font) => f.id === prepareResult.font_id || f.hash === hash);
      if (!existingFont) {
        console.warn(`Font linked (${prepareResult.font_id}) but not found in getGroupFonts. Retrying...`);
        // Return a mock object if it really fails due to delay to prevent UI crash
        return { 
          font: { id: prepareResult.font_id, name: file.name, hash: hash, group_id: groupId } as Font, 
          isNewUpload: false 
        };
      }
      return { font: existingFont, isNewUpload: false };
    }

    // 2. If needs_upload is true
    const fileExt = file.name.split('.').pop() || 'ttf';
    const fileName = `${hash}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('fonts')
      .upload(fileName, file, {
        upsert: true // ensuring we can overwrite if an orphaned file existed
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('fonts')
      .getPublicUrl(fileName);
    
    const downloadUrl = publicUrlData.publicUrl;

    // 3. Save new font record linking to the new asset
    const { data: saveResult, error: saveError } = await supabase.rpc('save_new_font', {
      p_name: file.name,
      p_hash: hash,
      p_storage_path: fileName,
      p_download_url: downloadUrl,
      p_size: file.size,
      p_group_id: groupId
    });

    if (saveError) throw saveError;
    if (!saveResult || (!saveResult.success && !saveResult.duplicate)) {
       throw new Error('Failed to save the font');
    }

    // Fetch the specific final font object using properly mapped getGroupFonts
    const fonts = await getGroupFonts(groupId);
    
    // Attempt to find the newly created font in the result
    const finalFont = fonts.find((f: Font) => f.id === saveResult.font_id || f.hash === hash);
    if (!finalFont) {
        console.warn(`Font saved (${saveResult.font_id}) but not found in getGroupFonts. Retrying...`);
        return { 
          font: { id: saveResult.font_id, name: file.name, hash: hash, group_id: groupId } as Font, 
          isNewUpload: !saveResult.duplicate 
        };
    }

    return { font: finalFont, isNewUpload: !saveResult.duplicate };

  } catch (error) {
    console.error('Error in uploadFontToGroup:', error);
    throw error;
  }
};

export const deleteFontPermanently = async (fontId: string) => {
  // We only delete the user record, not the physical file as per instructions
  const { data, error } = await supabase.rpc('manage_font_smart', {
    p_action: 'delete',
    p_font_id: fontId,
    p_name: null
  });

  if (error) throw error;
  return data;
};

export const updateFontName = async (fontId: string, newName: string) => {
  const { error } = await supabase.rpc('manage_font_smart', {
    p_action: 'update',
    p_font_id: fontId,
    p_name: newName
  });

  if (error) throw error;
};

export const updateFontTags = async (fontId: string, tags: string[]) => {
  const { error } = await supabase.rpc('manage_font_smart', {
    p_action: 'update',
    p_font_id: fontId,
    p_metadata: { tags }
  });

  if (error) throw error;
};

export const getGroupFonts = async (groupId: string): Promise<Font[]> => {
  // Use RPC to fetch fonts
  const { data, error } = await supabase.rpc('get_my_fonts', {
    p_group_id: groupId
  });
  
  if (error) throw error;
  if (!data) return [];
  
  // Deduplicate by id and map font_id to id
  const mappedFonts = data
    .filter((item: any) => !item.metadata?.is_weight)
    .map((item: any) => ({
      id: item.font_id,
      group_id: item.group_id,
      asset_id: item.asset_id,
      name: item.name,
      metadata: item.metadata,
      download_url: item.download_url,
      size: item.size,
      created_at: item.created_at,
      hash: item.font_hash
    }));

  return Array.from(new Map(mappedFonts.map((f: any) => [f.id, f])).values()) as Font[];
};

export const getPublicFonts = async (): Promise<Font[]> => {
  const { data, error } = await supabase.rpc('get_public_fonts');
  
  if (error) throw error;
  if (!data) return [];
  
  const mappedFonts = data
    .filter((item: any) => !item.metadata?.is_weight)
    .map((item: any) => ({
      id: item.font_id,
      name: item.font_name,
      download_url: item.download_url,
      size: item.size,
      created_at: item.created_at,
      group_id: item.group_id,
      group_name: item.group_name,
      metadata: item.metadata,
      tags: item.tags || [],
      weights: item.weights || []
    }));

  return Array.from(new Map(mappedFonts.map((f: any) => [f.id, f])).values()) as Font[];
};

export const uploadFontWeight = async (
  file: File,
  parentFontId: string,
  groupId: string 
): Promise<Font> => {
  try {
    const hash = await calculateFileHash(file);
    const fileExt = file.name.split('.').pop() || 'ttf';
    const fileName = `${hash}.${fileExt}`;

    // Upload physical file to bucket
    const { error: uploadError } = await supabase.storage
      .from('fonts')
      .upload(fileName, file, {
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('fonts')
      .getPublicUrl(fileName);
    
    const downloadUrl = publicUrlData.publicUrl;

    // Use add_weight_directly to link the weight as a child
    const { data: saveResult, error: saveError } = await supabase.rpc('add_weight_directly', {
      p_parent_font_id: parentFontId,
      p_name: file.name,
      p_hash: hash,
      p_storage_path: fileName,
      p_download_url: downloadUrl,
      p_size: file.size
    });

    if (saveError) throw saveError;
    if (!saveResult || (!saveResult.success && !saveResult.duplicate)) {
       throw new Error(saveResult?.message || 'Failed to add weight');
    }

    // Return the newly linked weight
    return { 
      id: saveResult.font_id || '', 
      name: file.name, 
      hash: hash, 
      download_url: downloadUrl, 
      group_id: groupId 
    } as Font;

  } catch (error) {
    console.error('Error in uploadFontWeight:', error);
    throw error;
  }
};

export const getFontWeights = async (parentFontId: string): Promise<FontWeight[]> => {
  const { data, error } = await supabase.rpc('get_my_weights', {
    p_font_id: parentFontId
  });

  if (error) throw error;
  if (!data) return [];
  
  const mappedWeights: FontWeight[] = data.map((item: any) => ({
    id: `${parentFontId}-${item.font_id}`, // UI key
    parent_font_id: parentFontId,
    child_font_id: item.font_id,
    created_at: new Date().toISOString(), // Fallback
    child_font: {
       id: item.font_id,
       name: item.name,
       download_url: item.download_url,
       hash: item.font_hash,
       size: item.size,
       metadata: item.metadata,
       user_id: '',
       group_id: '',
       asset_id: '',
       created_at: ''
    }
  }));

  return Array.from(new Map(mappedWeights.map((w: FontWeight) => [w.id, w])).values());
};

