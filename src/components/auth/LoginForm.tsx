import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../../api/supabase'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) throw error

      setPassword('')
    } catch {
      setError('Не удалось войти. Проверьте данные и подключение.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main>
      <h1>Вход в CRM</h1>

      <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          disabled={isSubmitting}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        {error && <p role="alert">{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Входим…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}