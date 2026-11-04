import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Profile } from '../service/profile'
import { transitionTask } from '../service/tasks.api'
import type { Task, TaskStatus } from '../service/tasks.api'
import { getTaskActions } from '../service/taskPermissions'

type TaskActionsProps = {
  task: Task
  profile: Profile
  onChanged: () => void
}

export function TaskActions({
  task,
  profile,
  onChanged,
}: TaskActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showRevisionForm, setShowRevisionForm] = useState(false)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const actions = getTaskActions(task, profile)

  async function changeStatus(targetStatus: TaskStatus) {
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      await transitionTask({
        taskId: task.id,
        expectedStatus: task.status,
        targetStatus,
        comment: targetStatus === 'revision' ? comment : undefined,
      })
    } catch {
      setError(
        'Не удалось изменить статус. Возможно, задача уже изменена. Обновите карточку.',
      )
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setComment('')
    setShowRevisionForm(false)
    onChanged()
  }

  function handleRevisionSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!comment.trim()) return

    void changeStatus('revision')
  }

  if (actions.length === 0) return null

  return (
    <section>
      <h3>Действия</h3>

      <div className="task-actions">
        {actions.map((action) => (
          <button
            key={action.targetStatus}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (action.requiresComment) {
                setShowRevisionForm(true)
              } else {
                void changeStatus(action.targetStatus)
              }
            }}
          >
            {action.label}
          </button>
        ))}
      </div>

      {showRevisionForm && (
        <form onSubmit={handleRevisionSubmit}>
          <label htmlFor="revision-comment">
            Что нужно исправить?
          </label>

          <textarea
            id="revision-comment"
            required
            maxLength={2000}
            disabled={isSubmitting}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />

          <div className="task-actions">
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
            >
              {isSubmitting ? 'Сохранение…' : 'Подтвердить возврат'}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setShowRevisionForm(false)
                setComment('')
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      {error && (
        <div>
          <p role="alert">{error}</p>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onChanged}
          >
            Обновить карточку
          </button>
        </div>
      )}
    </section>
  )
}