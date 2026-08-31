import { useState, useRef } from 'react'
import { Icon, Alert, Field, Spinner } from './ui'
import { apiFetch, errorFrom } from '../lib/api'

export default function CardSetManager({ onSetUploaded }) {
  // ── Parse tab ──────────────────────────────────────────────────────────────
  const [setName, setSetName] = useState('')
  const [rawText, setRawText] = useState('')
  const [parseLoading, setParseLoading] = useState(false)
  const [parseError, setParseError] = useState('')
  const [parsedBlob, setParsedBlob] = useState(null)
  const [parsedFilename, setParsedFilename] = useState('')

  // ── Upload tab ─────────────────────────────────────────────────────────────
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const [tab, setTab] = useState('parse')
  const fileRef = useRef()

  const handleParse = async () => {
    setParseError('')
    setParsedBlob(null)
    if (!setName.trim()) { setParseError('Enter a set name'); return }
    if (!rawText.trim()) { setParseError('Paste card data first'); return }
    setParseLoading(true)
    try {
      const form = new FormData()
      form.append('raw_text', rawText)
      form.append('set_name', setName.trim())
      const res = await apiFetch('/sets/parse', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await errorFrom(res, 'Parse failed'))
      const blob = await res.blob()
      const filename = `${setName.trim().replace(/\s+/g, '_')}.xlsx`
      setParsedBlob(blob)
      setParsedFilename(filename)
    } catch (e) {
      setParseError(e.message)
    } finally {
      setParseLoading(false)
    }
  }

  const handleDownload = () => {
    if (!parsedBlob) return
    const url = window.URL.createObjectURL(parsedBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = parsedFilename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleSaveToServer = async () => {
    if (!parsedBlob) return
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const form = new FormData()
      form.append('file', new File([parsedBlob], parsedFilename))
      const res = await apiFetch('/sets/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await errorFrom(res, 'Upload failed'))
      setUploadSuccess(`${parsedFilename} saved to server`)
      if (onSetUploaded) onSetUploaded()
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const handleUploadExisting = async () => {
    if (!uploadFile) return
    setUploadLoading(true)
    setUploadError('')
    setUploadSuccess('')
    try {
      const form = new FormData()
      form.append('file', uploadFile)
      const res = await apiFetch('/sets/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await errorFrom(res, 'Upload failed'))
      setUploadSuccess(`${uploadFile.name} saved to server`)
      setUploadFile(null)
      if (onSetUploaded) onSetUploaded()
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploadLoading(false)
    }
  }

  const switchTab = (next) => {
    setTab(next)
    setParseError(''); setUploadError(''); setUploadSuccess('')
  }

  return (
    <section className="panel panel-pad">
      <header className="panel-head">
        <span className="kicker">Set management</span>
        <h2>Card Set Manager</h2>
        <p>Generate a card set table from raw data, or upload an existing one to the server.</p>
      </header>

      <div className="pillbar" style={{ marginBottom: 26 }} role="tablist">
        <button
          className={`pill${tab === 'parse' ? ' on' : ''}`}
          onClick={() => switchTab('parse')}
          role="tab"
          aria-selected={tab === 'parse'}
        >
          Generate from text
        </button>
        <button
          className={`pill${tab === 'upload' ? ' on' : ''}`}
          onClick={() => switchTab('upload')}
          role="tab"
          aria-selected={tab === 'upload'}
        >
          Upload existing file
        </button>
      </div>

      {tab === 'parse' && (
        <div className="stack stack-lg">
          <Field label="Set name">
            <input
              className="input"
              type="text"
              value={setName}
              onChange={e => setSetName(e.target.value)}
              placeholder="e.g. PerfectOrder"
            />
          </Field>

          <Field label="Raw card data" hint="Tab-separated, one card per line.">
            <textarea
              className="textarea"
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={'001/088\tJ\tSpinarak\tGrass\tCommon\n002/088\tJ\tAriados\tGrass\tCommon\n…'}
              rows={10}
            />
          </Field>

          {parseError && <Alert kind="error">{parseError}</Alert>}

          <button className="btn btn-primary btn-block" onClick={handleParse} disabled={parseLoading}>
            {parseLoading ? <><Spinner /> Parsing…</> : <>Generate table {Icon.sparkle(15)}</>}
          </button>

          {parsedBlob && (
            <div className="subpanel stack stack-md">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: 'var(--accent)' }}>{Icon.file(16)}</span>
                <span style={{ fontSize: 14, fontWeight: 500 }}>Table ready</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--faint)', marginLeft: 'auto' }}>
                  {parsedFilename}
                </span>
              </div>

              <div className="row-inline">
                <button className="btn btn-ghost btn-sm btn-auto" onClick={handleDownload}>
                  {Icon.download(14)} Download
                </button>
                <button
                  className="btn btn-primary btn-sm btn-auto"
                  onClick={handleSaveToServer}
                  disabled={uploadLoading}
                >
                  {uploadLoading ? <><Spinner /> Saving…</> : <>{Icon.upload(14)} Save to server</>}
                </button>
              </div>

              {uploadSuccess && <Alert kind="success">{uploadSuccess}</Alert>}
              {uploadError && <Alert kind="error">{uploadError}</Alert>}
            </div>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div className="stack stack-lg">
          <div className="field">
            <span className="field-label">Existing card set file (.xlsx)</span>
            <div className="file-field">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={e => { setUploadFile(e.target.files[0]); setUploadSuccess(''); setUploadError('') }}
                style={{ display: 'none' }}
              />
              <button className="btn btn-ghost btn-sm btn-auto" onClick={() => fileRef.current.click()}>
                {Icon.file(14)} Choose file
              </button>
              <span className="file-name">{uploadFile ? uploadFile.name : 'No file selected'}</span>
            </div>
          </div>

          {uploadError && <Alert kind="error">{uploadError}</Alert>}
          {uploadSuccess && <Alert kind="success">{uploadSuccess}</Alert>}

          <button
            className="btn btn-primary btn-block"
            onClick={handleUploadExisting}
            disabled={!uploadFile || uploadLoading}
          >
            {uploadLoading ? <><Spinner /> Uploading…</> : <>Upload to server {Icon.upload(15)}</>}
          </button>
        </div>
      )}
    </section>
  )
}
