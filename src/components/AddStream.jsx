import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function AddStream({ onStreamAdded }) {
  const [url, setUrl]           = useState('')
  const [title, setTitle]       = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [scraping, setScraping] = useState(false)
  const [scraped, setScraped]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  const handleScrape = async () => {
    if (!url.trim()) { setError('Enter a Whatnot URL first'); return }
    setError(''); setScraping(true); setScraped(false)
    setTitle(''); setStartsAt('')
    try {
      const res = await fetch(`${API_URL}/streams/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      })
      const data = await res.json()
      if (data.title)     setTitle(data.title)
      if (data.starts_at) {
        // Convert ISO to datetime-local format for the input
        const dt = new Date(data.starts_at)
        const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
          .toISOString().slice(0, 16)
        setStartsAt(local)
      }
      if (data.error) setError(data.error)
      setScraped(true)
    } catch (e) {
      setError('Could not reach the API. Please enter details manually.')
      setScraped(true)
    } finally {
      setScraping(false)
    }
  }

  const handleSave = async () => {
    setError('')
    if (!title.trim())   { setError('Stream title is required'); return }
    if (!startsAt)       { setError('Start time is required'); return }
    if (!url.trim())     { setError('Stream URL is required'); return }

    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url:       url.trim(),
          title:     title.trim(),
          starts_at: new Date(startsAt).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to save')
      }
      setSuccess(true)
      setUrl(''); setTitle(''); setStartsAt(''); setScraped(false)
      if (onStreamAdded) onStreamAdded()
      setTimeout(() => setSuccess(false), 3000)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={s.wrapper}>
      <div style={s.header}>
        <h2 style={s.title}>Add Stream</h2>
        <p style={s.subtitle}>
          Paste a Whatnot stream link to auto-fill details, or enter them manually.
        </p>
      </div>

      {/* URL + scrape */}
      <div style={s.urlRow}>
        <div style={{ ...s.field, flex: 1 }}>
          <label style={s.label}>Whatnot stream URL</label>
          <input
            type="url"
            value={url}
            onChange={e => { setUrl(e.target.value); setScraped(false) }}
            placeholder="https://www.whatnot.com/live/..."
            style={s.input}
          />
        </div>
        <button onClick={handleScrape} disabled={scraping || !url.trim()} style={{ ...s.scrapeBtn, opacity: scraping || !url.trim() ? 0.5 : 1 }}>
          {scraping ? 'Fetching...' : 'Auto-fill'}
        </button>
      </div>

      {scraped && (
        <div style={s.scrapedNote}>
          {error
            ? <><span style={s.warnDot}>!</span> {error} — fill in manually below.</>
            : <><span style={s.checkDot}>✓</span> Details fetched — review and confirm below.</>
          }
        </div>
      )}

      {/* Manual fields — always shown after scrape attempt or on demand */}
      {(scraped || title || startsAt) && (
        <div style={s.fields}>
          <div style={s.field}>
            <label style={s.label}>Stream title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. 36 Pack Character Break"
              style={s.input}
            />
          </div>
          <div style={s.field}>
            <label style={s.label}>Start time</label>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={e => setStartsAt(e.target.value)}
              style={s.input}
            />
          </div>
        </div>
      )}

      {/* Show manual fields button if not yet scraped */}
      {!scraped && !title && !startsAt && (
        <button onClick={() => setScraped(true)} style={s.manualBtn}>
          Enter manually instead
        </button>
      )}

      {!scraped && error && <p style={s.error}>{error}</p>}
      {success && <p style={s.success}>Stream added to the home page!</p>}

      {(scraped || title || startsAt) && (
        <button
          onClick={handleSave}
          disabled={saving || !title.trim() || !startsAt || !url.trim()}
          style={{ ...s.saveBtn, opacity: saving || !title.trim() || !startsAt || !url.trim() ? 0.5 : 1 }}
        >
          {saving ? 'Saving...' : 'Add to home page'}
        </button>
      )}
    </div>
  )
}

const s = {
  wrapper: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '32px', maxWidth: '600px' },
  header: { marginBottom: '28px' },
  title: { fontSize: '18px', fontWeight: '600', color: '#e8e8f0', margin: '0 0 8px' },
  subtitle: { fontSize: '13px', color: '#555570', margin: 0, lineHeight: '1.6' },
  urlRow: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '12px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fields: { display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' },
  label: { fontSize: '12px', color: '#888899', letterSpacing: '0.5px' },
  input: { background: '#0d0d14', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none' },
  scrapeBtn: { background: '#1a1a2e', border: '1px solid #2a2a4a', borderRadius: '8px', color: '#5c5cff', fontSize: '13px', fontWeight: '600', padding: '10px 18px', cursor: 'pointer', whiteSpace: 'nowrap', height: '40px', alignSelf: 'flex-end' },
  manualBtn: { background: 'transparent', border: 'none', color: '#333350', fontSize: '13px', cursor: 'pointer', padding: '0', marginBottom: '20px', textDecoration: 'underline' },
  scrapedNote: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#555570', marginBottom: '20px', padding: '10px 14px', background: '#0d0d14', borderRadius: '8px', border: '1px solid #1e1e2e' },
  checkDot: { color: '#1d9e75', fontWeight: '700' },
  warnDot: { color: '#f59e0b', fontWeight: '700' },
  error: { color: '#ff5555', fontSize: '13px', margin: '0 0 16px', padding: '10px 14px', background: '#1a0d0d', borderRadius: '8px', border: '1px solid #3a1a1a' },
  success: { color: '#55cc55', fontSize: '13px', margin: '0 0 16px', padding: '10px 14px', background: '#0d1a0d', borderRadius: '8px', border: '1px solid #1a3a1a' },
  saveBtn: { background: '#5c5cff', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', width: '100%' },
}
