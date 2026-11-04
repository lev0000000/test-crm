import { useEffect, useState } from 'react'
import type { Profile } from '../service/profile'
import { getMyTasks, taskStatusLabels } from '../service/tasks.api'
import type { Task } from '../service/tasks.api'
import { TaskDetails } from './TaskDetails'

type MyTasksProps = {
  profile: Profile
}

type MyTasksState =
  | { status: 'loading' }
  | { status: 'ready'; tasks: Task[] }
  | { status: 'error' }

export function MyTasks({ profile }: MyTasksProps) {
  const [state, setState] = useState<MyTasksState>({
    status: 'loading',
  })
  const [selectedTaskId, setSelectedTaskId] =
    useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    setState({ status: 'loading' })

    async function loadTasks() {
      try {
        const tasks = await getMyTasks(profile.id)

        if (active) {
          setState({ status: 'ready', tasks })
        }
      } catch {
        if (active) {
          setState({ status: 'error' })
        }
      }
    }

    void loadTasks()

    return () => {
      active = false
    }
  }, [profile.id, reloadKey])

  if (selectedTaskId) {
    return (
      <TaskDetails
        key={selectedTaskId}
        taskId={selectedTaskId}
        profile={profile}
        onBack={() => {
          setSelectedTaskId(null)
          setReloadKey((key) => key + 1)
        }}
      />
    )
  }

  return (
    <section>
      <h2>Мои задачи</h2>

      {state.status === 'loading' && (
        <p role="status">Загружаем задачи…</p>
      )}

      {state.status === 'error' && (
        <div>
          <p role="alert">Не удалось загрузить задачи.</p>
          <button onClick={() => setReloadKey((key) => key + 1)}>
            Повторить
          </button>
        </div>
      )}

      {state.status === 'ready' &&
        (state.tasks.length === 0 ? (
          <p>Вам пока не назначены задачи.</p>
        ) : (
          <ul className="task-list">
            {state.tasks.map((task) => (
              <li key={task.id} className="task-card">
                <h3>{task.title}</h3>
                <p>{taskStatusLabels[task.status]}</p>

                <button
                  type="button"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  Открыть задачу
                </button>
              </li>
            ))}
          </ul>
        ))}
    </section>
  )
}