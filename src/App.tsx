import { Workspace } from './components/Workspace'
import { LoginForm } from './components/auth/LoginForm'
import { useAuth } from './service/useAuth'

export default function App() {
  const auth = useAuth()

  switch (auth.status) {
    case 'loading':
      return <main role="status">Загрузка…</main>

    case 'error':
      return (
        <main>
          <h1>Не удалось загрузить приложение</h1>
          <p role="alert">{auth.message}</p>
          <button onClick={() => window.location.reload()}>
            Повторить
          </button>
        </main>
      )

    case 'anonymous':
      return <LoginForm />

    case 'authenticated':
      return (
        <Workspace
          key={auth.session.user.id}
          email={auth.session.user.email ?? ''}
        />
      )
  }
}