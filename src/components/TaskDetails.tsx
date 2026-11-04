import { useEffect, useState } from 'react'
import { getProfile } from '../service/profile'
import {
  getTask,
  getTaskHistory,
  taskStatusLabels,
} from '../service/tasks.api'
import type { Task, TaskHistoryEntry } from '../service/tasks.api'
import { TaskHistory } from './TaskHistory'

type TaskDetailsProps = {
  taskId: string
  onBack: () => void
}

type TaskDetailsState =
  | { status: 'loading' }
  | {
      status: 'ready'
      task: Task
      history: TaskHistoryEntry[]
      assigneeName: string
      authorName: string
    }
  | { status: 'error' }

export function TaskDetails({
  taskId,
  onBack,
}: TaskDetailsProps) {
  const [state, setState] = useState<TaskDetailsState>({
    status: 'loading',
  })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    setState({ status: 'loading' })

    async function loadDetails() {
      try {
        const [task, history] = await Promise.all([
          getTask(taskId),
          getTaskHistory(taskId),
        ])

        const [assignee, author] = await Promise.all([
          getProfile(task.assignee_id),
          getProfile(task.author_id),
        ])

        if (active) {
          setState({
            status: 'ready',
            task,
            history,
            assigneeName: assignee?.display_name ?? 'Не указан',
            authorName: author?.display_name ?? 'Не указан',
          })
        }
      } catch {
        if (active) {
          setState({ status: 'error' })
        }
      }
    }

    void loadDetails()

    return () => {
      active = false
    }
  }, [taskId, reloadKey])

  return (
    <section>
      <button type="button" onClick={onBack}>
        ← К задачам объекта
      </button>

      {state.status === 'loading' && (
        <p role="status">Загружаем задачу…</p>
      )}

      {state.status === 'error' && (
        <div>
          <p role="alert">
            Не удалось загрузить задачу. Возможно, она удалена
            или у вас больше нет доступа.
          </p>

          <button onClick={() => setReloadKey((key) => key + 1)}>
            Повторить
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <>
          <h2>{state.task.title}</h2>

          <p className="task-description">
            {state.task.description || 'Описание не добавлено.'}
          </p>

          <dl className="task-fields">
            <dt>Статус</dt>
            <dd>{taskStatusLabels[state.task.status]}</dd>

            <dt>Исполнитель</dt>
            <dd>{state.assigneeName}</dd>

            <dt>Автор</dt>
            <dd>{state.authorName}</dd>

            <dt>Дата создания</dt>
            <dd>
              {new Date(state.task.created_at).toLocaleString('ru-RU')}
            </dd>
          </dl>

          <TaskHistory entries={state.history} />
        </>
      )}
    </section>
  )
}