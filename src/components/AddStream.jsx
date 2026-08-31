import { useState } from 'react'
import { Icon, Alert, Field, Spinner } from './ui'
import { apiFetch, errorFrom } from '../lib/api'

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
      const res = await apiFetch('/streams/scrape', {
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
      // A 401 means the session ended — say that, don't blame the network.
      setError(e?.status === 401
        ? e.message
        : 'Could not reach the API. Please enter details manually.')
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
      const res = await apiFetch('/streams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url:       url.trim(),
          title:     title.trim(),
          starts_at: new Date(startsAt).toISOString(),
        }),
      })
      if (!res.ok) throw new Error(await errorFrom(res, 'Failed to save'))
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

  const detailsOpen = scraped || title || startsAt
  const canSave = !saving && title.trim() && startsAt && url.trim()

  return (
    <section className="panel panel-pad">
      <header className="panel-head">
        <span className="kicker">Stream schedule</span>
        <h2>Add Stream</h2>
        <p>Paste a Whatnot stream link to auto-fill the details, or enter them manually.</p>
      </header>

      <div className="stack stack-lg">
        <div className="row-inline">
          <div className="grow">
            <Field label="Whatnot stream URL">
              <input
                className="input"
                type="url"
                value={url}
                onChange={e => { setUrl(e.target.value); setScraped(false) }}
                placeholder="https://www.whatnot.com/live/…"
              />
            </Field>
          </div>
          <button
            className="btn btn-ghost btn-auto"
            onClick={handleScrape}
            disabled={scraping || !url.trim()}
            style={{ height: 44 }}
          >
            {scraping ? <><Spinner /> Fetching…</> : <>{Icon.link(15)} Auto-fill</>}
          </button>
        </div>

        {scraped && (
          <Alert kind={error ? 'error' : 'note'}>
            {error
              ? <>{error} — fill in the details manually below.</>
              : <>Details fetched — <b>review and confirm</b> before saving.</>}
          </Alert>
        )}

        {detailsOpen && (
          <>
            <Field label="Stream title">
              <input
                className="input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. 36 Pack Character Break"
              />
            </Field>

            <Field label="Start time">
              <input
                className="input"
                type="datetime-local"
                value={startsAt}
                onChange={e => setStartsAt(e.target.value)}
              />
            </Field>
          </>
        )}

        {!detailsOpen && (
          <button className="btn btn-quiet" style={{ alignSelf: 'flex-start' }} onClick={() => setScraped(true)}>
            Enter details manually instead
          </button>
        )}

        {!scraped && error && <Alert kind="error">{error}</Alert>}
        {success && <Alert kind="success">Stream added to the home page.</Alert>}

        {detailsOpen && (
          <button className="btn btn-primary btn-block" onClick={handleSave} disabled={!canSave}>
            {saving
              ? <><Spinner /> Saving…</>
              : <>Add to home page <span className="arr">{Icon.arrowRight(15)}</span></>}
          </button>
        )}
      </div>
    </section>
  )
}
