import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Icon, Logo, Alert, Field, Spinner } from '../components/ui'

export default function Login({ notice = '' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleForgot = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  return (
    <div className="auth">
      <div className="grain" />
      <div className="glow-gold" />

      <div className="auth-in">
        <div className="rv d1"><Logo large sub="Internal Portal" /></div>

        <div className="auth-card rv d2">
          {resetSent ? (
            <>
              <div className="auth-note">
                <span className="ic">{Icon.mail(17)}</span>
                <div>
                  <b>Check your email</b>
                  <span>A password reset link is on its way to {email}.</span>
                </div>
              </div>
              <button
                className="btn btn-ghost btn-block"
                onClick={() => { setResetSent(false); setForgotMode(false); setPassword('') }}
              >
                {Icon.arrowLeft(14)} Back to sign in
              </button>
            </>
          ) : (
            <>
              <h1 className="auth-title">
                {forgotMode ? 'Reset your password' : 'Sign in'}
              </h1>
              <p className="auth-sub">
                {forgotMode
                  ? 'Enter your work email and we will send you a link to set a new password.'
                  : 'Use your Ripzilla account to reach the tools and stream schedule.'}
              </p>

              <form className="auth-form" onSubmit={forgotMode ? handleForgot : handleLogin}>
                <Field label="Email">
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@ripzillatcg.com"
                    autoComplete="username"
                    required
                  />
                </Field>

                {!forgotMode && (
                  <Field label="Password">
                    <input
                      className="input"
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      required
                    />
                  </Field>
                )}

                {notice && !error && <Alert kind="note">{notice}</Alert>}
              {error && <Alert kind="error">{error}</Alert>}

                <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                  {loading
                    ? <><Spinner /> Working…</>
                    : forgotMode
                      ? <>Send reset link {Icon.mail(15)}</>
                      : <>Sign in <span className="arr">{Icon.arrowRight(15)}</span></>}
                </button>

                <button
                  type="button"
                  className="auth-alt"
                  onClick={() => { setForgotMode(!forgotMode); setError('') }}
                >
                  {forgotMode ? 'Back to sign in' : 'Forgot password?'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="auth-foot rv d3">Ripzilla TCG · Authorized access only</p>
      </div>
    </div>
  )
}
