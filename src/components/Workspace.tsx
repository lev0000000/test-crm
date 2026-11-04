import { useState } from 'react'
import { supabase } from '../api/supabase'
import { useProfile } from '../service/useProfile'
import { ProjectList } from './ProjectList'

type WorkspaceProps = {
    userId: string
}

export function Workspace({ userId }: WorkspaceProps) {
    const profileState = useProfile(userId)
    const [isSigningOut, setIsSigningOut] = useState(false)
    const [error, setError] = useState<string | null>(null)

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

                        <ProjectList />
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