import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from '../lib/auth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // user_metadata is embedded in the JWT — no network call needed
  function fetchProfile(userObj) {
    const meta = userObj.user_metadata || {}
    setProfile({
      id: userObj.id,
      name: meta.name || 'User',
      role: meta.role || 'member',
    })
    setLoading(false)
  }

  useEffect(() => {
    let mounted = true

    // Race getSession against an 8-second timeout so a paused/unreachable
    // Supabase project never leaves the app stuck on the loading screen.
    Promise.race([
      supabase.auth.getSession(),
      new Promise(resolve =>
        setTimeout(() => resolve({ data: { session: null } }), 8000)
      ),
    ]).then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user)
      } else {
        setLoading(false)
      }
    }).catch(err => {
      console.error('Session init error:', err)
      if (mounted) setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return
        if (event === 'INITIAL_SESSION') return

        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUp(email, password, name, role = 'member') {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, role } },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
