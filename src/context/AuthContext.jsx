import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { getProfile } from '../lib/api'
import { isSupabaseConfigured, supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)
  const mountedRef = useRef(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) {
      if (mountedRef.current) {
        setProfile(null)
        setProfileError(null)
      }
      return null
    }

    try {
      const nextProfile = await getProfile(userId)
      if (mountedRef.current) {
        setProfile(nextProfile)
        setProfileError(null)
      }
      return nextProfile
    } catch (error) {
      if (mountedRef.current) {
        setProfile(null)
        setProfileError(error instanceof Error ? error.message : 'Unable to load your profile.')
      }
      return null
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    let ignore = false

    if (!isSupabaseConfigured) {
      setLoading(false)
      setProfileError('Supabase is not configured. Add the public Supabase key to your .env file.')
      return () => { ignore = true; mountedRef.current = false }
    }

    const bootstrap = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (ignore) return
        if (error) throw error
        setSession(data.session ?? null)
        if (data.session?.user) await loadProfile(data.session.user.id)
      } catch (error) {
        if (!ignore) {
          setSession(null)
          setProfile(null)
          setProfileError(error instanceof Error ? error.message : 'Unable to restore your session.')
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    bootstrap()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (ignore) return

      setSession(nextSession ?? null)
      setProfileError(null)
      setLoading(Boolean(nextSession?.user))

      // Supabase recommends keeping the auth listener callback synchronous.
      // Defer profile I/O until after the auth event finishes.
      window.setTimeout(() => {
        if (ignore) return
        if (nextSession?.user) {
          loadProfile(nextSession.user.id).finally(() => {
            if (mountedRef.current) setLoading(false)
          })
        } else {
          setProfile(null)
          setProfileError(null)
          setLoading(false)
        }
      }, 0)

      if (event === 'SIGNED_OUT') {
        setProfile(null)
        setProfileError(null)
      }
    })

    return () => {
      ignore = true
      mountedRef.current = false
      authListener.subscription.unsubscribe()
    }
  }, [loadProfile])

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) return null
    return loadProfile(session.user.id)
  }, [loadProfile, session?.user?.id])

  const signOut = useCallback(async () => {
    return supabase.auth.signOut()
  }, [])

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    profileError,
    isAdmin: profile?.role === 'admin',
    hasAccess: profile?.role === 'admin' || profile?.payment_status === 'approved',
    refreshProfile,
    signOut,
  }), [session, profile, loading, profileError, refreshProfile, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
