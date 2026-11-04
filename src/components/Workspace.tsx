import { useState } from 'react'
import { supabase } from '../api/supabase'
import { useProfile } from '../service/useProfile'
import { ProjectList } from './ProjectList'
import { ProjectDetails } from './ProjectDetails'
import type { Project } from '../service/projects.api'
import { MyTasks } from './MyTasks'

type WorkspaceProps = {
    userId: string
}

export function Workspace({ userId }: WorkspaceProps) {
    const profileState = useProfile(userId)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedProject, setSelectedProject] =
        useState<Project | null>(null)
    const [view, setView] = useState<'projects' | 'my-tasks'>(
        'projects',
    )
    async function handleSignOut() {
        if (isSigningOut) return

        setIsSigningOut(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch {
            setError('Не удалось выйти. Попробуйте ещё раз.')
        } finally {
            setIsSigningOut(false)
        }
    }

    function renderContent() {
        switch (profileState.status) {
            case 'loading':
                return <p role="status">Загружаем профиль…</p>

            case 'missing':
                return (
                    <p>
                        Профиль не создан. Обратитесь к администратору.
                    </p>
                )

            case 'error':
                return (
                    <div>
                        <p role="alert">Не удалось загрузить профиль.</p>
                        <button onClick={() => window.location.reload()}>
                            Повторить
                        </button>
                    </div>
                )

            case 'ready': {
                const { profile } = profileState

                return (
                    <>
                        <section>
                            <h2>{profile.display_name}</h2>
                            <p>
                                Роль:{' '}
                                {profile.role === 'manager'
                                    ? 'Постановщик'
                                    : 'Исполнитель'}
                            </p>
                        </section>

                        <nav className="workspace-nav" aria-label="Разделы CRM">
                            <button
                                type="button"
                                aria-pressed={view === 'projects'}
                                onClick={() => {
                                    setSelectedProject(null)
                                    setView('projects')
                                }}
                            >
                                Объекты
                            </button>

                            {profile.role === 'executor' && (
                                <button
                                    type="button"
                                    aria-pressed={view === 'my-tasks'}
                                    onClick={() => {
                                        setSelectedProject(null)
                                        setView('my-tasks')
                                    }}
                                >
                                    Мои задачи
                                </button>
                            )}
                        </nav>

                        {view === 'my-tasks' ? (
                            <MyTasks profile={profile} />
                        ) : selectedProject ? (
                            <ProjectDetails
                                key={selectedProject.id}
                                project={selectedProject}
                                profile={profile}
                                onBack={() => setSelectedProject(null)}
                                onProjectUpdated={setSelectedProject}
                            />
                        ) : (
                            <ProjectList
                                profile={profile}
                                onSelectProject={setSelectedProject}
                            />
                        )}
                    </>
                )
            }
        }
    }

    return (
        <main>
            <header>
                <h1>Объекты и задачи</h1>

                <button
                    type="button"
                    disabled={isSigningOut}
                    onClick={handleSignOut}
                >
                    {isSigningOut ? 'Выходим…' : 'Выйти'}
                </button>
            </header>

            {error && <p role="alert">{error}</p>}

            {renderContent()}
        </main>
    )
}