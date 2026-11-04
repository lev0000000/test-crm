import { supabase } from '../../lib/supabase'

export type TaskStatus =
  | 'new'
  | 'in_progress'
  | 'review'
  | 'accepted'
  | 'revision'

export type Task = {
  id: string
  title: string
  description: string
  project_id: string
  assignee_id: string
  status: TaskStatus
  author_id: string
  created_at: string
}

export const taskStatusLabels: Record<TaskStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  review: 'На проверке',
  accepted: 'Принята',
  revision: 'На доработке',
}

export async function getProjectTasks(
  projectId: string,
): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, title, description, project_id, assignee_id, status, author_id, created_at',
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}