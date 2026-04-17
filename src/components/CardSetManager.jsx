import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL

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
      const res = await fetch(`${API_URL}/sets/parse`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Parse failed')
      }
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
      const res = await fetch(`${API_URL}/sets/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }
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
      const res = await fetch(`${API_URL}/sets/upload`, { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Upload failed')
      }
      setUploadSuccess(`${uploadFile.name} saved to server`)
      setUploadFile(null)
      if (onSetUploaded) onSetUploaded()
    } catch (e) {
      setUploadError(e.message)
    } finally {
      setUploadLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>Card Set Manager</h2>
        <p style={styles.subtitle}>Generate a card set table from raw data, or upload an existing one.</p>
      </div>

      <div style={styles.tabs}>
        <button onClick={() => setTab('parse')} style={{ ...styles.tab, ...(tab === 'parse' ? styles.tabActive : {}) }}>
          Generate from text
        </button>
        <button onClick={() => setTab('upload')} style={{ ...styles.tab, ...(tab === 'upload' ? styles.tabActive : {}) }}>
          Upload existing file
        </button>
      </div>

      {tab === 'parse' && (
        <div style={styles.section}>
          <div style={styles.field}>
            <label style={styles.label}>Set name</label>
            <input
              type="text"
              value={setName}
              onChange={e => setSetName(e.target.value)}
              placeholder="e.g. PerfectOrder"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Paste raw card data (tab-separated)</label>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder={"001/088\tJ\tSpinarak\tGrass\tCommon\n002/088\tJ\tAriados\tGrass\tCommon\n..."}
              style={styles.textarea}
              rows={10}
            />
          </div>

          {parseError && <p style={styles.error}>{parseError}</p>}

          <button onClick={handleParse} disabled={parseLoading} style={styles.button}>
            {parseLoading ? 'Parsing...' : 'Generate table'}
          </button>

          {parsedBlob && (
            <div style={styles.resultBox}>
              <p style={styles.resultTitle}>Table ready — {parsedFilename}</p>
              <div style={styles.resultActions}>
                <button onClick={handleDownload} style={styles.btnSecondary}>
                  Download
                </button>
                <button onClick={handleSaveToServer} disabled={uploadLoading} style={styles.button}>
                  {uploadLoading ? 'Saving...' : 'Save to server'}
                </button>
              </div>
              {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}
              {uploadError && <p style={styles.error}>{uploadError}</p>}
            </div>
          )}
        </div>
      )}

      {tab === 'upload' && (
        <div style={styles.section}>
          <div style={styles.field}>
            <label style={styles.label}>Select an existing card set Excel file</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={e => { setUploadFile(e.target.files[0]); setUploadSuccess(''); setUploadError('') }}
              style={styles.fileInput}
            />
          </div>

          {uploadError && <p style={styles.error}>{uploadError}</p>}
          {uploadSuccess && <p style={styles.success}>{uploadSuccess}</p>}

          <button
            onClick={handleUploadExisting}
            disabled={!uploadFile || uploadLoading}
            style={{ ...styles.button, opacity: !uploadFile || uploadLoading ? 0.5 : 1 }}
          >
            {uploadLoading ? 'Uploading...' : 'Upload to server'}
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    background: '#13131a',
    border: '1px solid #1e1e2e',
    borderRadius: '12px',
    padding: '32px',
  },
  header: { marginBottom: '24px' },
  title: { fontSize: '18px', fontWeight: '600', color: '#e8e8f0', margin: '0 0 8px' },
  subtitle: { fontSize: '13px', color: '#555570', margin: '0', lineHeight: '1.6' },
  tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
  tab: {
    background: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '6px',
    color: '#555570',
    fontSize: '13px',
    padding: '7px 16px',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#1a1a2e',
    border: '1px solid #5c5cff',
    color: '#e8e8f0',
  },
  section: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '12px', color: '#888899', letterSpacing: '0.5px' },
  input: {
    background: '#0d0d14',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#e8e8f0',
    fontSize: '13px',
    outline: 'none',
  },
  textarea: {
    background: '#0d0d14',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#e8e8f0',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
    resize: 'vertical',
    lineHeight: '1.6',
  },
  fileInput: { color: '#888899', fontSize: '13px' },
  button: {
    background: '#5c5cff',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '11px 20px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  btnSecondary: {
    background: 'transparent',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    color: '#888899',
    padding: '11px 20px',
    fontSize: '13px',
    cursor: 'pointer',
  },
  resultBox: {
    background: '#0d0d14',
    border: '1px solid #2a2a3a',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  resultTitle: { color: '#e8e8f0', fontSize: '13px', fontWeight: '500', margin: '0' },
  resultActions: { display: 'flex', gap: '10px' },
  error: {
    color: '#ff5555', fontSize: '13px', margin: '0',
    padding: '10px 14px', background: '#1a0d0d',
    borderRadius: '8px', border: '1px solid #3a1a1a',
  },
  success: {
    color: '#55cc55', fontSize: '13px', margin: '0',
    padding: '10px 14px', background: '#0d1a0d',
    borderRadius: '8px', border: '1px solid #1a3a1a',
  },
}
