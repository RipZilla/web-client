import { useState, useMemo } from 'react'
import { Icon, Alert, Field, Spinner } from './ui'
import { riskFetch, errorFrom } from '../lib/api'

/* Mirrors computeSummary() in the risk service's roiService.js. Kept on the
   client so filling in a missing price recomputes instantly — no second
   request, and no second Anthropic charge, for arithmetic. */
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100

function summarize({ revenue, feePercent, invested }) {
  const fees = round2((revenue * feePercent) / 100)
  const netRevenue = round2(revenue - fees)
  const profit = round2(netRevenue - invested)
  return {
    fees,
    netRevenue,
    profit,
    // null, never Infinity — a break where nothing could be priced has no ROI.
    roiPercent: invested > 0 ? round2((profit / invested) * 100) : null,
  }
}

const money = (n) =>
  n.toLocaleString(undefined, { style: 'currency', currency: 'USD' })

const SAMPLE = `$4123.00
Surging Sparks Elite Trainer Box
Surging Sparks Elite Trainer Box
Prismatic Evolutions Booster Bundle`

export default function BreakRoi() {
  const [rawText, setRawText]   = useState('')
  const [feeInput, setFeeInput] = useState('12')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [result, setResult]     = useState(null)
  // Manual prices for items the catalog couldn't price, keyed by line index.
  const [manual, setManual]     = useState({})

  // Number('') is 0, so an empty box would otherwise read as a valid 0% fee.
  const feePercent = feeInput.trim() === '' ? NaN : Number(feeInput)
  const feeValid = Number.isFinite(feePercent) && feePercent >= 0 && feePercent <= 100

  const analyze = async () => {
    setError(''); setResult(null); setManual({})
    if (!rawText.trim()) { setError('Paste your exported list first.'); return }
    if (!feeValid)       { setError('Fees must be a number between 0 and 100.'); return }
    setLoading(true)
    try {
      const res = await riskFetch('/api/roi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, feePercent }),
      })
      if (!res.ok) throw new Error(await errorFrom(res, 'Could not analyze this break'))
      setResult(await res.json())
    } catch (e) {
      // A 401 means the session ended — say that, don't blame the network.
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  /* Everything below recomputes from the server's line items plus whatever
     prices have been typed in, so the numbers move as you fill gaps. */
  const view = useMemo(() => {
    if (!result) return null

    const manualTotal = result.lineItems.reduce((sum, item, i) => {
      if (item.priced) return sum
      const v = Number(manual[i])
      return Number.isFinite(v) && v > 0 ? sum + v * item.quantity : sum
    }, 0)

    const invested = round2(result.invested + manualTotal)
    const stillUnpriced = result.lineItems.filter(
      (item, i) => !item.priced && !(Number(manual[i]) > 0),
    ).length

    const fee = feeValid ? feePercent : result.feePercent
    return {
      invested,
      stillUnpriced,
      feePercent: fee,
      ...summarize({ revenue: result.revenue, feePercent: fee, invested }),
    }
  }, [result, manual, feePercent, feeValid])

  const canAnalyze = rawText.trim() && feeValid && !loading

  return (
    <section className="panel panel-pad">
      <header className="panel-head">
        <span className="kicker">Risk analysis</span>
        <h2>Break ROI</h2>
        <p>
          Paste a list exported with the Whatnot extension's <b>Copy List</b> button.
          Every product is priced against the sealed-product catalog, then measured
          against what the spots actually sold for.
        </p>
      </header>

      <div className="stack stack-lg">
        <div className="field">
          <span className="field-label">Exported list</span>
          <textarea
            className="textarea roi-paste"
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={SAMPLE}
            spellCheck="false"
            rows={9}
          />
          <span className="field-hint">
            Sales total on the first line, then one product per line. A product
            listed twice counts as two.
          </span>
        </div>

        <div className="field">
          {/* The hint lives below the row, not inside the field: row-inline
              aligns on flex-end, so a hint under the input would drop the
              button by the height of its own text. */}
          <div className="row-inline">
            <div className="roi-fee">
              <Field label="Platform fees">
                <div className="suffix-field">
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={feeInput}
                    onChange={e => setFeeInput(e.target.value)}
                  />
                  <span className="suffix">%</span>
                </div>
              </Field>
            </div>
            <button className="btn btn-primary btn-auto" onClick={analyze} disabled={!canAnalyze}>
              {loading ? <><Spinner /> Pricing…</> : <>{Icon.trend(15)} Analyze break</>}
            </button>
          </div>
          <span className="field-hint">
            Whatnot commission and payment processing, taken off the sales total
            before ROI is calculated.
          </span>
        </div>

        {error && <Alert kind="error">{error}</Alert>}

        {result && view && (
          <ResultView result={result} view={view} manual={manual} setManual={setManual} />
        )}
      </div>
    </section>
  )
}

function ResultView({ result, view, manual, setManual }) {
  const up = view.profit >= 0
  const unpriced = result.lineItems
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !item.priced)

  // The meter reads "how much of what you kept did the product cost you".
  // Over 100% means the break lost money, so the fill saturates and turns.
  const ratio = view.netRevenue > 0 ? view.invested / view.netRevenue : 1
  const fill = Math.max(0, Math.min(1, ratio))

  return (
    <div className="roi-out rv d1">
      {result.warnings.map((w, i) => <Alert key={i} kind="error">{w}</Alert>)}

      {view.stillUnpriced > 0 && (
        <Alert kind="warn">
          <b>{view.stillUnpriced} of {result.lineItems.length} line items have no catalog price.</b>{' '}
          They are left out of the invested total below, so treat it as a floor —
          the real ROI is lower than what's shown. Enter prices to correct it.
        </Alert>
      )}

      {/* Hero: the one number this tool exists to produce. */}
      <div className="roi-hero">
        <span className="roi-hero-label">{up ? 'Profit' : 'Loss'}</span>
        <p className={`roi-hero-value${up ? '' : ' neg'}`}>
          {up ? '+' : '−'}{money(Math.abs(view.profit))}
        </p>
        <span className={`chip${up ? ' chip-pos' : ' chip-neg'}`}>
          {view.roiPercent === null
            ? 'ROI unavailable'
            : `${up ? '+' : '−'}${Math.abs(view.roiPercent).toFixed(1)}% ROI`}
        </span>
      </div>

      {/* Meter: cost as a share of what was kept after fees. */}
      <div className="meter">
        <div className="meter-head">
          <span>Product cost vs. net revenue</span>
          <span className="meter-pct">
            {view.netRevenue > 0 ? `${Math.round(ratio * 100)}%` : '—'}
          </span>
        </div>
        <div className="meter-track">
          <i className={up ? 'meter-fill' : 'meter-fill over'} style={{ width: `${fill * 100}%` }} />
        </div>
        <div className="meter-foot">
          <span>{money(view.invested)} invested</span>
          <span>{money(view.netRevenue)} kept</span>
        </div>
      </div>

      <div className="stat-row">
        <Stat label="Sales total"  value={money(result.revenue)} note={`${result.pastedUnits} spots sold`} />
        <Stat label={`Fees (${view.feePercent}%)`} value={`−${money(view.fees)}`} />
        <Stat label="Net revenue" value={money(view.netRevenue)} />
        <Stat
          label="Invested"
          value={money(view.invested)}
          note={view.stillUnpriced > 0 ? `${view.stillUnpriced} unpriced` : `${result.lineItems.length} line items`}
          warn={view.stillUnpriced > 0}
        />
      </div>

      {unpriced.length > 0 && (
        <div className="unpriced">
          <div className="unpriced-head">
            <span className="kicker">No catalog price</span>
            <p>Enter what these cost you and every total above updates.</p>
          </div>
          {unpriced.map(({ item, i }) => (
            <div key={i} className="unpriced-row">
              <span className="up-name" title={item.raw_text}>{item.raw_text}</span>
              <span className="up-qty">×{item.quantity}</span>
              <div className="suffix-field up-input">
                <span className="prefix">$</span>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={manual[i] ?? ''}
                  onChange={e => setManual(m => ({ ...m, [i]: e.target.value }))}
                  aria-label={`Unit price for ${item.raw_text}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* The table view: every value above is readable here too. */}
      <div className="roi-table-wrap">
        <table className="roi-table">
          <thead>
            <tr>
              <th>Pasted</th>
              <th>Matched product</th>
              <th className="num">Qty</th>
              <th className="num">Unit</th>
              <th className="num">Line total</th>
            </tr>
          </thead>
          <tbody>
            {result.lineItems.map((item, i) => {
              const typed = Number(manual[i])
              const usingTyped = !item.priced && typed > 0
              const unit = item.priced ? item.unit_price : usingTyped ? typed : null
              return (
                <tr key={i} className={unit === null ? 'is-unpriced' : ''}>
                  <td>{item.raw_text}</td>
                  <td>
                    {item.matched_name || <span className="no-match">No match</span>}
                    {item.confidence === 'low' && <span className="chip chip-info sm">low confidence</span>}
                  </td>
                  <td className="num">{item.quantity}</td>
                  <td className="num">
                    {unit === null ? '—' : money(unit)}
                    {usingTyped && <span className="up-flag" title="Price you entered">·</span>}
                  </td>
                  <td className="num">{unit === null ? '—' : money(round2(unit * item.quantity))}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4">Invested</td>
              <td className="num">{money(view.invested)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function Stat({ label, value, note, warn }) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <p className="stat-value">{value}</p>
      {note && <span className={`stat-note${warn ? ' warn' : ''}`}>{note}</span>}
    </div>
  )
}
