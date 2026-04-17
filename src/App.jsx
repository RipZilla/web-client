import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Portal from './pages/Portal'
import ResetPassword from './pages/ResetPassword'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRecovery, setIsRecovery] = useState(false)

useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const isRecoveryUrl = params.get('type') === 'recovery'

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    setLoading(false)
    if (isRecoveryUrl && session) setIsRecovery(true)
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      setIsRecovery(true)
    } else if (!isRecoveryUrl) {
      setIsRecovery(false)
    }
    setSession(session)
  })

  return () => subscription.unsubscribe()
}, [])

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f' }} />
  if (isRecovery) return <ResetPassword />
  return session ? <Portal user={session.user} /> : <Login />
}
