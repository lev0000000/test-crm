import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { getExecutors } from '../service/profile'
import type { Profile } from '../service/profile'
import { createTask, updateTask } from '../service/tasks.api'
import type { Task } from '../service/tasks.api'


type TaskFormProps = {
    projectId: string
    task?: Task
    onSaved: () => void
    onCancel: () => void
}

type ExecutorsState =
    | { status: 'loading' }
    | { status: 'ready'; items: Profile[] }
    | { status: 'error' }

export function TaskForm({
    projectId,
    task,
    onSaved,
    onCancel,
}: TaskFormProps) {
    const [title, setTitle] = useState(task?.title ?? '')
    const [description, setDescription] =
        useState(task?.description ?? '')
    const [assigneeId, setAssigneeId] =
        useState(task?.assignee_id ?? '')
    const [executors, setExecutors] = useState<ExecutorsState>({
        status: 'loading',
    })
    const [reloadKey, setReloadKey] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        setExecutors({ status: 'loading' })

        async function loadExecutors() {
            try {
                const items = await getExecutors()

                if (active) {
                    setExecutors({ status: 'ready', items })
                }
            } catch {
                if (active) {
                    setExecutors({ status: 'error' })
                }
            }
        }

        void loadExecutors()

        return () => {
            active = false
        }
    }, [reloadKey])

    const canSubmit =
        title.trim().length > 0 &&
        executors.status === 'ready' &&
        executors.items.some((person) => person.id === assigneeId)

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()

        if (isSubmitting || !canSubmit) return

        setIsSubmitting(true)
        setError(null)

        try {
            const input = {
                title,
                description,
                project_id: projectId,
                assignee_id: assigneeId,
            }

            if (task) {
                await updateTask(task.id, input)
            } else {
                await createTask(input)
            }
        } catch {
            setError('Не удалось создать задачу. Попробуйте ещё раз.')
            setIsSubmitting(false)
            return
        }

        onSaved()
    }

    return (
        <section>
            <h3>{task ? 'Редактирование задачи' : 'Новая задача'}</h3>
            <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
                <label htmlFor="task-title">Название</label>
                <input
                    id="task-title"
                    autoFocus
                    required
                    maxLength={200}
                    disabled={isSubmitting}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                />

                <label htmlFor="task-description">Описание</label>
                <textarea
                    id="task-description"
                    maxLength={10000}
                    disabled={isSubmitting}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                />

                {executors.status === 'loading' && (
                    <p role="status">Загружаем исполнителей…</p>
                )}

                {executors.status === 'error' && (
                    <div>
                        <p role="alert">Не удалось загрузить исполнителей.</p>
                        <button
                            type="button"
                            onClick={() => setReloadKey((key) => key + 1)}
                        >
                            Повторить
                        </button>
                    </div>
                )}

                {executors.status === 'ready' && (
                    executors.items.length === 0 ? (
                        <p>Нет исполнителей. Добавьте их профили в базе.</p>
                    ) : (
                        <>
                            <label htmlFor="task-assignee">Исполнитель</label>
                            <select
                                id="task-assignee"
                                required
                                disabled={isSubmitting}
                                value={assigneeId}
                                onChange={(event) => setAssigneeId(event.target.value)}
                            >
                                <option value="" disabled>
                                    Выберите исполнителя
                                </option>

                                {executors.items.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.display_name}
                                    </option>
                                ))}
                            </select>
                        </>
                    )
                )}

                {error && <p role="alert">{error}</p>}

                <div className="task-actions">
                    <button
                        type="submit"
                        disabled={isSubmitting || !canSubmit}
                    >
                        {isSubmitting
                            ? 'Сохранение…'
                            : task
                                ? 'Сохранить изменения'
                                : 'Создать задачу'}                    </button>

                    <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                </div>
            </form>
        </section>
    )
}