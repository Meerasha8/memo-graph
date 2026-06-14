import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        window.pendo.identify({
          visitor: {
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name
          }
        })
      } else if (event === 'SIGNED_OUT') {
        window.pendo.clearSession()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signInWithGoogle = () =>
    supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/books` } })

  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
