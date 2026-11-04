import { supabase } from '../api/supabase'

export type Project = {
    id: string
    name: string
    address: string
    created_at: string
}

export type ProjectInput = {
    name: string
    address: string
}

export async function getProjects(): Promise<Project[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('id, name, address, created_at')
        .order('created_at', { ascending: false })

    if (error) throw error

    return data ?? []
}

export async function createProject(
    input: ProjectInput,
): Promise<void> {
    const { error } = await supabase.from('projects').insert({
        name: input.name.trim(),
        address: input.address.trim(),
    })

    if (error) throw error
}

export async function updateProject(
  projectId: string,
  input: ProjectInput,
): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .update({
      name: input.name.trim(),
      address: input.address.trim(),
    })
    .eq('id', projectId)
    .select('id, name, address, created_at')
    .single()

  if (error) throw error

  return data
}

export async function deleteProject(
  projectId: string,
): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .select('id')

  if (error) throw error

  if (!data?.length) {
    throw new Error('Объект удалён или недоступен')
  }
}