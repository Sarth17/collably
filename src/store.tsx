import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { Campaign, PortfolioItem, Role, State } from './types'

const TOKEN = 'collably-token'
export const SHOW_DEMO = import.meta.env.DEV || import.meta.env.VITE_COLLABLY_DEMO === '1'
export const MAX_UPLOAD_MB = import.meta.env.PROD ? 4 : 25
const DEMO_PASSWORD = 'demo1234'
const DEMO: Record<Role, string> = { brand: 'demo-brand@collably.test', creator: 'demo-creator@collably.test', admin: 'demo-admin@collably.test' }
const EMPTY: State = { session: null, creators: [], brands: [], campaigns: [], collabs: [], deliverables: [], messages: [], notifications: [], reports: [], saved: [], portfolio: [] }

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) { super(message); this.status = status }
}

async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const token = localStorage.getItem(TOKEN)
  let res: Response
  try {
    res = await fetch(`/api${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    const msg = typeof e.detail === 'string' ? e.detail : Array.isArray(e.detail) ? e.detail[0]?.msg : undefined
    throw new ApiError(msg ?? 'Something went wrong. Please try again.', res.status)
  }
  return res.json() as Promise<T>
}

export const resetDemo = async () => {
  try { await api('/dev/reset', 'POST') } catch { /* backend may be off */ }
  localStorage.removeItem(TOKEN)
  location.assign('/')
}

// ---- selectors ----
export const cr = (s: State, id: string) => s.creators.find(c => c.id === id)!
export const camp = (s: State, id: string) => s.campaigns.find(k => k.id === id)!
export const brandOf = (s: State, k: Campaign) => s.brands.find(b => b.id === k.brandId)!
export function brandData(s: State) {
  const id = s.session?.userId ?? ''
  const campaigns = s.campaigns.filter(k => k.brandId === id)
  return { id, campaigns, collabs: s.collabs.filter(l => campaigns.some(k => k.id === l.campaignId)) }
}
export function campaignProgress(s: State, id: string) {
  const ids = s.collabs.filter(l => l.campaignId === id && ['accepted', 'active', 'completed'].includes(l.status)).map(l => l.id)
  const ds = s.deliverables.filter(d => ids.includes(d.collabId))
  return ds.length ? Math.round((100 * ds.filter(d => d.status === 'approved').length) / ds.length) : 0
}

// ---- actions: each one calls the backend, then reloads the state ----
type Run = (ok: string, path: string, method?: string, body?: unknown) => Promise<{ id?: string } | undefined>
type RegisterBody = { role: 'brand' | 'creator'; name: string; email: string; password: string }
type Auth = { login: (email: string, password: string) => Promise<boolean>; register: (b: RegisterBody) => Promise<boolean>; logout: () => void }
type NewCampaign = { name: string; description: string; budget: number; deadline: string; deliverables: string[] }

function makeActions(run: Run, auth: Auth, upload: (file: File) => Promise<string | undefined>) {
  return {
    uploadFile: upload,
    ...auth,
    demoLogin: (role: Role) => auth.login(DEMO[role], DEMO_PASSWORD),
    toggleSave: (id: string) => run('Contacts updated', `/saved/${id}`),
    createCampaign: async (i: NewCampaign, creatorIds: string[], launch: boolean) => (await run('Campaign created', '/campaigns', 'POST', { ...i, creatorIds, launch }))?.id,
    launch: (id: string) => run('Campaign launched', `/campaigns/${id}/launch`),
    inviteCreator: (campaignId: string, creatorId: string) => run('Invitation sent', `/campaigns/${campaignId}/invite/${creatorId}`),
    respond: (id: string, accept: boolean) => run('Response sent', `/collabs/${id}/respond`, 'POST', { accept }),
    submit: (id: string, url: string, notes: string) => run('Submitted for review', `/deliverables/${id}/submit`, 'POST', { url, notes }),
    review: (id: string, status: 'in_review' | 'approved' | 'revision_requested', feedback?: string) => run('Review saved', `/deliverables/${id}/review`, 'POST', { status, feedback }),
    send: (collabId: string, text: string) => run('', `/collabs/${collabId}/messages`, 'POST', { text }),
    read: (id: string) => run('', `/notifications/${id}/read`),
    readAll: (_to: string) => run('', '/notifications/read-all'),
    toggleStatus: (id: string) => run('', `/admin/users/${id}/toggle`),
    resolveReport: (id: string, status: 'resolved' | 'dismissed') => run('', `/admin/reports/${id}`, 'POST', { status }),
    savePortfolio: (i: Omit<PortfolioItem, 'id' | 'creatorId' | 'views'> & { id?: string }) => run('Portfolio saved', '/portfolio', 'POST', i),
    deletePortfolio: (id: string) => run('Portfolio item deleted', `/portfolio/${id}`, 'DELETE'),
    updateProfile: (p: { name: string; bio?: string; location?: string; niche?: string; industry?: string; platforms?: string[]; followers?: number; engagement?: number; rateMin?: number; rateMax?: number; profileCompleted?: boolean }) => run('Changes saved', '/profile', 'PUT', p),
  }
}
export type Actions = ReturnType<typeof makeActions>

const Ctx = createContext<{ s: State; a: Actions; ready: boolean } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State>(EMPTY)
  const [ready, setReady] = useState(false)
  const [toast, setToast] = useState('')
  const timer = useRef<number>()
  const say = useCallback((m: string) => { setToast(m); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => setToast(''), 2500) }, [])

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(TOKEN)) { setS(EMPTY); return }
    try { setS(await api<State>('/state')) } catch (e) { if ((e as ApiError).status === 401) { localStorage.removeItem(TOKEN); setS(EMPTY) } }
  }, [])
  useEffect(() => { refresh().finally(() => setReady(true)) }, [refresh])
  // Pick up other people's changes (new invitations, messages) every few seconds.
  useEffect(() => {
    const t = window.setInterval(() => { if (document.visibilityState === 'visible') refresh() }, 5000)
    return () => window.clearInterval(t)
  }, [refresh])

  const upload = useCallback(async (file: File): Promise<string | undefined> => {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
      say(`Files must be ${MAX_UPLOAD_MB} MB or smaller`)
      return
    }
    const token = localStorage.getItem(TOKEN)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/uploads', { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new ApiError(typeof e.detail === 'string' ? e.detail : 'Upload failed', res.status) }
      const result = await res.json() as { url: string }
      return result.url
    } catch (e) { say((e as Error).message); return undefined }
  }, [say])
  const run = useCallback<Run>(async (ok, path, method = 'POST', body) => {
    try { const r = await api<{ id?: string }>(path, method, body); await refresh(); if (ok) say(ok); return r } catch (e) { say((e as Error).message); return undefined }
  }, [refresh, say])
  const enter = useCallback(async (path: string, body: unknown) => {
    try { const r = await api<{ token: string }>(path, 'POST', body); localStorage.setItem(TOKEN, r.token); await refresh(); return true } catch (e) { say((e as Error).message); return false }
  }, [refresh, say])
  const auth = useMemo<Auth>(() => ({
    login: (email, password) => enter('/auth/login', { email, password }),
    register: b => enter('/auth/register', b),
    logout: () => { localStorage.removeItem(TOKEN); setS(EMPTY) },
  }), [enter])
  const a = useMemo(() => makeActions(run, auth, upload), [run, auth, upload])

  return (
    <Ctx.Provider value={{ s, a, ready }}>
      {children}
      {toast && <div role="status" className="toast">{toast}</div>}
    </Ctx.Provider>
  )
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('StoreProvider is missing')
  return c
}
