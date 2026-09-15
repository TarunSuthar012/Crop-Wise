import { useState, useEffect, useCallback } from 'react'
import { getLocalSession, clearLocalSession } from '../lib/supabase'
import { hasCompletedRegistration } from '../lib/registration'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const s = getLocalSession()
    setSession(s)
    if (s?.id) {
      const complete = await hasCompletedRegistration(s.id)
      setRegistrationComplete(complete)
    } else {
      setRegistrationComplete(false)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  function signOut() {
    clearLocalSession()
    setSession(null)
    setRegistrationComplete(false)
  }

  return { session, registrationComplete, loading, refresh, signOut }
}
