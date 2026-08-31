/* ==========================================================================
   Shared UI primitives — one stroke weight, one geometry, one voice.
   Every icon is a 16-unit line icon drawn in currentColor so it inherits
   whatever the surrounding class sets (muted, gold, negative, ...).
   ========================================================================== */

const svg = (size, children, extra = {}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...extra}
  >
    {children}
  </svg>
)

export const Icon = {
  home: (s = 16) => svg(s, <>
    <rect x="2" y="2" width="5" height="5" rx="1.4" />
    <rect x="9" y="2" width="5" height="5" rx="1.4" />
    <rect x="2" y="9" width="5" height="5" rx="1.4" />
    <rect x="9" y="9" width="5" height="5" rx="1.4" />
  </>),

  report: (s = 16) => svg(s, <>
    <path d="M3.5 2.5h6l3 3v8a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
    <path d="M9.5 2.5v3h3" />
    <path d="M5.5 8.5h5M5.5 11h3" />
  </>),

  layers: (s = 16) => svg(s, <>
    <path d="M8 1.8 14.2 5 8 8.2 1.8 5 8 1.8Z" />
    <path d="m1.8 8 6.2 3.2L14.2 8" />
    <path d="m1.8 11 6.2 3.2L14.2 11" />
  </>),

  broadcast: (s = 16) => svg(s, <>
    <circle cx="8" cy="8" r="2" />
    <path d="M4.6 4.6a4.8 4.8 0 0 0 0 6.8M11.4 4.6a4.8 4.8 0 0 1 0 6.8" />
    <path d="M2.4 2.4a8 8 0 0 0 0 11.2M13.6 2.4a8 8 0 0 1 0 11.2" />
  </>),

  key: (s = 16) => svg(s, <>
    <circle cx="5.5" cy="10.5" r="3" />
    <path d="m7.7 8.3 5.6-5.6M11.4 4.6l1.6 1.6M9.8 6.2l1.6 1.6" />
  </>),

  signout: (s = 16) => svg(s, <>
    <path d="M6 14H3.5a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1H6" />
    <path d="M10.5 11 13.5 8l-3-3M13.5 8H6" />
  </>),

  arrowLeft: (s = 16) => svg(s, <path d="M9.5 3.5 5 8l4.5 4.5" />),
  arrowRight: (s = 16) => svg(s, <path d="M6.5 3.5 11 8l-4.5 4.5" />),

  check: (s = 16) => svg(s, <path d="m3.5 8.5 3 3 6-7" />),
  checkCircle: (s = 16) => svg(s, <>
    <circle cx="8" cy="8" r="6.2" />
    <path d="m5.4 8.2 1.9 1.9 3.5-4" />
  </>),
  alert: (s = 16) => svg(s, <>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 5v3.6M8 10.9v.1" />
  </>),
  x: (s = 16) => svg(s, <path d="m4 4 8 8M12 4l-8 8" />),

  upload: (s = 16) => svg(s, <>
    <path d="M8 10.5V2.8M5.2 5.6 8 2.8l2.8 2.8" />
    <path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
  </>),
  download: (s = 16) => svg(s, <>
    <path d="M8 2.8v7.7M5.2 7.7 8 10.5l2.8-2.8" />
    <path d="M2.5 10.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" />
  </>),
  file: (s = 16) => svg(s, <>
    <path d="M4 2.5h5l3 3v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-10a1 1 0 0 1 1-1Z" />
    <path d="M9 2.5v3h3" />
  </>),
  refresh: (s = 16) => svg(s, <>
    <path d="M13.3 7A5.4 5.4 0 0 0 3.6 4.8M2.7 9A5.4 5.4 0 0 0 12.4 11.2" />
    <path d="M13.5 3.4V7h-3.4M2.5 12.6V9h3.4" />
  </>),

  mail: (s = 16) => svg(s, <>
    <rect x="2" y="3.5" width="12" height="9" rx="1.4" />
    <path d="m2.4 4.6 5.6 4 5.6-4" />
  </>),
  lock: (s = 16) => svg(s, <>
    <rect x="3" y="7" width="10" height="7" rx="1.6" />
    <path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7" />
  </>),
  link: (s = 16) => svg(s, <>
    <path d="M6.8 9.2a2.6 2.6 0 0 0 3.7 0l2.2-2.2a2.6 2.6 0 1 0-3.7-3.7l-1 1" />
    <path d="M9.2 6.8a2.6 2.6 0 0 0-3.7 0L3.3 9a2.6 2.6 0 1 0 3.7 3.7l1-1" />
  </>),
  external: (s = 16) => svg(s, <>
    <path d="M9.5 2.5H13.5V6.5M13.5 2.5 7.8 8.2" />
    <path d="M12.5 9.5v3a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3" />
  </>),
  clock: (s = 16) => svg(s, <>
    <circle cx="8" cy="8" r="6.2" />
    <path d="M8 4.6V8l2.2 1.4" />
  </>),
  trend: (s = 16) => svg(s, <>
    <path d="M1.8 11.2 6 7l2.6 2.6L14.2 4" />
    <path d="M10.4 4h3.8v3.8" />
  </>),

  sparkle: (s = 16) => svg(s, <>
    <path d="M8 2.2 9.3 6l3.8 1.3-3.8 1.3L8 12.4 6.7 8.6 2.9 7.3 6.7 6 8 2.2Z" />
  </>),
}

/* ---------- small composites ---------- */

export function Logo({ large = false, sub }) {
  return (
    <div className="auth-brand">
      <div className={large ? 'logo-mark lg' : 'logo-mark'} />
      <div style={{ textAlign: 'center' }}>
        <div className="wordmark">RIPZILLA</div>
        {sub && <div className="kicker" style={{ marginTop: 8 }}>{sub}</div>}
      </div>
    </div>
  )
}

export function Alert({ kind = 'error', children }) {
  const icon = kind === 'success' ? Icon.checkCircle(15) : kind === 'note' ? Icon.sparkle(15) : Icon.alert(15)
  return (
    <div className={`alert alert-${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="ic">{icon}</span>
      <span>{children}</span>
    </div>
  )
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}
