import { supabase } from '../lib/supabase';
import { Group } from '../types';

export const getGroups = async (): Promise<Group[]> => {
  const { data, error } = await supabase.rpc('get_my_groups');
  if (error) throw error;
  if (!data) return [];
  
  const mappedData: Group[] = data.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    description: item.description,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  // Deduplicate by id just in case the RPC returns duplicates
  return Array.from(new Map(mappedData.map((g: Group) => [g.id, g])).values());
};

export const updateGroup = async (groupId: string, updates: Partial<Group>) => {
  const { data: response, error } = await supabase.rpc('manage_group_smart', {
    p_group_id: groupId,
    p_action: 'update',
    p_name: updates.name,
    p_description: updates.description
  });

  if (error) throw error;
  if (response && response.success === false) {
    throw new Error(response.message || response.error || 'Failed to update group');
  }
  
  const privateGroups = await getGroups();
  return privateGroups.find((g: Group) => g.id === groupId);
};

export const deleteGroupSmart = async (groupId: string) => {
  const { data: response, error } = await supabase.rpc('manage_group_smart', {
    p_action: 'delete',
    p_group_id: groupId,
    p_name: null,
    p_description: null
  });

  if (error) throw error;
  if (response && response.success === false) {
    throw new Error(response.message || response.error || 'Failed to delete group');
  }
};

export const createGroupSmart = async (name: string, description: string) => {
  const { data: response, error } = await supabase.rpc('manage_group_smart', {
    p_group_id: null,
    p_action: 'create',
    p_name: name,
    p_description: description
  });

  if (error) throw error;
  if (!response || !response.success) throw new Error(response?.message || response?.error || 'Failed to create group');
  
  const privateGroups = await getGroups();
  if (response.group_id) {
    const found = privateGroups.find((g: Group) => g.id === response.group_id);
    if (found) return found;
  }
  return privateGroups.find((g: Group) => g.name === name) || privateGroups[0];
};
