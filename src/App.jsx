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
    // Check hash fragment for invite/recovery token BEFORE Supabase processes it
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const tokenType = hashParams.get('type')

    if (tokenType === 'invite' || tokenType === 'recovery') {
      localStorage.setItem('pendingReset', 'true')
    }

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

      if (event === 'SIGNED_IN' && localStorage.getItem('pendingReset')) {
        setShowReset(true)
        localStorage.removeItem('pendingReset')
      }

      if (event === 'USER_UPDATED') {
        setShowReset(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f' }} />
  if (showReset) return <ResetPassword />
  return session ? <Portal user={session.user} /> : <Login />
}