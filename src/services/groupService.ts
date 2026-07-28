import { supabase } from '../lib/supabase';
import { Group } from '../types';

export const getGroups = async (): Promise<Group[]> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return [];
  }

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  const mappedData: Group[] = data.map((item: any) => ({
    id: item.id,
    user_id: item.user_id,
    name: item.name,
    description: item.description,
    is_public: item.is_public,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }));

  return Array.from(new Map(mappedData.map((g: Group) => [g.id, g])).values());
};

export const updateGroup = async (groupId: string, updates: Partial<Group>) => {
  const { data, error } = await supabase.rpc('manage_group_smart', {
    p_action: 'update',
    p_group_id: groupId,
    p_name: updates.name,
    p_description: updates.description
  });

  if (error) throw error;
  if (!data || !data.success) throw new Error(data?.message || 'Failed to update group');

  const groups = await getGroups();
  return groups.find((g: Group) => g.id === groupId);
};

export const deleteGroupSmart = async (groupId: string) => {
  const { data, error } = await supabase.rpc('manage_group_smart', {
    p_action: 'delete',
    p_group_id: groupId
  });

  if (error) throw error;
  if (!data || !data.success) throw new Error(data?.message || 'Failed to delete group');
};

export const createGroupSmart = async (name: string, description: string, _isPublic?: boolean) => {
  const { data, error } = await supabase.rpc('manage_group_smart', {
    p_action: 'create',
    p_name: name,
    p_description: description
  });

  if (error) throw error;
  if (!data || !data.success) throw new Error(data?.message || 'Failed to create group');

  const groups = await getGroups();
  return groups.find((g: Group) => g.name === name) || groups[0];
};


