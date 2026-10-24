const KEY = 'st96-internal'

export function applyInternalFlag() {
  try {
    const v = new URLSearchParams(location.search).get('internal')
    if (v === 'on') localStorage.setItem(KEY, '1')
    if (v === 'off') localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
}

export function isInternal() {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}
