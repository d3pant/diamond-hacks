const API_BASE = import.meta.env.VITE_API_URL ?? ''

const BACKEND_DOWN_HINT =
  "Cannot reach the API at http://127.0.0.1:8000. Start it in another terminal: cd backend && source venv/bin/activate && uvicorn main:app --reload --host 127.0.0.1 --port 8000 — or from frontend: npm run dev:stack (starts Vite + API together)."

async function fetchApi(url, init) {
  let res
  try {
    res = await fetch(url, init)
  } catch (e) {
    throw new Error(`${BACKEND_DOWN_HINT}\n\n(${e.message})`)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (res.status === 502 || res.status === 503 || res.status === 504) {
      throw new Error(`${BACKEND_DOWN_HINT}\n\n(Proxy HTTP ${res.status})`)
    }
    const msg = data.detail ?? (typeof data === 'string' ? data : res.statusText)
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return { res, data }
}

export async function postAnalyse(files, text, { merge = false } = {}) {
  const form = new FormData()
  if (files?.length) {
    for (const file of files) {
      form.append('files', file)
    }
  }
  if (text?.trim()) {
    form.append('text', text.trim())
  }
  if (merge) {
    form.append('merge_previous', 'true')
  }
  const { res, data } = await fetchApi(`${API_BASE}/api/analyse`, {
    method: 'POST',
    body: form,
  })
  return { status: res.status, data }
}

export async function postApproveComplete() {
  const { data } = await fetchApi(`${API_BASE}/api/approve-complete`, { method: 'POST' })
  return data
}

export async function fetchResultsBundle() {
  const { data } = await fetchApi(`${API_BASE}/api/results/bundle`)
  return data
}

export async function fetchSurgeryBreakdown() {
  const { data } = await fetchApi(`${API_BASE}/api/patient/surgery-breakdown`)
  return data
}

export async function fetchPatientProfileStatus() {
  const { data } = await fetchApi(`${API_BASE}/api/patient/profile/status`)
  return data
}

export async function postPatientProfile(profile) {
  const { data } = await fetchApi(`${API_BASE}/api/patient/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  return data
}
