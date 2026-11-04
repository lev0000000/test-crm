import { useEffect, useState } from 'react'
import type { Project } from '../service/projects.api'
import {
    getProjectTasks,
    taskStatusLabels,
} from '../service/tasks.api'
import type { Task } from '../service/tasks.api'
import { TaskDetails } from './TaskDetails'
import type { Profile } from '../service/profile'
import { ProjectActions } from './ProjectActions'
import { TaskForm } from './TaskForm'
type TasksState =
    | { status: 'loading' }
    | { status: 'ready'; tasks: Task[] }
    | { status: 'error' }


type ProjectDetailsProps = {
    project: Project
    profile: Profile
    onBack: () => void
    onProjectUpdated: (project: Project) => void
}

export function ProjectDetails({
    project,
    profile,
    onBack,
    onProjectUpdated,
}: ProjectDetailsProps) {
    const [state, setState] = useState<TasksState>({
        status: 'loading',
    })
    const [reloadKey, setReloadKey] = useState(0)
    const [selectedTaskId, setSelectedTaskId] =
        useState<string | null>(null)
    const [showTaskForm, setShowTaskForm] = useState(false)

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

            {profile.role === 'manager' && (
                <ProjectActions
                    project={project}
                    onUpdated={onProjectUpdated}
                    onDeleted={onBack}
                />
            )}

            <h3>Задачи объекта</h3>

            {profile.role === 'manager' && (
                showTaskForm ? (
                    <TaskForm
                        projectId={project.id}
                        onCancel={() => setShowTaskForm(false)}
                        onSaved={() => {
                            setShowTaskForm(false)
                            setReloadKey((key) => key + 1)
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowTaskForm(true)}
                    >
                        Новая задача
                    </button>
                )
            )}

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