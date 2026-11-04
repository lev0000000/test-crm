import { supabase } from '../api/supabase'

export type Profile = {
  id: string
  display_name: string
  role: 'manager' | 'executor'
}

export async function getProfile(
  userId: string,
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error

  return data
}

export async function getExecutors(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('role', 'executor')
    .order('display_name')

  if (error) throw error

  return data ?? []
}