// Base URL of the backend API.
// In local dev, Vite proxies nothing, so we hit the FastAPI server directly.
// In production, set VITE_API_URL to your deployed backend's URL (Render).
const API_BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function fitReactionOrder({ time, concentration, maxOrder, timeUnit, concentrationUnit }) {
  const res = await fetch(`${API_BASE}/api/fit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      time,
      concentration,
      max_order: maxOrder,
      time_unit: timeUnit,
      concentration_unit: concentrationUnit,
    }),
  })

  const data = await res.json()

  if (!res.ok) {
    const message = Array.isArray(data.detail)
      ? data.detail.map((d) => d.msg).join(' ')
      : data.detail || 'Request failed.'
    throw new Error(message)
  }

  return data
}
