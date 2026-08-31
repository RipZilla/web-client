import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import BreakReport from '../components/BreakReport'
import CardSetManager from '../components/CardSetManager'
import BreakRoi from '../components/BreakRoi'
import AddStream from '../components/AddStream'
import { Icon, Alert, Field, Spinner } from '../components/ui'
import { apiFetch } from '../lib/api'
import {
  CATEGORIES, getCategory, loadCategory, saveCategory, applyCategoryTheme,
} from '../lib/categories'

const TOOLS = [
  {
    id: 'break-report',
    title: 'Break Report',
    sub: 'Select two card sets and upload your Whatnot CSV to generate a formatted Excel report.',
    kicker: 'Report generator',
    icon: Icon.report,
  },
  {
    id: 'break-roi',
    title: 'Break ROI',
    sub: 'Paste a Whatnot export to price the products in a break against what the spots actually sold for.',
    kicker: 'Risk analysis',
    icon: Icon.trend,
  },
  {
    id: 'card-sets',
    title: 'Card Set Manager',
    sub: 'Generate card set tables from raw data, or upload existing sets to the server.',
    kicker: 'Set management',
    icon: Icon.layers,
  },
]

const ADD_STREAM = { id: 'add-stream', title: 'Add Stream', icon: Icon.broadcast }

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatStreamTime(iso) {
  const dt = new Date(iso)
  return dt.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function timeUntil(iso) {
  const diff = new Date(iso) - new Date()
  if (diff < 0) return 'Live now'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 48) return `In ${Math.floor(h / 24)} days`
  if (h > 0)  return `In ${h}h ${m}m`
  return `In ${m}m`
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
  const [streams, setStreams]                 = useState([])
  const [category, setCategory]               = useState(loadCategory)

  useEffect(() => {
    fetchSets()
    fetchStreams()
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Escape closes whatever overlay is open
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (showPw) { setShowPw(false); setPwError('') }
      else if (sidebarOpen) setSidebarOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showPw, sidebarOpen])

  const fetchSets = async () => {
    try {
      const res = await apiFetch('/sets')
      if (!res.ok) return
      const data = await res.json()
      setAvailableSets(data.sets || [])
    } catch (e) { console.error('Failed to fetch sets:', e) }
  }

  const fetchStreams = async () => {
    try {
      const { data, error } = await supabase
        .from('streams')
        .select('*')
        .gte('starts_at', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()) // include up to 3h ago (live)
        .order('starts_at', { ascending: true })
      if (!error) setStreams(data || [])
    } catch (e) { console.error('Failed to fetch streams:', e) }
  }

  const handleDeleteStream = async (id) => {
    try {
      const res = await apiFetch(`/streams/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setStreams(prev => prev.filter(s => s.id !== id))
    } catch (e) { console.error('Failed to delete stream:', e) }
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

  const go = (id) => { setActiveTool(id); setSidebarOpen(false) }

  const chooseCategory = (id) => {
    setCategory(id)
    saveCategory(id)
    applyCategoryTheme(id)   // CSS cross-fades the accent from here
    setActiveTool(null)      // tools are category-specific; don't strand the user in one
    setSidebarOpen(false)
  }

  const active = getCategory(category)
  const locked = !active.available
  const currentTool = TOOLS.find(t => t.id === activeTool)
  const crumbName = currentTool?.title || (activeTool === ADD_STREAM.id ? ADD_STREAM.title : null)
  const initials = user?.email?.slice(0, 2).toUpperCase() || 'RZ'

  return (
    <div className="app">
      <div className="grain" />

      {sidebarOpen && <div className="sb-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* ---------- sidebar ---------- */}
      <aside className={`sidebar${sidebarOpen ? ' open' : ''}`} aria-hidden={!sidebarOpen}>
        <div className="sb-top">
          <div className="sb-brand">
            <div className="logo-mark" />
            <span className="wordmark sm">RIPZILLA</span>
          </div>
          <div className="sb-user">
            <div className="sb-avatar">{initials}</div>
            <span className="sb-email" title={user?.email}>{user?.email}</span>
          </div>
        </div>

        <nav className="sb-nav">
          <p className="sb-section">Workspace</p>
          <button className={`sb-item${activeTool === null ? ' on' : ''}`} onClick={() => go(null)}>
            {Icon.home(15)} Home
          </button>

          <p className="sb-section">Tools</p>
          {TOOLS.map(t => (
            <button
              key={t.id}
              className={`sb-item${activeTool === t.id ? ' on' : ''}`}
              onClick={() => go(t.id)}
              disabled={locked}
              title={locked ? `Not available for ${active.label} yet` : t.title}
            >
              {t.icon(15)} {t.title}
            </button>
          ))}

          <p className="sb-section">Streams</p>
          <button
            className={`sb-item${activeTool === ADD_STREAM.id ? ' on' : ''}`}
            onClick={() => go(ADD_STREAM.id)}
            disabled={locked}
            title={locked ? `Not available for ${active.label} yet` : ADD_STREAM.title}
          >
            {ADD_STREAM.icon(15)} Add Stream
          </button>

          <div className="sb-divider" />
          <button className="sb-item" onClick={() => { setShowPw(true); setSidebarOpen(false) }}>
            {Icon.key(15)} Change password
          </button>
          <button className="sb-item danger" onClick={handleSignOut}>
            {Icon.signout(15)} Sign out
          </button>
        </nav>

        <div className="sb-foot">Internal Portal</div>
      </aside>

      {/* ---------- top bar ---------- */}
      <header className="app-nav">
        <div className="nav-left">
          <button
            className={`hamburger${sidebarOpen ? ' on' : ''}`}
            onClick={() => setSidebarOpen(v => !v)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            <span style={{ transform: sidebarOpen ? 'translateY(6.5px) rotate(45deg)' : 'none' }} />
            <span style={{ opacity: sidebarOpen ? 0 : 1 }} />
            <span style={{ transform: sidebarOpen ? 'translateY(-6.5px) rotate(-45deg)' : 'none' }} />
          </button>

          <div className="crumb">
            <button className="logo" onClick={() => setActiveTool(null)}>
              <span className="logo-mark" />
              <span className="wordmark sm">RIPZILLA</span>
            </button>
            {crumbName && (
              <>
                <span className="crumb-sep">/</span>
                <span className="crumb-now">{crumbName}</span>
              </>
            )}
          </div>
        </div>

        <div className="catbar" role="tablist" aria-label="Product category">
          {CATEGORIES.map(c => (
            <button
              key={c.id}
              role="tab"
              aria-selected={c.id === category}
              className={`cat${c.id === category ? ' on' : ''}`}
              onClick={() => chooseCategory(c.id)}
              title={c.available ? c.label : `${c.label} — in development`}
            >
              <span className="cat-dot" />
              {c.label}
              {!c.available && <span className="cat-soon">Soon</span>}
            </button>
          ))}
        </div>

        <div className="nav-right">
          <span className="dot dot-live" />
          <span className="nav-email" title={user?.email}>{user?.email}</span>
        </div>
      </header>

      {/* ---------- change password ---------- */}
      {showPw && (
        <div className="modal-scrim" onClick={() => { setShowPw(false); setPwError('') }}>
          <div className="modal" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <form onSubmit={handleChangePassword}>
              <div className="modal-head">
                <span style={{ color: 'var(--accent)' }}>{Icon.key(17)}</span>
                <h2>Change password</h2>
                <button
                  type="button"
                  className="modal-close"
                  onClick={() => { setShowPw(false); setPwError('') }}
                  aria-label="Close"
                >
                  {Icon.x(14)}
                </button>
              </div>

              <div className="modal-body">
                <Field label="Current password">
                  <input className="input" type="password" value={currentPassword} placeholder="••••••••"
                    onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" required />
                </Field>
                <Field label="New password" hint="At least 6 characters.">
                  <input className="input" type="password" value={newPassword} placeholder="••••••••"
                    onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" required />
                </Field>
                <Field label="Confirm new password">
                  <input className="input" type="password" value={confirm} placeholder="••••••••"
                    onChange={e => setConfirm(e.target.value)} autoComplete="new-password" required />
                </Field>

                {pwError   && <Alert kind="error">{pwError}</Alert>}
                {pwSuccess && <Alert kind="success">Password updated.</Alert>}
              </div>

              <div className="modal-foot">
                <button className="btn btn-primary" type="submit" disabled={pwLoading}>
                  {pwLoading ? <><Spinner /> Saving…</> : 'Save password'}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => { setShowPw(false); setPwError('') }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- main ---------- */}
      <main className="main">
        {!activeTool && locked && (
          <>
            <div className="page-head rv d1">
              <span className="eyebrow"><span className="tick">◆</span>{active.label}</span>
              <h1>{active.label} tools are <em>on the way.</em></h1>
              <p>{active.blurb}</p>
            </div>

            <section className="soon rv d2">
              <div className="soon-badge">{Icon.sparkle(26)}</div>
              <span className="eyebrow"><span className="tick">◆</span>In development</span>
              <h2>We're building this now</h2>
              <p>
                The team is actively working on {active.label} tooling. Pokémon is the
                only category with shipped tools today — switch back to it from the bar
                above to keep working.
              </p>
              <div className="soon-bar"><i /></div>
            </section>
          </>
        )}

        {!activeTool && !locked && (
          <>
            <div className="page-head rv d1">
              <span className="eyebrow"><span className="tick">◆</span>{getGreeting()}</span>
              <h1>Welcome back to the <em>workspace.</em></h1>
              <p>Your break reports, card sets, and stream schedule — all in one place.</p>
            </div>

            <div className="section rv d2" style={{ marginTop: 0 }}>
              <div className="section-head">
                <span className="kicker">Tools</span>
                <span className="section-count">{String(TOOLS.length).padStart(2, '0')} available</span>
              </div>

              <div className="card-grid">
                {TOOLS.map(tool => (
                  <button key={tool.id} className="tool-card" onClick={() => setActiveTool(tool.id)}>
                    <span className="tool-icon">{tool.icon(24)}</span>
                    <h3>{tool.title}</h3>
                    <p>{tool.sub}</p>
                    <div className="tool-foot">
                      <span className="chip">{tool.kicker}</span>
                      <span className="tool-go">Open <span className="arr">{Icon.arrowRight(13)}</span></span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="section rv d3">
              <div className="section-head">
                <span className="kicker">Upcoming streams</span>
                <span className="section-count">{String(streams.length).padStart(2, '0')} scheduled</span>
              </div>

              {streams.length === 0 ? (
                <div className="empty">
                  <p>No streams on the schedule.</p>
                  <span>Add one from the sidebar to show it here.</span>
                </div>
              ) : (
                <div className="row-list">
                  {streams.map(stream => {
                    const isLive = new Date(stream.starts_at) <= new Date()
                    return (
                      <div key={stream.id} className="row">
                        <span className={isLive ? 'dot dot-live' : 'dot'} />
                        <div className="row-main">
                          <a className="row-title" href={stream.url} target="_blank" rel="noreferrer">
                            <span className="nm">{stream.title}</span>
                            {Icon.external(12)}
                          </a>
                          <p className="row-sub">{formatStreamTime(stream.starts_at)}</p>
                        </div>
                        <div className="row-right">
                          <span className={isLive ? 'chip chip-live' : 'chip'}>
                            {timeUntil(stream.starts_at)}
                          </span>
                          <button
                            className="icon-btn"
                            onClick={() => handleDeleteStream(stream.id)}
                            title="Remove stream"
                            aria-label={`Remove ${stream.title}`}
                          >
                            {Icon.x(13)}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTool && !locked && (
          <div className="tool-view rv d1">
            <button className="back-btn" onClick={() => setActiveTool(null)}>
              {Icon.arrowLeft(13)} Back to home
            </button>

            {activeTool === 'break-report' && <BreakReport availableSets={availableSets} onSetsRefresh={fetchSets} />}
            {activeTool === 'break-roi'    && <BreakRoi />}
            {activeTool === 'card-sets'    && <CardSetManager onSetUploaded={fetchSets} />}
            {activeTool === ADD_STREAM.id  && (
              <AddStream onStreamAdded={() => { fetchStreams(); setActiveTool(null) }} />
            )}
          </div>
        )}
      </main>

      {/* ---------- status bar ---------- */}
      <footer className="statusbar">
        <span className="dot dot-live" />
        <span>API connected</span>
        <span className="sep">/</span>
        <span>ripzillatcg.com</span>
        <span className="clock">{clock}</span>
      </footer>
    </div>
  )
}
