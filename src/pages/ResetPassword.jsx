import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { Icon, Logo, Alert, Field, Spinner } from '../components/ui'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  // Don't wait for PASSWORD_RECOVERY event — if we're on this page
  // the user came from the reset link, just show the form immediately
  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      // Sign out so they log in fresh with new password
      await supabase.auth.signOut()
    }
    setLoading(false)
  }

  return (
    <div className="auth">
      <div className="grain" />
      <div className="glow-gold" />

      <div className="auth-in">
        <div className="rv d1"><Logo large sub="Internal Portal" /></div>

        <div className="auth-card rv d2">
          {success ? (
            <>
              <div className="auth-note">
                <span className="ic">{Icon.checkCircle(17)}</span>
                <div>
                  <b>Password set</b>
                  <span>You can now sign in with your new password.</span>
                </div>
              </div>
              <a className="btn btn-primary btn-block" href="/">
                Go to sign in <span className="arr">{Icon.arrowRight(15)}</span>
              </a>
            </>
          ) : (
            <>
              <h1 className="auth-title">Set your password</h1>
              <p className="auth-sub">
                Choose a password of at least 6 characters. You'll use it every time you sign in.
              </p>

              <form className="auth-form" onSubmit={handleReset}>
                <Field label="New password">
                  <input
                    className="input"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </Field>

                <Field label="Confirm password">
                  <input
                    className="input"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    required
                  />
                </Field>

                {error && <Alert kind="error">{error}</Alert>}

                <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
                  {loading
                    ? <><Spinner /> Saving…</>
                    : <>Set password {Icon.lock(15)}</>}
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
