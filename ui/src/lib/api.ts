import type { Session, Snapshot } from '../types'

async function request<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed: ${res.status}`)
  }
  return res.json()
}

export const api = {
  getSessions: () => request<Session[]>('/api/sessions'),

  createSession: (name: string) =>
    request<Session>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  stopSession: (vmid: number) =>
    request<{ ok: boolean }>(`/api/sessions/${vmid}/stop`, { method: 'POST' }),

  startSession: (vmid: number) =>
    request<{ ok: boolean }>(`/api/sessions/${vmid}/start`, { method: 'POST' }),

  destroySession: (vmid: number) =>
    request<{ ok: boolean }>(`/api/sessions/${vmid}`, { method: 'DELETE' }),

  getSnapshots: (vmid: number) =>
    request<Snapshot[]>(`/api/sessions/${vmid}/snapshots`),

  createSnapshot: (vmid: number, name: string, description: string) =>
    request<{ ok: boolean }>(`/api/sessions/${vmid}/snapshots`, {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    }),

  rollbackSnapshot: (vmid: number, snapname: string) =>
    request<{ ok: boolean }>(
      `/api/sessions/${vmid}/snapshots/${snapname}/rollback`,
      { method: 'POST' },
    ),
}
