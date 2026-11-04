import { useEffect, useState } from 'react'
import { getProfile } from './profile'
import type { Profile } from './profile'

type ProfileState =
  | { status: 'loading' }
  | { status: 'ready'; profile: Profile }
  | { status: 'missing' }
  | { status: 'error' }

export function useProfile(userId: string): ProfileState {
  const [state, setState] = useState<ProfileState>({
    status: 'loading',
  })

  useEffect(() => {
    let active = true

    setState({ status: 'loading' })

    async function loadProfile() {
      try {
        const profile = await getProfile(userId)

        if (!active) return

        setState(
          profile
            ? { status: 'ready', profile }
            : { status: 'missing' },
        )
      } catch {
        if (active) {
          setState({ status: 'error' })
        }
      }
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [userId])

  return state
}