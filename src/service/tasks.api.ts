import { supabase } from '../api/supabase'

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

export type TaskHistoryEntry = {
  id: string
  task_id: string
  actor_id: string
  actor_name: string
  from_status: TaskStatus | null
  to_status: TaskStatus
  comment: string | null
  created_at: string
}

type TransitionTaskParams = {
  taskId: string
  expectedStatus: TaskStatus
  targetStatus: TaskStatus
  comment?: string
}

export type TaskInput = {
  title: string
  description: string
  project_id: string
  assignee_id: string
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

export async function getTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select(
      'id, title, description, project_id, assignee_id, status, author_id, created_at',
    )
    .eq('id', taskId)
    .single()

  if (error) throw error

  return data
}

export async function getTaskHistory(
  taskId: string,
): Promise<TaskHistoryEntry[]> {
  const { data, error } = await supabase
    .from('task_history')
    .select(
      'id, task_id, actor_id, actor_name, from_status, to_status, comment, created_at',
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data ?? []
}

export async function transitionTask({
  taskId,
  expectedStatus,
  targetStatus,
  comment,
}: TransitionTaskParams): Promise<void> {
  const { error } = await supabase.rpc('transition_task', {
    p_task_id: taskId,
    p_expected: expectedStatus,
    p_target: targetStatus,
    p_comment: comment?.trim() || null,
  })

  if (error) throw error
}

export async function createTask(input: TaskInput): Promise<void> {
  const { error } = await supabase.from('tasks').insert({
    title: input.title.trim(),
    description: input.description.trim(),
    project_id: input.project_id,
    assignee_id: input.assignee_id,
  })

  if (error) throw error
}