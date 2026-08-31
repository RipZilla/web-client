import { useState, useRef } from 'react'
import { Icon, Alert, Field, Spinner } from './ui'
import { apiFetch, errorFrom } from '../lib/api'

export default function BreakReport({ availableSets, onSetsRefresh }) {
  const [set1, setSet1] = useState('')
  const [set2, setSet2] = useState('')
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const inputRef = useRef()

  const accept = (f, verb) => {
    if (f && f.name.endsWith('.csv')) { setFile(f); setError(''); setSuccess(false) }
    else setError(`Please ${verb} a CSV file`)
  }

  const handleFile = (e) => accept(e.target.files[0], 'select')

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    accept(e.dataTransfer.files[0], 'drop')
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
      const res = await apiFetch('/generate-report', { method: 'POST', body: form })
      if (!res.ok) throw new Error(await errorFrom(res, 'Something went wrong'))
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
    <section className="panel panel-pad">
      <header className="panel-head">
        <span className="kicker">Report generator</span>
        <h2>Break Report</h2>
        <p>Select two card sets, upload your Whatnot order export, and download a formatted Excel report.</p>
      </header>

      <div className="stack stack-lg">
        <div className="row-inline">
          <div className="grow">
            <Field label="Set 1">
              <select className="select" value={set1} onChange={e => setSet1(e.target.value)}>
                <option value="">Select a set…</option>
                {sets.map(s => (
                  <option key={s} value={s} disabled={s === set2}>{s.replace('.xlsx', '')}</option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grow">
            <Field label="Set 2">
              <select className="select" value={set2} onChange={e => setSet2(e.target.value)}>
                <option value="">Select a set…</option>
                {sets.map(s => (
                  <option key={s} value={s} disabled={s === set1}>{s.replace('.xlsx', '')}</option>
                ))}
              </select>
            </Field>
          </div>
          <button
            className="btn btn-ghost btn-auto"
            onClick={onSetsRefresh}
            title="Refresh the set list"
            style={{ height: 44 }}
          >
            {Icon.refresh(15)} Refresh
          </button>
        </div>

        <div className="field">
          <span className="field-label">Whatnot order export (.csv)</span>
          <div
            className={`dropzone${file ? ' has-file' : ''}${dragOver ? ' is-over' : ''}`}
            onClick={() => inputRef.current.click()}
            onDrop={handleDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
          >
            <input ref={inputRef} type="file" accept=".csv" onChange={handleFile} style={{ display: 'none' }} />
            {file ? (
              <div className="dz-file">
                <span style={{ color: 'var(--accent)' }}>{Icon.file(17)}</span>
                <span className="nm">{file.name}</span>
                <span className="sz">{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ) : (
              <>
                <div className="dz-icon">{Icon.upload(22)}</div>
                <p className="dz-title">Drop your CSV here</p>
                <p className="dz-sub">or click to browse</p>
              </>
            )}
          </div>
        </div>

        {error && <Alert kind="error">{error}</Alert>}
        {success && <Alert kind="success">Report generated and downloaded.</Alert>}

        <button className="btn btn-primary btn-block" onClick={handleGenerate} disabled={!canGenerate}>
          {loading
            ? <><Spinner /> Generating…</>
            : <>Generate report {Icon.download(15)}</>}
        </button>
      </div>
    </section>
  )
}
