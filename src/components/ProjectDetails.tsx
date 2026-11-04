import { useEffect, useState } from 'react'
import type { Project } from '../service/projects.api'
import {
    getProjectTasks,
    taskStatusLabels,
} from '../service/tasks.api'
import type { Task } from '../service/tasks.api'
import { TaskDetails } from './TaskDetails'
import type { Profile } from '../service/profile'


type TasksState =
    | { status: 'loading' }
    | { status: 'ready'; tasks: Task[] }
    | { status: 'error' }


type ProjectDetailsProps = {
  project: Project
  profile: Profile
  onBack: () => void
}

export function ProjectDetails({
  project,
  profile,
  onBack,
}: ProjectDetailsProps) {
    const [state, setState] = useState<TasksState>({
        status: 'loading',
    })
    const [reloadKey, setReloadKey] = useState(0)
    const [selectedTaskId, setSelectedTaskId] =
        useState<string | null>(null)
    useEffect(() => {
        let active = true

        setState({ status: 'loading' })

        async function loadTasks() {
            try {
                const tasks = await getProjectTasks(project.id)

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
    }, [project.id, reloadKey])

    if (selectedTaskId) {
        return (
            <TaskDetails
                key={selectedTaskId}
                taskId={selectedTaskId}
                onBack={() => {
                    setSelectedTaskId(null)
                    setReloadKey((key) => key + 1)
                }}
                profile={profile}
            />
        )
    }

    return (
        <section>
            <button type="button" onClick={onBack}>
                ← Все объекты
            </button>

            <h2>{project.name}</h2>
            <p>{project.address}</p>

            <h3>Задачи объекта</h3>

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
                    <p>Доступных задач пока нет.</p>
                ) : (
                    <ul className="task-list">
                        {state.tasks.map((task) => (
                            <li key={task.id} className="task-card">
                                <h4>{task.title}</h4>
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