import { useState } from 'react'
import { deleteTask } from '../service/tasks.api'
import type { Task } from '../service/tasks.api'
import { TaskForm } from './TaskForm'

type TaskManagementProps = {
  task: Task
  onUpdated: () => void
  onDeleted: () => void
}

export function TaskManagement({
  task,
  onUpdated,
  onDeleted,
}: TaskManagementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (isDeleting) return

    const confirmed = window.confirm(
      `Удалить задачу «${task.title}» вместе с историей?`,
    )

    if (!confirmed) return

    setIsDeleting(true)
    setError(null)

    try {
      await deleteTask(task.id)
    } catch {
      setError('Не удалось удалить задачу.')
      setIsDeleting(false)
      return
    }

    onDeleted()
  }

  if (isEditing) {
    return (
      <TaskForm
        task={task}
        projectId={task.project_id}
        onCancel={() => setIsEditing(false)}
        onSaved={() => {
          setIsEditing(false)
          onUpdated()
        }}
      />
    )
  }

  return (
    <section>
      <div className="task-actions">
        <button
          type="button"
          disabled={isDeleting}
          onClick={() => {
            setError(null)
            setIsEditing(true)
          }}
        >
          Изменить задачу
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={handleDelete}
        >
          {isDeleting ? 'Удаление…' : 'Удалить задачу'}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}
    </section>
  )
}