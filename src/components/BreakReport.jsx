import { useState, useRef } from 'react'

const API_URL = import.meta.env.VITE_API_URL

export default function BreakReport({ availableSets, onSetsRefresh }) {
  const [set1, setSet1] = useState('')
  const [set2, setSet2] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef()

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(''); setSuccess(false) }
    else setError('Please select a CSV file')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(''); setSuccess(false) }
    else setError('Please drop a CSV file')
  }

  const handleGenerate = async () => {
    setError(''); setSuccess(false)
    if (!set1) { setError('Please select Set 1'); return }
    if (!set2) { setError('Please select Set 2'); return }
    if (set1 === set2) { setError('Please select two different sets'); return }
    if (!file) { setError('Please upload a CSV file'); return }
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('set1', set1)
      form.append('set2', set2)
      const res = await fetch(`${API_URL}/generate-report`, { method: 'POST', body: form })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Something went wrong') }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'break_report.xlsx'; a.click()
      window.URL.revokeObjectURL(url)
      setSuccess(true); setFile(null)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  const sets = availableSets || []
  const canGenerate = set1 && set2 && set1 !== set2 && file && !loading

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <h2 style={styles.title}>Break Report Generator</h2>
        <p style={styles.subtitle}>Select two card sets, upload your Whatnot CSV, and generate a formatted Excel report.</p>
      </div>

      <div style={styles.setRow}>
        <div style={styles.field}>
          <label style={styles.label}>Set 1</label>
          <select value={set1} onChange={e => setSet1(e.target.value)} style={styles.select}>
            <option value="">Select a set...</option>
            {sets.map(s => <option key={s} value={s} disabled={s === set2}>{s.replace('.xlsx', '')}</option>)}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>Set 2</label>
          <select value={set2} onChange={e => setSet2(e.target.value)} style={styles.select}>
            <option value="">Select a set...</option>
            {sets.map(s => <option key={s} value={s} disabled={s === set1}>{s.replace('.xlsx', '')}</option>)}
          </select>
        </div>
        <button onClick={onSetsRefresh} style={styles.refreshBtn} title="Refresh sets list">↺</button>
      </div>

      <div style={{ ...styles.field, marginBottom: '20px' }}>
        <label style={styles.label}>Whatnot order export (.csv)</label>
        <div style={styles.dropzone} onClick={() => inputRef.current.click()} onDrop={handleDrop} onDragOver={e => e.preventDefault()}>
          <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
          {file ? (
            <div style={styles.fileSelected}>
              <span style={{ fontSize: '16px', color: '#5c5cff' }}>◈</span>
              <span style={{ color: '#e8e8f0', fontSize: '13px', fontWeight: '500' }}>{file.name}</span>
              <span style={{ color: '#555570', fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '24px', color: '#5c5cff' }}>⬡</span>
              <p style={{ color: '#888899', fontSize: '13px', margin: '0' }}>Drop CSV here or click to browse</p>
            </div>
          )}
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>Report generated and downloaded!</p>}

      <button onClick={handleGenerate} disabled={!canGenerate} style={{ ...styles.button, opacity: canGenerate ? 1 : 0.5, cursor: canGenerate ? 'pointer' : 'not-allowed' }}>
        {loading ? 'Generating...' : 'Generate Report'}
      </button>
    </div>
  )
}

const styles = {
  wrapper: { background: '#13131a', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '32px' },
  header: { marginBottom: '24px' },
  title: { fontSize: '18px', fontWeight: '600', color: '#e8e8f0', margin: '0 0 8px' },
  subtitle: { fontSize: '13px', color: '#555570', margin: '0', lineHeight: '1.6' },
  setRow: { display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 },
  label: { fontSize: '12px', color: '#888899', letterSpacing: '0.5px' },
  select: { background: '#0d0d14', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '10px 12px', color: '#e8e8f0', fontSize: '13px', outline: 'none', cursor: 'pointer' },
  refreshBtn: { background: 'transparent', border: '1px solid #2a2a3a', borderRadius: '8px', color: '#555570', fontSize: '18px', padding: '8px 12px', cursor: 'pointer', height: '40px' },
  dropzone: { border: '1px dashed #2a2a3a', borderRadius: '10px', padding: '24px', textAlign: 'center', cursor: 'pointer', background: '#0d0d14' },
  fileSelected: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
  error: { color: '#ff5555', fontSize: '13px', margin: '0 0 12px', padding: '10px 14px', background: '#1a0d0d', borderRadius: '8px', border: '1px solid #3a1a1a' },
  success: { color: '#55cc55', fontSize: '13px', margin: '0 0 12px', padding: '10px 14px', background: '#0d1a0d', borderRadius: '8px', border: '1px solid #1a3a1a' },
  button: { background: '#5c5cff', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 24px', fontSize: '14px', fontWeight: '600', width: '100%', marginTop: '8px' },
}
