/* ==========================================================================
   Session policy
   --------------------------------------------------------------------------
   Supabase defaults to persistSession + autoRefreshToken, which means a login
   is renewed indefinitely — come back a week later and you are still signed
   in. That is the behaviour this module ends.

   Two independent limits, whichever hits first:
     · IDLE      — 8h with no interaction (covers the walked-away laptop)
     · ABSOLUTE  — 24h since sign-in regardless of activity (caps a stolen
                   session's useful life even if it is being actively used)

   Expiry calls supabase.auth.signOut(), which REVOKES the refresh token
   server-side — so this is a real session end, not just a UI redirect.

   Defence in depth: also set JWT expiry / session timeouts in the Supabase
   dashboard (Authentication → Sessions). Anything enforced only in the
   browser can be bypassed by someone holding a stolen refresh token.
   ========================================================================== */

export const IDLE_LIMIT_MS     = 8 * 60 * 60 * 1000   // 8 hours
export const ABSOLUTE_LIMIT_MS = 24 * 60 * 60 * 1000  // 24 hours
export const WARN_BEFORE_MS    = 2 * 60 * 1000        // warn 2 minutes out

const K_LAST    = 'rz.session.lastActivity'
const K_STARTED = 'rz.session.startedAt'

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart']
const THROTTLE_MS = 30 * 1000
const TICK_MS = 1000

// localStorage throws in some privacy modes — never let that break the app.
function read(key) {
  try {
    const v = window.localStorage.getItem(key)
    const n = v ? Number(v) : NaN
    return Number.isFinite(n) ? n : null
  } catch { return null }
}
function write(key, value) {
  try { window.localStorage.setItem(key, String(value)) } catch { /* ignore */ }
}
function drop(key) {
  try { window.localStorage.removeItem(key) } catch { /* ignore */ }
}

/** Stamp a brand-new session. Call on SIGNED_IN. */
export function beginSession() {
  const now = Date.now()
  write(K_STARTED, now)
  write(K_LAST, now)
}

/** Clear the stamps. Call on SIGNED_OUT. */
export function endSession() {
  drop(K_STARTED)
  drop(K_LAST)
}

/** Push the idle deadline out. Called on real interaction, and by "Stay signed in". */
export function recordActivity() {
  write(K_LAST, Date.now())
}

/**
 * Where the current session stands.
 *   ok       — still valid; msRemaining until the nearer of the two deadlines
 *   expired  — past a deadline; `reason` is 'idle' | 'absolute'
 *   unknown  — no stamps found (a session predating this policy, or cleared
 *              storage). Treated as untrusted by the caller.
 */
export function inspectSession(now = Date.now()) {
  const startedAt = read(K_STARTED)
  const lastActive = read(K_LAST)
  if (!startedAt || !lastActive) return { status: 'unknown' }

  const idleDeadline = lastActive + IDLE_LIMIT_MS
  const absDeadline  = startedAt + ABSOLUTE_LIMIT_MS
  const deadline     = Math.min(idleDeadline, absDeadline)
  const reason       = idleDeadline <= absDeadline ? 'idle' : 'absolute'

  if (now >= deadline) return { status: 'expired', reason }
  return { status: 'ok', reason, deadline, msRemaining: deadline - now }
}

/**
 * Watch the session while the user is signed in.
 *
 * Checks on a timer AND on tab focus / visibility, so returning to a laptop
 * that was asleep for two days is caught immediately rather than on the next
 * tick. While the warning is showing, passive activity no longer extends the
 * session — the user has to acknowledge it, otherwise merely moving the mouse
 * would silently cancel a warning they never saw.
 *
 * Returns a cleanup function.
 */
export function startSessionGuard({ onWarn, onClear, onExpire }) {
  let warning = false
  let lastTouch = 0
  let stopped = false

  const touch = () => {
    if (stopped || warning) return
    const now = Date.now()
    if (now - lastTouch < THROTTLE_MS) return
    lastTouch = now
    recordActivity()
  }

  const check = () => {
    if (stopped) return
    const state = inspectSession()

    if (state.status !== 'ok') {
      stopped = true
      onExpire?.(state.status === 'expired' ? state.reason : 'unknown')
      return
    }

    if (state.msRemaining <= WARN_BEFORE_MS) {
      warning = true
      onWarn?.(state.msRemaining)
    } else if (warning) {
      warning = false
      onClear?.()
    }
  }

  ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, touch, { passive: true }))
  const onVisible = () => { if (document.visibilityState === 'visible') check() }
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', check)

  const timer = setInterval(check, TICK_MS)
  check()

  return () => {
    stopped = true
    clearInterval(timer)
    ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, touch))
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', check)
  }
}

/** Dismiss a warning and keep working. */
export function extendSession() {
  recordActivity()
}
