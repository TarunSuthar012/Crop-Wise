import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearLocalSession, getLocalSession } from '../lib/supabase'
import { hasCompletedRegistration } from '../lib/registration'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const s = await getLocalSession()
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

  const signOut = useCallback(async () => {
    await clearLocalSession()
    setSession(null)
    setRegistrationComplete(false)
  }, [])

  const value = useMemo(
    () => ({ session, registrationComplete, loading, refresh, signOut }),
    [session, registrationComplete, loading, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
