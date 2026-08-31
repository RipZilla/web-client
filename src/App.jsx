import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'
import Login from './pages/Login'
import Portal from './pages/Portal'
import ResetPassword from './pages/ResetPassword'
import { Icon } from './components/ui'
import {
  beginSession, endSession, inspectSession,
  startSessionGuard, extendSession,
} from './lib/session'
import { loadCategory, applyCategoryTheme } from './lib/categories'

const EXPIRY_COPY = {
  idle:     'You were signed out after 8 hours of inactivity.',
  absolute: 'You were signed out because sessions expire 24 hours after sign-in.',
  unknown:  'Your previous session could not be verified, so it was ended.',
}

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showReset, setShowReset] = useState(false)
  const [notice, setNotice] = useState('')
  const [warnMs, setWarnMs] = useState(null)

  // Paint the remembered category before first render so there's no flash.
  useEffect(() => { applyCategoryTheme(loadCategory()) }, [])

  const forceSignOut = useCallback(async (reason) => {
    setNotice(EXPIRY_COPY[reason] || EXPIRY_COPY.unknown)
    setWarnMs(null)
    endSession()
    await supabase.auth.signOut()
  }, [])

  useEffect(() => {
    // Check hash fragment for invite/recovery token BEFORE Supabase processes it
    const hash = window.location.hash
    const hashParams = new URLSearchParams(hash.replace('#', ''))
    const tokenType = hashParams.get('type')

    if (tokenType === 'invite' || tokenType === 'recovery') {
      localStorage.setItem('pendingReset', 'true')
    }

    const pendingReset = localStorage.getItem('pendingReset')

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      // A restored session is only trusted if it is still inside both limits.
      // This is what catches "I came back days later and was still logged in".
      if (session) {
        const state = inspectSession()
        if (state.status !== 'ok') {
          await forceSignOut(state.status === 'expired' ? state.reason : 'unknown')
          setLoading(false)
          return
        }
      }

      setSession(session)
      setLoading(false)
      if (pendingReset && session) {
        setShowReset(true)
        localStorage.removeItem('pendingReset')
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)

      if (event === 'SIGNED_IN') {
        // Stamp a fresh session window; clears any lingering expiry notice.
        beginSession()
        setNotice('')
      }
      if (event === 'SIGNED_OUT') endSession()

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
  }, [forceSignOut])

  // Run the idle / absolute guard only while actually signed in.
  useEffect(() => {
    if (!session || showReset) return
    return startSessionGuard({
      onWarn:   ms => setWarnMs(ms),
      onClear:  () => setWarnMs(null),
      onExpire: reason => forceSignOut(reason),
    })
  }, [session, showReset, forceSignOut])

  const staySignedIn = () => {
    extendSession()
    setWarnMs(null)
  }

  if (loading) {
    return (
      <div className="auth">
        <div className="grain" />
        <div className="glow-gold" />
        <div className="auth-in" style={{ display: 'flex', justifyContent: 'center' }}>
          <div className="logo-mark lg" style={{ opacity: 0.5 }} />
        </div>
      </div>
    )
  }

  if (showReset) return <ResetPassword />
  if (!session) return <Login notice={notice} />

  const seconds = warnMs === null ? 0 : Math.max(0, Math.ceil(warnMs / 1000))

  return (
    <>
      <Portal user={session.user} />

      {warnMs !== null && (
        <div className="modal-scrim">
          <div className="modal" role="alertdialog" aria-modal="true" style={{ maxWidth: 400 }}>
            <div className="warn-body">
              <div className="warn-icon">{Icon.clock(24)}</div>
              <h2 className="h2" style={{ marginBottom: 8 }}>Still there?</h2>
              <p className="warn-count">
                {String(Math.floor(seconds / 60)).padStart(2, '0')}:
                {String(seconds % 60).padStart(2, '0')}
              </p>
              <p>You'll be signed out automatically when this reaches zero.</p>
            </div>
            <div className="modal-foot" style={{ paddingTop: 22 }}>
              <button className="btn btn-primary btn-block" onClick={staySignedIn}>
                Stay signed in
              </button>
              <button className="btn btn-ghost" onClick={() => forceSignOut('idle')}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
