import type { Profile } from './profile'
import type { Task, TaskStatus } from './tasks.api'

type TaskAction = {
  targetStatus: TaskStatus
  label: string
  requiresComment: boolean
}

export function getTaskActions(
  task: Task,
  profile: Profile,
): TaskAction[] {
  if (profile.role === 'manager') {
    if (task.status !== 'review') return []

    return [
      {
        targetStatus: 'accepted',
        label: 'Принять',
        requiresComment: false,
      },
      {
        targetStatus: 'revision',
        label: 'Вернуть на доработку',
        requiresComment: true,
      },
    ]
  }

  if (task.assignee_id !== profile.id) return []

  switch (task.status) {
    case 'new':
    case 'revision':
      return [
        {
          targetStatus: 'in_progress',
          label: 'Взять в работу',
          requiresComment: false,
        },
      ]

    case 'in_progress':
      return [
        {
          targetStatus: 'review',
          label: 'Отправить на проверку',
          requiresComment: false,
        },
      ]

    default:
      return []
  }
}