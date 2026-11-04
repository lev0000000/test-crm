import { useEffect, useState } from 'react'
import { getProjects } from '../service/projects.api'
import type { Project } from '../service/projects.api'

type ProjectListProps = {
    onSelectProject: (project: Project) => void
}

type ProjectsState =
    | { status: 'loading' }
    | { status: 'ready'; projects: Project[] }
    | { status: 'error' }

export function ProjectList({
    onSelectProject,
}: ProjectListProps) {
    const [state, setState] = useState<ProjectsState>({
        status: 'loading',
    })
    const [reloadKey, setReloadKey] = useState(0)

    useEffect(() => {
        let active = true

        setState({ status: 'loading' })

        async function loadProjects() {
            try {
                const projects = await getProjects()

                if (active) {
                    setState({ status: 'ready', projects })
                }
            } catch {
                if (active) {
                    setState({ status: 'error' })
                }
            }
        }

        void loadProjects()

        return () => {
            active = false
        }
    }, [reloadKey])

    if (state.status === 'loading') {
        return <p role="status">Загружаем объекты…</p>
    }

    if (state.status === 'error') {
        return (
            <section>
                <p role="alert">Не удалось загрузить объекты.</p>
                <button onClick={() => setReloadKey((key) => key + 1)}>
                    Повторить
                </button>
            </section>
        )
    }

    return (
        <section>
            <h2>Объекты</h2>

            {state.projects.length === 0 ? (
                <p>Доступных объектов пока нет.</p>
            ) : (
                <ul className="project-list">
                    {state.projects.map((project) => (
                        <li key={project.id} className="project-card">
                            <h3>{project.name}</h3>
                            <p>{project.address}</p>

                            <button
                                type="button"
                                onClick={() => onSelectProject(project)}
                            >
                                Открыть объект
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}