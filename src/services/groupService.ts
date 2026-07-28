import { supabase } from '../lib/supabase';
import { Group } from '../types';

void supabase;

// TODO: reconnect to Supabase (previously used: supabase.rpc('get_my_groups'))
export const getGroups = async (): Promise<Group[]> => {
  const cached = localStorage.getItem('fontat_disconnected_groups');
  if (cached) {
    try { return JSON.parse(cached); } catch(e) {}
  }
  const defaultGroups: Group[] = [
    {
      id: 'demo-group-1',
      user_id: 'demo-user',
      name: 'خطوط العناوين',
      description: 'مجموعة تجريبية لخطوط العناوين والملصقات',
      is_public: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  ];
  localStorage.setItem('fontat_disconnected_groups', JSON.stringify(defaultGroups));
  return defaultGroups;
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_group_smart', { p_action: 'update' }))
export const updateGroup = async (groupId: string, updates: Partial<Group>) => {
  const current = await getGroups();
  const updated = current.map(g => g.id === groupId ? { ...g, ...updates, updated_at: new Date().toISOString() } : g);
  localStorage.setItem('fontat_disconnected_groups', JSON.stringify(updated));
  return updated.find((g: Group) => g.id === groupId);
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_group_smart', { p_action: 'delete' }))
export const deleteGroupSmart = async (groupId: string) => {
  const current = await getGroups();
  const updated = current.filter(g => g.id !== groupId);
  localStorage.setItem('fontat_disconnected_groups', JSON.stringify(updated));
};

// TODO: reconnect to Supabase (previously used: supabase.rpc('manage_group_smart', { p_action: 'create' }))
export const createGroupSmart = async (name: string, description: string, isPublic: boolean) => {
  const current = await getGroups();
  const newGroup: Group = {
    id: `group-${Date.now()}`,
    user_id: 'demo-user',
    name,
    description,
    is_public: isPublic,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const updated = [newGroup, ...current];
  localStorage.setItem('fontat_disconnected_groups', JSON.stringify(updated));
  return newGroup;
};

