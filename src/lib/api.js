// Empty means "same site": the Vite dev/preview server answers /api itself.
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '')

// The free Render server can take about a minute to wake up after a quiet period.
const DEFAULT_TIMEOUT_MS = 75_000

export const SURPRISE_ID = /^[a-z0-9]{10}$/

export class ApiError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message)
    this.status = status
    this.retryable = retryable
  }
}

export function apiUrl(path) {
  return `${API_BASE}${path}`
}

export async function requestJson(path, { timeoutMs = DEFAULT_TIMEOUT_MS, ...init } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(apiUrl(path), { ...init, signal: controller.signal })
    const body = await response.json().catch(() => null)
    return { status: response.status, ok: response.ok, body }
  } catch {
    throw new ApiError(
      controller.signal.aborted
        ? 'The birthday server took too long to answer. Please try again.'
        : 'Could not reach the birthday server. Check your internet connection and try again.',
      { retryable: true },
    )
  } finally {
    clearTimeout(timer)
  }
}
