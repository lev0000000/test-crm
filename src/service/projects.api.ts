import { supabase } from '../api/supabase'

export type Project = {
  id: string
  name: string
  address: string
  created_at: string
}

export async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, address, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}