import { useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Login() {
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
      redirectTo: `${window.location.origin}/?type=recovery`,
    })
    if (error) setError(error.message)
    else setResetSent(true)
    setLoading(false)
  }

  if (resetSent) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <span style={styles.logoText}>RIPZILLA</span>
            <span style={styles.logoSub}>Internal Portal</span>
          </div>
          <div style={styles.successBox}>
            <p style={styles.successTitle}>Check your email</p>
            <p style={styles.successMsg}>A password reset link has been sent to {email}</p>
          </div>
          <button onClick={() => { setResetSent(false); setForgotMode(false) }} style={styles.button}>
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoText}>RIPZILLA</span>
          <span style={styles.logoSub}>Internal Portal</span>
        </div>

        <form onSubmit={forgotMode ? handleForgot : handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@ripzillatcg.com"
              required
              style={styles.input}
            />
          </div>

          {!forgotMode && (
            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={styles.input}
              />
            </div>
          )}

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? '...' : forgotMode ? 'Send reset link' : 'Sign in'}
          </button>

          <button
            type="button"
            onClick={() => { setForgotMode(!forgotMode); setError('') }}
            style={styles.forgotBtn}
          >
            {forgotMode ? 'Back to login' : 'Forgot password?'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0f',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#13131a',
    border: '1px solid #2a2a3a',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '400px',
  },
  logo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '40px',
    gap: '6px',
  },
  logoText: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '6px',
    color: '#e8e8f0',
  },
  logoSub: {
    fontSize: '11px',
    letterSpacing: '3px',
    color: '#555570',
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    color: '#888899',
    letterSpacing: '0.5px',
  },
  input: {
    background: '#0d0d14',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '12px 14px',
    color: '#e8e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  error: {
    color: '#ff5555',
    fontSize: '13px',
    margin: '0',
    padding: '10px 14px',
    background: '#1a0d0d',
    borderRadius: '8px',
    border: '1px solid #3a1a1a',
  },
  button: {
    background: '#5c5cff',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '13px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.5px',
    cursor: 'pointer',
    marginTop: '4px',
  },
  forgotBtn: {
    background: 'transparent',
    border: 'none',
    color: '#555570',
    fontSize: '13px',
    cursor: 'pointer',
    textAlign: 'center',
    padding: '0',
  },
  successBox: {
    background: '#0d1a0d',
    border: '1px solid #1a3a1a',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  successTitle: {
    color: '#55cc55',
    fontWeight: '600',
    fontSize: '15px',
    marginBottom: '6px',
  },
  successMsg: {
    color: '#888899',
    fontSize: '13px',
  },
}
