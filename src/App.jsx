import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Portal from './pages/Portal'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReset, setShowReset] = useState(false)

  useEffect(() => {
    // Check if we flagged a recovery before the redirect
    const pendingReset = localStorage.getItem('pendingReset')

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (pendingReset && session) {
        setShowReset(true)
        localStorage.removeItem('pendingReset')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (event === 'PASSWORD_RECOVERY') {
        setShowReset(true)
      }

      // Invite or recovery link — flag it and let Supabase finish redirect
      if (event === 'SIGNED_IN') {
        const params = new URLSearchParams(window.location.search)
        if (params.get('type') === 'recovery') {
          setShowReset(true)
          localStorage.removeItem('pendingReset')
        } else if (localStorage.getItem('pendingReset')) {
          setShowReset(true)
          localStorage.removeItem('pendingReset')
        }
      }

      if (event === 'USER_UPDATED') {
        setShowReset(false)
      }
    })

    // If ?type=recovery is in URL, flag it before Supabase processes and redirects
    const params = new URLSearchParams(window.location.search)
    if (params.get('type') === 'recovery') {
      localStorage.setItem('pendingReset', 'true')
    }

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f' }} />
  if (showReset) return <ResetPassword />
  return session ? <Portal user={session.user} /> : <Login />
}