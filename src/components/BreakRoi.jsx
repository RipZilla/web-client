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

/**
 * A typed price of 0 is a real answer -- "this is a known dud" -- and must be
 * distinguishable from "I haven't looked at this yet". Using `> 0` as the test
 * meant a stack of 238 worthless packs could never clear the optimistic-ROI
 * caveat. Returns the number, or null when nothing has been entered.
 */
function enteredPrice(raw) {
  if (raw === undefined || raw === null || String(raw).trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : null
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
      const data = await res.json()
      setResult(data)

      // A weak match is uncertain, not absent. Leaving it blank made a correct
      // match read as "no price" and quietly dropped it from invested -- the
      // same understatement the review flow exists to prevent, just arrived at
      // from the other side. Seed the field with the catalog's own guess so the
      // total is complete, and keep the row listed so it still gets confirmed.
      const seeded = {}
      data.lineItems.forEach((item, i) => {
        if (item.needs_review && item.suggested_price !== null) {
          seeded[i] = String(item.suggested_price)
        }
      })
      setManual(seeded)
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
      const v = enteredPrice(manual[i])
      return v === null ? sum : sum + v * item.quantity
    }, 0)

    const invested = round2(result.invested + manualTotal)
    const stillUnpriced = result.lineItems.filter(
      (item, i) => !item.priced && enteredPrice(manual[i]) === null,
    ).length

    const seededCount = result.lineItems.filter((item, i) => {
      if (!item.needs_review || item.suggested_price === null) return false
      return enteredPrice(manual[i]) === item.suggested_price
    }).length

    const fee = feeValid ? feePercent : result.feePercent
    return {
      invested,
      stillUnpriced,
      seededCount,
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
  // Biggest stacks first: one entry on a 238x line moves the total far more
  // than a 1x line, so it should not be buried at the bottom of the list.
  const unpriced = result.lineItems
    .map((item, i) => ({ item, i }))
    .filter(({ item }) => !item.priced)
    .sort((a, b) => b.item.quantity - a.item.quantity)

  // Only genuinely unmatched items are safe to bulk-zero. A weak match already
  // has a candidate price, so it needs a decision, not a default.
  const bulkZeroable = unpriced.filter(
    ({ item, i }) => !item.needs_review && enteredPrice(manual[i]) === null,
  )
  const reviewPending = unpriced.filter(
    ({ item, i }) => item.needs_review && enteredPrice(manual[i]) === null,
  ).length

  // The meter reads "how much of what you kept did the product cost you".
  // Over 100% means the break lost money, so the fill saturates and turns.
  const ratio = view.netRevenue > 0 ? view.invested / view.netRevenue : 1
  const fill = Math.max(0, Math.min(1, ratio))

  return (
    <div className="roi-out rv d1">
      {result.warnings.map((w, i) => <Alert key={i} kind="warn">{w}</Alert>)}

      {view.stillUnpriced > 0 && (
        <Alert kind="warn">
          <b>{view.stillUnpriced} of {result.lineItems.length} line items have no catalog price.</b>{' '}
          They are left out of the invested total below, so treat it as a floor —
          the real ROI is lower than what's shown. Enter prices to correct it.
        </Alert>
      )}

      {view.seededCount > 0 && (
        <Alert kind="note">
          <b>{view.seededCount} match{view.seededCount === 1 ? '' : 'es'} scored low and {view.seededCount === 1 ? 'is' : 'are'} counted at the catalog's best guess.</b>{' '}
          They're included in the total below and listed for confirmation — worth
          a glance, since a wrong guess moves ROI.
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
            <span className="kicker">Needs a price</span>
            <p>
              Largest quantities first — those move the total most. A price of
              <b> $0</b> is a valid answer for a known dud and counts as settled.
            </p>
          </div>

          {unpriced.map(({ item, i }) => {
            const typed = enteredPrice(manual[i])
            const lineTotal = typed === null ? null : round2(typed * item.quantity)
            return (
              <div key={i} className={`unpriced-row${typed !== null ? ' done' : ''}`}>
                <span className="up-qty">×{item.quantity}</span>
                <div className="up-main">
                  <span className="up-name" title={item.raw_text}>{item.raw_text}</span>
                  {item.needs_review && (
                    <span className="up-why">
                      weak match: {item.matched_name}
                      {item.suggested_price !== null && ` at ${money(item.suggested_price)}`}
                      {item.match_score !== null && ` · score ${item.match_score}`}
                    </span>
                  )}
                </div>
                <span className="up-line">
                  {lineTotal === null ? '' : money(lineTotal)}
                </span>
                <div className="suffix-field up-input">
                  <span className="prefix">$</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder={item.suggested_price !== null ? String(item.suggested_price) : '0.00'}
                    value={manual[i] ?? ''}
                    onChange={e => setManual(m => ({ ...m, [i]: e.target.value }))}
                    aria-label={`Unit price for ${item.raw_text}`}
                  />
                </div>
              </div>
            )
          })}

          {bulkZeroable.length > 0 && (
            <div className="unpriced-foot">
              <button
                className="btn btn-quiet"
                onClick={() => setManual(m => {
                  const next = { ...m }
                  // Blank entries only — never overwrites a typed price. And
                  // never touches a weak match: those carry a real candidate
                  // price, so bulk-zeroing one would quietly delete value
                  // (the SPC line here is a genuine $263.72 item).
                  bulkZeroable.forEach(({ i }) => { next[i] = '0' })
                  return next
                })}
              >
                Mark {bulkZeroable.length} unmatched item
                {bulkZeroable.length === 1 ? '' : 's'} as $0
              </button>
              {reviewPending > 0 && (
                <span className="unpriced-note">
                  {reviewPending} weak match{reviewPending === 1 ? '' : 'es'} left out —
                  confirm {reviewPending === 1 ? 'it' : 'them'} individually.
                </span>
              )}
            </div>
          )}
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
              const typed = enteredPrice(manual[i])
              const usingTyped = !item.priced && typed !== null
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
