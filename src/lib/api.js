/* ==========================================================================
   Authenticated API client
   --------------------------------------------------------------------------
   Every call to a Ripzilla service carries the caller's Supabase access
   token; the service verifies it and rejects anything unsigned or expired.
   Centralised here so no call site can forget the header, and so a 401 is
   handled one way everywhere: end the session and bounce to the login screen.

   Two backends, one token. Use apiFetch for the breaks/report API and
   riskFetch for the risk-analysis service.
   ========================================================================== */

import { supabase } from '../supabaseClient'

/**
 * A base URL with no scheme is a *relative path* to fetch(), so
 * "my-service.up.railway.app" silently resolves against our own origin and
 * 404s from the frontend host instead of ever reaching the service. Easy
 * mistake to make in a hosting dashboard and confusing to debug, so normalise
 * it here and say so.
 */
function normalizeBase(url, name) {
  if (!url) return ''
  let base = url.trim().replace(/\/+$/, '')  // no trailing slash; paths add their own
  if (!/^https?:\/\//i.test(base)) {
    console.warn(`${name} is missing https:// — assuming https://${base}`)
    base = `https://${base}`
  }
  return base
}

const API_URL      = normalizeBase(import.meta.env.VITE_API_URL, 'VITE_API_URL')
const RISK_API_URL = normalizeBase(import.meta.env.VITE_RISK_API_URL, 'VITE_RISK_API_URL')

export const SESSION_EXPIRED_MESSAGE = 'Your session has expired. Please sign in again.'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function authedFetch(base, path, options, serviceName) {
  if (!base) {
    throw new ApiError(
      `${serviceName} is not configured. Set its URL in the environment and reload.`,
      0,
    )
  }

  // getSession() transparently refreshes an expired access token.
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  if (!token) {
    await supabase.auth.signOut()
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401)
  }

  const headers = new Headers(options.headers || {})
  headers.set('Authorization', `Bearer ${token}`)

  let res
  try {
    res = await fetch(`${base}${path}`, { ...options, headers })
  } catch {
    throw new ApiError(`Could not reach ${serviceName}. Check that the service is running.`, 0)
  }

  if (res.status === 401) {
    // Token rejected server-side — the session is over regardless of what the
    // client thinks. Sign out so the UI can't sit in a half-authenticated state.
    await supabase.auth.signOut()
    throw new ApiError(SESSION_EXPIRED_MESSAGE, 401)
  }

  return res
}

/**
 * fetch() against the breaks/report API with a bearer token attached.
 * Returns the raw Response so callers keep using .json() / .blob() as before.
 */
export function apiFetch(path, options = {}) {
  return authedFetch(API_URL, path, options, 'the API')
}

/** Same, against the risk-analysis service (ROI pricing). */
export function riskFetch(path, options = {}) {
  return authedFetch(RISK_API_URL, path, options, 'the risk-analysis service')
}

/** Pull a useful message out of a failed response body. */
export async function errorFrom(res, fallback) {
  try {
    const body = await res.json()
    return body.detail || body.error || fallback
  } catch {
    return fallback
  }
}
