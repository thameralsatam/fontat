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
  groupId: string | null,
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

    if (prepareError) {
      if (prepareError.message?.includes('font_limit_reached') || (prepareError as any).details?.includes('font_limit_reached')) {
        throw new Error('font_limit_reached');
      }
      throw prepareError;
    }

    if (!prepareResult || prepareResult.success === false) {
      if (prepareResult?.message === 'font_limit_reached') {
        throw new Error('font_limit_reached');
      }
      throw new Error(prepareResult?.message || 'Failed to prepare font upload');
    }

    if (prepareResult.needs_upload === false && prepareResult.duplicate === true) {
      if (!allowDuplicate) {
        throw new Error('This font is already in the group.');
      }
      
      const { fonts } = await getGroupFonts(groupId);
      const existingFont = fonts.find((f: Font) => f.id === prepareResult.font_id || f.hash === hash);
      if (!existingFont) {
        return {
          font: { id: prepareResult.font_id, name: file.name, hash: hash, group_id: groupId } as Font,
          isNewUpload: false
        };
      }
      return { font: existingFont, isNewUpload: false };
    }

    if (prepareResult.needs_upload === false && prepareResult.linked === true) {
      const { fonts } = await getGroupFonts(groupId);
      const existingFont = fonts.find((f: Font) => f.id === prepareResult.font_id || f.hash === hash);
      if (!existingFont) {
        return { 
          font: { id: prepareResult.font_id, name: file.name, hash: hash, group_id: groupId } as Font, 
          isNewUpload: false 
        };
      }
      return { font: existingFont, isNewUpload: false };
    }

    // 2. Upload file if needed (isolated storage upload step with upsert: false)
    const fileExt = (file.name.split('.').pop() || 'ttf').toLowerCase();
    const fileName = `${hash}.${fileExt}`;

    if (prepareResult.needs_upload !== false) {
      const { error: uploadError } = await supabase.storage
        .from('fonts')
        .upload(fileName, file, {
          upsert: false
        });

      if (uploadError) {
        const isAlreadyExists =
          uploadError.message?.toLowerCase().includes('already exists') ||
          uploadError.message?.toLowerCase().includes('duplicate') ||
          (uploadError as any).statusCode === '409' ||
          (uploadError as any).error === 'Duplicate';

        if (!isAlreadyExists) {
          throw uploadError;
        }
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('fonts')
      .getPublicUrl(fileName);
    
    const downloadUrl = publicUrlData.publicUrl;

    // 3. Save new font record via Database RPC
    const { data: saveResult, error: saveError } = await supabase.rpc('save_new_font', {
      p_name: file.name,
      p_hash: hash,
      p_storage_path: fileName,
      p_download_url: downloadUrl,
      p_size: file.size,
      p_group_id: groupId
    });

    if (saveError) {
      if (saveError.message?.includes('font_limit_reached') || (saveError as any).details?.includes('font_limit_reached')) {
        throw new Error('font_limit_reached');
      }
      throw saveError;
    }
    if (!saveResult || saveResult.success === false) {
       if (saveResult?.message === 'font_limit_reached') {
         throw new Error('font_limit_reached');
       }
       throw new Error(saveResult?.message || 'Failed to save the font');
    }

    const { fonts } = await getGroupFonts(groupId);
    const finalFont = fonts.find((f: Font) => f.id === saveResult.font_id || f.hash === hash);
    if (!finalFont) {
      return { 
        font: { id: saveResult.font_id, name: file.name, hash: hash, download_url: downloadUrl, group_id: groupId } as Font, 
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
  const { data, error } = await supabase.rpc('manage_font_smart', {
    p_action: 'delete',
    p_font_id: fontId
  });

  if (error) throw error;
  return data;
};

export const updateFontName = async (fontId: string, newName: string) => {
  const { data, error } = await supabase.rpc('manage_font_smart', {
    p_action: 'update',
    p_font_id: fontId,
    p_name: newName
  });

  if (error) throw error;
  return data;
};

export const updateFontTags = async (fontId: string, tags: string[]) => {
  const { data, error } = await supabase.rpc('manage_font_smart', {
    p_action: 'update',
    p_font_id: fontId,
    p_metadata: { tags }
  });

  if (error) throw error;
  return data;
};

export const updateFontNote = async (
  fontId: string,
  note: string,
  existingMetadata: Record<string, any> = {}
) => {
  const trimmed = note.trim();
  if (trimmed.length > 100) {
    throw new Error('الملاحظة يجب ألا تتجاوز 100 حرف');
  }

  const updatedMetadata = { ...existingMetadata };
  if (trimmed) {
    updatedMetadata.note = trimmed;
  } else {
    delete updatedMetadata.note;
  }

  const { data, error } = await supabase.rpc('manage_font_smart', {
    p_action: 'update',
    p_font_id: fontId,
    p_metadata: updatedMetadata
  });

  if (error) throw error;
  return data;
};

export const getGroupFonts = async (
  groupId: string | null = null,
  sort: string = 'oldest',
  page: number = 1,
  itemsPerPage: number = 15
): Promise<{ fonts: Font[]; totalCount: number }> => {
  const { data, error } = await supabase.rpc('get_my_fonts', {
    p_group_id: groupId,
    p_sort: sort,
    p_limit: itemsPerPage,
    p_offset: (page - 1) * itemsPerPage
  });
  
  if (error) throw error;
  if (!data || data.length === 0) return { fonts: [], totalCount: 0 };
  
  const totalCount = Number(data[0].total_count) || 0;
  
  const mappedFonts = data.map((item: any) => {
    const fontTags = extractTags(item.metadata, item.tags);
    return {
      id: item.font_id,
      group_id: item.group_id,
      asset_id: item.asset_id,
      name: item.name,
      metadata: item.metadata ? { ...item.metadata, tags: fontTags } : { tags: fontTags },
      tags: fontTags,
      download_url: item.download_url,
      size: item.size,
      created_at: item.created_at,
      hash: item.font_hash
    };
  });

  const uniqueFonts = Array.from(new Map(mappedFonts.map((f: any) => [f.id, f])).values()) as Font[];
  return { fonts: uniqueFonts, totalCount };
};

const extractTags = (metadata: any, rawTags: any): string[] => {
  if (Array.isArray(rawTags)) {
    return rawTags.map((t: any) => String(t).trim()).filter(Boolean);
  }
  if (metadata && typeof metadata === 'object' && Array.isArray(metadata.tags)) {
    return metadata.tags.map((t: any) => String(t).trim()).filter(Boolean);
  }
  return [];
};

export const getPublicFonts = async (
  p_sort: string = 'newest',
  p_limit: number = 50,
  p_offset: number = 0
): Promise<{ fonts: Font[]; totalCount: number }> => {
  const { data, error } = await supabase.rpc('get_public_fonts', {
    p_sort,
    p_limit,
    p_offset,
  });
  
  if (error) throw error;
  if (!data || data.length === 0) return { fonts: [], totalCount: 0 };
  
  const totalCount = data[0].total_count || 0;
  
  const mappedFonts = data.map((item: any) => {
    const fontTags = extractTags(item.metadata, item.tags);
    return {
      id: item.font_id,
      name: item.font_name,
      download_url: item.download_url,
      size: item.size,
      created_at: item.created_at,
      metadata: item.metadata ? { ...item.metadata, tags: fontTags } : { tags: fontTags },
      tags: fontTags,
    };
  });

  const uniqueFonts = Array.from(new Map(mappedFonts.map((f: any) => [f.id, f])).values()) as Font[];
  return { fonts: uniqueFonts, totalCount };
};

export const uploadFontWeight = async (
  file: File,
  parentFontId: string,
  groupId: string | null,
  metadata: Record<string, any> = {}
): Promise<Font> => {
  try {
    const hash = await calculateFileHash(file);

    // 1. Prepare upload via RPC
    const { data: prepareResult, error: prepareError } = await supabase.rpc('prepare_font_upload', {
      p_name: file.name,
      p_hash: hash,
      p_group_id: groupId
    });

    if (prepareError) {
      if (prepareError.message?.includes('font_limit_reached') || (prepareError as any).details?.includes('font_limit_reached')) {
        throw new Error('font_limit_reached');
      }
      throw prepareError;
    }

    if (!prepareResult || prepareResult.success === false) {
      if (prepareResult?.message === 'font_limit_reached') {
        throw new Error('font_limit_reached');
      }
      throw new Error(prepareResult?.message || 'Failed to prepare font weight upload');
    }

    // 2. Upload file to storage bucket if required (isolated storage step with upsert: false)
    const fileExt = (file.name.split('.').pop() || 'ttf').toLowerCase();
    const fileName = `${hash}.${fileExt}`;

    if (prepareResult.needs_upload !== false) {
      const { error: uploadError } = await supabase.storage
        .from('fonts')
        .upload(fileName, file, {
          upsert: false
        });

      if (uploadError) {
        const isAlreadyExists =
          uploadError.message?.toLowerCase().includes('already exists') ||
          uploadError.message?.toLowerCase().includes('duplicate') ||
          (uploadError as any).statusCode === '409' ||
          (uploadError as any).error === 'Duplicate';

        if (!isAlreadyExists) {
          throw uploadError;
        }
      }
    }

    const { data: publicUrlData } = supabase.storage
      .from('fonts')
      .getPublicUrl(fileName);
    
    const downloadUrl = publicUrlData.publicUrl;

    // 3. Add weight directly via Database RPC
    const { data: saveResult, error: saveError } = await supabase.rpc('add_weight_directly', {
      p_parent_font_id: parentFontId,
      p_name: file.name,
      p_hash: hash,
      p_storage_path: fileName,
      p_download_url: downloadUrl,
      p_size: file.size,
      p_metadata: metadata
    });

    if (saveError) {
      if (saveError.message?.includes('font_limit_reached') || (saveError as any).details?.includes('font_limit_reached')) {
        throw new Error('font_limit_reached');
      }
      throw saveError;
    }
    if (!saveResult || saveResult.success === false) {
       if (saveResult?.message === 'font_limit_reached') {
         throw new Error('font_limit_reached');
       }
       throw new Error(saveResult?.message || 'Failed to add weight');
    }

    return { 
      id: saveResult.font_id || saveResult.child_font_id || '', 
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
  
  const mappedWeights: FontWeight[] = data.map((item: any) => {
    const fontTags = extractTags(item.metadata, item.tags);
    return {
      id: `${parentFontId}-${item.font_id}`,
      parent_font_id: parentFontId,
      child_font_id: item.font_id,
      created_at: new Date().toISOString(),
      child_font: {
        id: item.font_id,
        name: item.name,
        download_url: item.download_url,
        hash: item.font_hash,
        size: item.size,
        metadata: item.metadata ? { ...item.metadata, tags: fontTags } : { tags: fontTags },
        tags: fontTags,
        user_id: '',
        group_id: '',
        asset_id: '',
        created_at: ''
      }
    };
  });

  return Array.from(new Map(mappedWeights.map((w: FontWeight) => [w.id, w])).values());
};



export const getWeightRelationshipsForFonts = async (fontIds: string[]): Promise<{ parent_font_id: string }[]> => {
  if (!fontIds || fontIds.length === 0) return [];
  const { data, error } = await supabase.rpc('get_parent_font_ids', {
    p_font_ids: fontIds
  });
  if (error) return [];
  return data || [];
};



