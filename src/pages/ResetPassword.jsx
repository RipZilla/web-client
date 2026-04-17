import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

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

  if (success) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>
            <span style={styles.logoText}>RIPZILLA</span>
            <span style={styles.logoSub}>Internal Portal</span>
          </div>
          <div style={styles.successBox}>
            <p style={styles.successTitle}>Password set!</p>
            <p style={styles.successMsg}>You can now sign in with your new password.</p>
          </div>
          <a href="/" style={styles.button}>Go to login</a>
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

        <p style={styles.heading}>Set your password</p>

        <form onSubmit={handleReset} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Saving...' : 'Set password'}
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
    marginBottom: '32px',
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
  heading: {
    color: '#888899',
    fontSize: '13px',
    textAlign: 'center',
    marginBottom: '24px',
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
    display: 'block',
    textAlign: 'center',
    textDecoration: 'none',
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