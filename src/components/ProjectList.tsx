import { useEffect, useState } from 'react'
import { getProjects } from '../service/projects.api'
import type { Project } from '../service/projects.api'
import type { Profile } from '../service/profile'
import { ProjectForm } from './ProjectForm'

type ProjectsState =
    | { status: 'loading' }
    | { status: 'ready'; projects: Project[] }
    | { status: 'error' }

type ProjectListProps = {
    profile: Profile
    onSelectProject: (project: Project) => void
}

export function ProjectList({
    profile,
    onSelectProject,
}: ProjectListProps) {
    const [state, setState] = useState<ProjectsState>({
        status: 'loading',
    })
    const [reloadKey, setReloadKey] = useState(0)
    const [showCreateForm, setShowCreateForm] = useState(false)
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

            {profile.role === 'manager' && (
                showCreateForm ? (
                    <ProjectForm
                        onCancel={() => setShowCreateForm(false)}
                        onSaved={() => {
                            setShowCreateForm(false)
                            setReloadKey((key) => key + 1)
                        }}
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setShowCreateForm(true)}
                    >
                        Новый объект
                    </button>
                )
            )}

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