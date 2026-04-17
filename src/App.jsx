import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Portal from './pages/Portal'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReset, setShowReset] = useState(false)

  const params = new URLSearchParams(window.location.search)
  const isRecovery = params.get('type') === 'recovery'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      // Show reset page for password recovery AND new user invites
      if (event === 'PASSWORD_RECOVERY') {
        setShowReset(true)
      }

      if (event === 'SIGNED_IN' && isRecovery) {
        setShowReset(true)
      }

      // Once they've updated their password, clear the reset state
      if (event === 'USER_UPDATED') {
        setShowReset(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [isRecovery])

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f' }} />
  if (showReset || (session && isRecovery)) return <ResetPassword />
  return session ? <Portal user={session.user} /> : <Login />
}