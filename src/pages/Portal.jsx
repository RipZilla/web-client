import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import BreakReport from '../components/BreakReport'
import CardSetManager from '../components/CardSetManager'

const API_URL = import.meta.env.VITE_API_URL

const TOOLS = [
  {
    id: 'break-report',
    title: 'Break Report',
    sub: 'Select two card sets and upload your Whatnot CSV to generate a formatted Excel report.',
    tag: 'Report generator',
    accentColor: '#5c5cff',
    iconBg: '#0f0f28',
    tagBg: '#0f0f28',
    tagColor: '#5c5cff',
    icon: (
      <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
        <path d="M3 6h16M3 10h10M3 14h12" stroke="#5c5cff" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="17" cy="14" r="4" fill="#5c5cff" opacity="0.2" stroke="#5c5cff" strokeWidth="1.4"/>
        <path d="M15.5 14l1 1 2-2" stroke="#5c5cff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'card-sets',
    title: 'Card Set Manager',
    sub: 'Generate card set tables from raw data or upload existing sets to the server.',
    tag: 'Set management',
    accentColor: '#1d9e75',
    iconBg: '#0a1a14',
    tagBg: '#0a1a14',
    tagColor: '#1d9e75',
    icon: (
      <svg width="28" height="28" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="4" width="12" height="16" rx="2" fill="#1d9e75" opacity="0.2" stroke="#1d9e75" strokeWidth="1.4"/>
        <rect x="8" y="2" width="12" height="16" rx="2" fill="#1d9e75" opacity="0.1" stroke="#1d9e75" strokeWidth="1.4"/>
        <path d="M10 9h6M10 12h4" stroke="#1d9e75" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Portal({ user }) {
  const [activeTool, setActiveTool]           = useState(null)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [showPw, setShowPw]                   = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword]         = useState('')
  const [confirm, setConfirm]                 = useState('')
  const [pwError, setPwError]                 = useState('')
  const [pwSuccess, setPwSuccess]             = useState(false)
  const [pwLoading, setPwLoading]             = useState(false)
  const [availableSets, setAvailableSets]     = useState([])
  const [clock, setClock]                     = useState('')

  useEffect(() => {
    fetchSets()
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const fetchSets = async () => {
    try {
      const res = await fetch(`${API_URL}/sets`)
      const data = await res.json()
      setAvailableSets(data.sets || [])
    } catch (e) { console.error('Failed to fetch sets:', e) }
  }

  const handleSignOut = async () => { await supabase.auth.signOut() }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPwError(''); setPwSuccess(false)
    if (newPassword !== confirm) { setPwError('Passwords do not match'); return }
    if (newPassword.length < 6)  { setPwError('Password must be at least 6 characters'); return }
    setPwLoading(true)
    const { error: siErr } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword })
    if (siErr) { setPwError('Current password is incorrect'); setPwLoading(false); return }
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) setPwError(error.message)
    else {
      setPwSuccess(true); setCurrentPassword(''); setNewPassword(''); setConfirm('')
      setTimeout(() => { setShowPw(false); setPwSuccess(false) }, 2000)
    }
    setPwLoading(false)
  }

  const currentTool = TOOLS.find(t => t.id === activeTool)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'RZ'

  return (
    <div style={s.page}>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={s.overlay}
        />
      )}

      {/* Sidebar */}
      <div style={{ ...s.sidebar, transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}>
        <div style={s.sbTop}>
          <p style={s.sbLabel}>Signed in as</p>
          <div style={s.sbUser}>
            <div style={s.sbAvatar}>{initials}</div>
            <span style={s.sbEmail}>{user?.email}</span>
          </div>
        </div>
        <div style={s.sbNav}>
          <p style={s.sbSection}>Navigation</p>
          <button onClick={() => { setActiveTool(null); setSidebarOpen(false) }} style={{ ...s.sbItem, ...(activeTool === null ? s.sbActive : {}) }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.7"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor" opacity="0.7"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.7"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor" opacity="0.7"/></svg>
            Home
          </button>
          <p style={s.sbSection}>Tools</p>
          {TOOLS.map(t => (
            <button key={t.id} onClick={() => { setActiveTool(t.id); setSidebarOpen(false) }} style={{ ...s.sbItem, ...(activeTool === t.id ? s.sbActive : {}) }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="8" height="9" rx="1.5" fill="currentColor" opacity="0.4"/><rect x="5" y="1" width="8" height="9" rx="1.5" fill="currentColor" opacity="0.6"/></svg>
              {t.title}
            </button>
          ))}
          <div style={s.sbDivider} />
          <button onClick={() => { setShowPw(true); setSidebarOpen(false) }} style={s.sbItem}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" fill="currentColor" opacity="0.5"/></svg>
            Settings
          </button>
          <button onClick={handleSignOut} style={{ ...s.sbItem, color: '#ff5555' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 7H3M9 7L7 5M9 7L7 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 2v10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5"/></svg>
            Sign out
          </button>
        </div>
      </div>

      {/* Nav */}
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <button onClick={() => setSidebarOpen(v => !v)} style={s.hamburger}>
            <span style={{ ...s.hline, transform: sidebarOpen ? 'translateY(7px) rotate(45deg)' : 'none' }} />
            <span style={{ ...s.hline, opacity: sidebarOpen ? 0 : 1 }} />
            <span style={{ ...s.hline, transform: sidebarOpen ? 'translateY(-7px) rotate(-45deg)' : 'none' }} />
          </button>
          <div style={s.breadcrumb}>
            <span style={s.navLogo} onClick={() => setActiveTool(null)}>RIPZILLA</span>
            {currentTool && <><span style={s.sep}>/</span><span style={s.pageName}>{currentTool.title}</span></>}
          </div>
        </div>
        <div style={s.navRight}>
          <div style={s.onlineDot} />
          <span style={s.navEmail}>{user?.email}</span>
        </div>
      </nav>

      {/* Change password */}
      {showPw && (
        <div style={s.pwBanner}>
          <form onSubmit={handleChangePassword} style={s.pwForm}>
            <div style={s.pwHeader}>
              <p style={s.pwTitle}>Change Password</p>
              <button type="button" onClick={() => { setShowPw(false); setPwError('') }} style={s.pwClose}>✕</button>
            </div>
            <div style={s.pwFields}>
              {[['Current Password', currentPassword, setCurrentPassword], ['New Password', newPassword, setNewPassword], ['Confirm New Password', confirm, setConfirm]].map(([label, val, setter]) => (
                <div key={label} style={s.field}>
                  <label style={s.label}>{label}</label>
                  <input type="password" value={val} onChange={e => setter(e.target.value)} placeholder="••••••••" required style={s.input} />
                </div>
              ))}
            </div>
            {pwError   && <p style={s.error}>{pwError}</p>}
            {pwSuccess && <p style={s.success}>Password updated!</p>}
            <div style={s.pwActions}>
              <button type="submit" disabled={pwLoading} style={s.pwSave}>{pwLoading ? 'Saving...' : 'Save password'}</button>
              <button type="button" onClick={() => { setShowPw(false); setPwError('') }} style={s.pwCancel}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Main */}
      <main style={s.main}>
        {!activeTool && (
          <>
            <div style={s.greeting}>
              <p style={s.greetingTime}>{getGreeting()}</p>
              <h1 style={s.greetingTitle}>Welcome back.</h1>
              <p style={s.greetingSub}>What are we working on today?</p>
            </div>
            <p style={s.sectionLabel}>Tools</p>
            <div style={s.grid}>
              {TOOLS.map(tool => (
                <button key={tool.id} onClick={() => setActiveTool(tool.id)} style={s.toolCard}>
                  <div style={{ ...s.cardAccent, background: tool.accentColor }} />
                  <div style={s.cardBody}>
                    <div style={s.cardIconWrap}>
                      <div style={{ ...s.cardIcon, background: tool.iconBg }}>{tool.icon}</div>
                    </div>
                    <p style={s.cardTitle}>{tool.title}</p>
                    <p style={s.cardDesc}>{tool.sub}</p>
                    <div style={s.cardFooter}>
                      <span style={{ ...s.cardTag, background: tool.tagBg, color: tool.tagColor }}>{tool.tag}</span>
                      <span style={{ ...s.cardArrow, color: tool.accentColor }}>→</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {activeTool && (
          <div style={s.toolView}>
            <button onClick={() => setActiveTool(null)} style={s.backBtn}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Back to home
            </button>
            {activeTool === 'break-report' && <BreakReport availableSets={availableSets} onSetsRefresh={fetchSets} />}
            {activeTool === 'card-sets'    && <CardSetManager onSetUploaded={fetchSets} />}
          </div>
        )}
      </main>

      {/* Status bar */}
      <div style={s.statusBar}>
        <div style={s.statusDot} />
        <span style={s.statusText}>API connected · ripzillatcg.com</span>
        <span style={s.statusClock}>{clock}</span>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh', background: '#0a0a0f', fontFamily: "'Inter', sans-serif",
    color: '#e8e8f0', display: 'flex', flexDirection: 'column',
  },

  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    zIndex: 98,
  },

  sidebar: {
    position: 'fixed', top: 0, left: 0, height: '100vh', width: '230px',
    background: '#0d0d14', borderRight: '1px solid #1a1a26',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.24s cubic-bezier(.4,0,.2,1)',
    zIndex: 99,
  },
  sbTop: { padding: '24px 18px 16px', borderBottom: '1px solid #1a1a26' },
  sbLabel: { fontSize: '9px', letterSpacing: '2.5px', color: '#2a2a3a', textTransform: 'uppercase', marginBottom: '10px' },
  sbUser: { display: 'flex', alignItems: 'center', gap: '10px' },
  sbAvatar: { width: '32px', height: '32px', borderRadius: '50%', background: '#1a1a2e', border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', color: '#5c5cff', flexShrink: 0 },
  sbEmail: { fontSize: '11px', color: '#444460', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  sbNav: { padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 },
  sbSection: { fontSize: '9px', letterSpacing: '2px', color: '#222235', textTransform: 'uppercase', padding: '10px 8px 4px', margin: 0 },
  sbItem: { display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: 'none', borderRadius: '8px', color: '#333350', fontSize: '13px', padding: '10px 10px', cursor: 'pointer', width: '100%', textAlign: 'left' },
  sbActive: { background: '#1a1a2e', color: '#e8e8f0', borderLeft: '2px solid #5c5cff', paddingLeft: '8px' },
  sbDivider: { height: '1px', background: '#1a1a26', margin: '8px 0' },

  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 28px', height: '60px', background: '#0d0d14',
    borderBottom: '1px solid #1a1a26', position: 'sticky', top: 0, zIndex: 50,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  hamburger: { background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '5px', padding: '6px', borderRadius: '6px' },
  hline: { display: 'block', width: '20px', height: '2px', background: '#888899', borderRadius: '2px', transition: 'all 0.22s ease' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: '10px' },
  navLogo: { fontSize: '13px', fontWeight: '800', letterSpacing: '5px', color: '#e8e8f0', cursor: 'pointer' },
  sep: { color: '#2a2a3a', fontSize: '16px' },
  pageName: { fontSize: '13px', color: '#555570' },
  navRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  navEmail: { fontSize: '12px', color: '#2a2a3a' },
  onlineDot: { width: '7px', height: '7px', borderRadius: '50%', background: '#1d9e75' },

  pwBanner: { background: '#0d0d14', borderBottom: '1px solid #1a1a26', padding: '28px 40px' },
  pwForm: { maxWidth: '860px', margin: '0 auto' },
  pwHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' },
  pwTitle: { color: '#e8e8f0', fontSize: '15px', fontWeight: '600', margin: 0 },
  pwClose: { background: 'transparent', border: 'none', color: '#555570', fontSize: '16px', cursor: 'pointer' },
  pwFields: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', color: '#555570', letterSpacing: '0.5px' },
  input: { background: '#0a0a0f', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' },
  error: { color: '#ff5555', fontSize: '13px', margin: '0 0 12px', padding: '10px 14px', background: '#1a0d0d', borderRadius: '8px', border: '1px solid #3a1a1a' },
  success: { color: '#55cc55', fontSize: '13px', margin: '0 0 12px', padding: '10px 14px', background: '#0d1a0d', borderRadius: '8px', border: '1px solid #1a3a1a' },
  pwActions: { display: 'flex', gap: '10px' },
  pwSave: { background: '#5c5cff', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 22px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' },
  pwCancel: { background: 'transparent', border: '1px solid #1e1e2e', borderRadius: '8px', color: '#555570', padding: '10px 22px', fontSize: '13px', cursor: 'pointer' },

  main: { flex: 1, maxWidth: '960px', width: '100%', margin: '0 auto', padding: '64px 32px' },

  greeting: { marginBottom: '56px', textAlign: 'center' },
  greetingTime: { fontSize: '11px', letterSpacing: '3px', color: '#2a2a4a', textTransform: 'uppercase', marginBottom: '14px' },
  greetingTitle: { fontSize: '42px', fontWeight: '700', color: '#e8e8f0', margin: '0 0 10px' },
  greetingSub: { fontSize: '16px', color: '#333350' },

  sectionLabel: { fontSize: '11px', letterSpacing: '2px', color: '#2a2a4a', textTransform: 'uppercase', marginBottom: '20px', textAlign: 'center' },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' },

  toolCard: {
    background: '#0d0d14', border: '1px solid #1a1a26', borderRadius: '18px',
    padding: '0', cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
    transition: 'border-color 0.15s, transform 0.12s',
    width: '100%',
  },
  cardAccent: { height: '4px' },
  cardBody: { padding: '32px 28px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  cardIconWrap: { marginBottom: '20px' },
  cardIcon: { width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: '20px', fontWeight: '700', color: '#e8e8f0', margin: '0 0 10px' },
  cardDesc: { fontSize: '14px', color: '#3a3a55', lineHeight: '1.7', margin: '0 0 20px' },
  cardFooter: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  cardTag: { fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '5px', fontWeight: '600' },
  cardArrow: { fontSize: '20px', fontWeight: '300' },

  toolView: { display: 'flex', flexDirection: 'column', gap: '24px' },
  backBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'transparent', border: '1px solid #1a1a26', borderRadius: '8px', color: '#333350', fontSize: '13px', padding: '8px 16px', cursor: 'pointer', alignSelf: 'flex-start' },

  statusBar: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 28px', background: '#0d0d14', borderTop: '1px solid #1a1a26' },
  statusDot: { width: '6px', height: '6px', borderRadius: '50%', background: '#1d9e75' },
  statusText: { fontSize: '11px', color: '#1a3a28', letterSpacing: '0.5px' },
  statusClock: { marginLeft: 'auto', fontSize: '11px', color: '#1e1e2e' },
}
