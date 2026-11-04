import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../api/supabase'

type AuthState =
  | { status: 'loading' }
  | { status: 'authenticated'; session: Session }
  | { status: 'anonymous' }
  | { status: 'error'; message: string }

function getSessionState(session: Session | null): AuthState {
  return session
    ? { status: 'authenticated', session }
    : { status: 'anonymous' }
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: 'loading',
  })

  useEffect(() => {
    let active = true
    let authEventReceived = false

    const { data } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        authEventReceived = true

        if (active) {
          setState(getSessionState(session))
        }
      },
    )

    async function restoreSession() {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (!active || authEventReceived) return
        if (error) throw error

        setState(getSessionState(data.session))
      } catch (error) {
        if (!active || authEventReceived) return

        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Не удалось восстановить сессию',
        })
      }
    }

    void restoreSession()

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  return state
}