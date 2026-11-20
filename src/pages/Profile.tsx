import { useState, type ChangeEvent } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { BadgeCheck, Bookmark, BookmarkCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import { brandData, brandOf, camp, useStore } from '../store'
import { Avatar, Badge, Empty, PageHeader, Stat, fmtN } from '../ui'
import type { PortfolioItem } from '../types'

const TILES = ['bg-violet-100', 'bg-rose-100', 'bg-amber-100', 'bg-emerald-100', 'bg-sky-100', 'bg-orange-100']
const PLATFORMS = ['Instagram', 'YouTube', 'TikTok', 'Twitch', 'Pinterest', 'LinkedIn']

function Tile({ p }: { p: PortfolioItem }) {
  const h = [...p.id].reduce((a, c) => a + c.charCodeAt(0), 0) % 6
  return (
    <a href={p.url} target="_blank" rel="noreferrer" className="card block overflow-hidden p-0">
      <div className={`flex h-28 items-end p-3 text-xs font-medium ${TILES[h]}`} style={p.url.startsWith('/uploads/') ? { backgroundImage: `url(${p.url})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>{p.platform}{p.url.startsWith('/uploads/') && <span className="ml-auto rounded bg-black/50 px-2 py-1 text-white">Uploaded media</span>}</div>
      <div className="p-3 text-sm">
        <b>{p.title}</b>
        <div className="text-xs text-muted">{p.category}, {fmtN(p.views)} views</div>
        <p className="mt-1 text-xs">{p.description}</p>
      </div>
    </a>
  )
}

export function CreatorProfile() {
  const { id } = useParams()
  const { s, a } = useStore()
  const [k, setK] = useState('')
  const c = s.creators.find(x => x.id === id)
  if (!c) return <Empty text="Creator not found." />
  const items = s.portfolio.filter(p => p.creatorId === c.id)
  const done = s.collabs.filter(l => l.creatorId === c.id && l.status === 'completed')
  const open = brandData(s).campaigns.filter(x => x.status !== 'draft' && x.status !== 'completed')
  const saved = s.saved.includes(c.id)
  const invited = !!k && s.collabs.some(l => l.campaignId === k && l.creatorId === c.id && l.status !== 'rejected')
  const avg = items.length ? Math.round(items.reduce((t, p) => t + p.views, 0) / items.length) : 0
  return (
    <>
      <Link to="/brand/discover" className="text-sm text-muted hover:text-accent">Back to discovery</Link>
      <div className="mt-3 h-24 rounded-xl bg-accent/15" />
      <div className="card mt-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex gap-3">
            <Avatar name={c.name} />
            <div>
              <h1 className="flex items-center gap-1 text-xl font-semibold">{c.name}{c.verified && <BadgeCheck size={16} className="text-accent" aria-label="Verified" />}</h1>
              <div className="text-sm text-muted">@{c.handle}, {c.niche} in {c.location}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn" onClick={() => a.toggleSave(c.id)}>{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{saved ? 'Saved' : 'Save creator'}</button>
            <select aria-label="Campaign" className="btn" value={k} onChange={e => setK(e.target.value)}>
              <option value="">{open.length ? 'Choose campaign' : 'No open campaigns'}</option>
              {open.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
            <button className="btn btn-p" disabled={!k || invited} onClick={() => a.inviteCreator(k, c.id)}>{invited ? 'Invited' : 'Invite to campaign'}</button>
          </div>
        </div>
        <p className="mt-4 text-sm">{c.bio}</p>
        <p className="mt-1 text-sm text-muted">Active on {c.platforms.join(', ')}.</p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Followers · self-reported" value={fmtN(c.followers)} />
        <Stat label="Engagement · self-reported" value={`${c.engagement}%`} />
        <Stat label="Average views" value={fmtN(avg)} />
        <Stat label="Completed collaborations" value={done.length} />
      </div>
      <p className="mt-2 text-xs text-muted">Audience and engagement metrics are self-reported and not verified by Collably.</p>
      {(c.rateMin || c.rateMax) ? <p className="mt-2 text-sm text-muted">Estimated rate: ₹{(c.rateMin ?? 0).toLocaleString('en-IN')} – ₹{(c.rateMax ?? 0).toLocaleString('en-IN')} per collaboration</p> : null}
      <h2 className="mb-3 mt-6 font-semibold">Portfolio</h2>
      {items.length ? <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">{items.map(p => <Tile key={p.id} p={p} />)}</div> : <Empty text="This creator has not added portfolio items yet." />}
      <h2 className="mb-3 mt-6 font-semibold">Previous collaborations</h2>
      {done.length ? done.map(l => { const x = camp(s, l.campaignId); return (
        <div key={l.id} className="card mb-2 flex items-center justify-between text-sm"><span>{x.name}<small className="block text-muted">{brandOf(s, x).name}</small></span><Badge s={l.status} /></div>
      ) }) : <Empty text="No completed collaborations yet." />}
    </>
  )
}

function PortfolioForm({ item, onClose }: { item?: PortfolioItem; onClose: () => void }) {
  const { a } = useStore()
  const [f, setF] = useState({ title: item?.title ?? '', description: item?.description ?? '', category: item?.category ?? '', platform: item?.platform ?? 'Instagram', url: item?.url ?? '' })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value })
  const save = async () => {
    if (!f.title.trim() || (!file && !/^https?:\/\/\S+$/.test(f.url))) { setErr('Add a title and either a valid link or upload a file.'); return }
    setErr(''); setUploading(true)
    const uploadedUrl = file ? await a.uploadFile(file) : f.url
    setUploading(false)
    if (!uploadedUrl) return
    a.savePortfolio({ ...f, url: uploadedUrl, title: f.title.trim(), id: item?.id })
    onClose()
  }
  return (
    <div className="card mb-4 space-y-3 text-sm">
      <h2 className="font-semibold">{item ? 'Edit portfolio item' : 'Add portfolio item'}</h2>
      <label className="block">Title<input className="input mt-1" value={f.title} onChange={set('title')} /></label>
      <label className="block">Description<textarea className="input mt-1" rows={2} value={f.description} onChange={set('description')} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">Category<input className="input mt-1" value={f.category} onChange={set('category')} /></label>
        <label className="block">Platform<select className="input mt-1" value={f.platform} onChange={set('platform')}>{PLATFORMS.map(p => <option key={p}>{p}</option>)}</select></label>
      </div>
      <label className="block">Content URL (optional if uploading)<input className="input mt-1" placeholder="https://" value={f.url} onChange={set('url')} /></label>
      <label className="block">Upload portfolio media (image, video or PDF; max 25 MB)<input className="input mt-1" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
      {file && <p className="text-xs text-muted">Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)</p>}
      {err && <p role="alert" className="text-red-600">{err}</p>}
      <div className="flex gap-2"><button className="btn btn-p" disabled={uploading} onClick={save}>{uploading ? 'Uploading…' : 'Save item'}</button><button className="btn" onClick={onClose}>Cancel</button></div>
    </div>
  )
}

export function PortfolioPage() {
  const { s, a } = useStore()
  const me = s.session!.userId
  const items = s.portfolio.filter(p => p.creatorId === me)
  const [edit, setEdit] = useState<PortfolioItem | 'new' | null>(null)
  return (
    <>
      <PageHeader title="Portfolio" action={<button className="btn btn-p" onClick={() => setEdit('new')}><Plus size={14} />Add item</button>} />
      {edit && <PortfolioForm key={edit === 'new' ? 'new' : edit.id} item={edit === 'new' ? undefined : edit} onClose={() => setEdit(null)} />}
      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {items.map(p => (
            <div key={p.id}>
              <Tile p={p} />
              <div className="mt-2 flex gap-2">
                <button className="btn" onClick={() => setEdit(p)}><Pencil size={14} />Edit</button>
                <button className="btn" onClick={() => { if (confirm(`Delete “${p.title}”?`)) a.deletePortfolio(p.id) }}><Trash2 size={14} />Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : <Empty text="No portfolio items yet. Add your best work so brands can see it." />}
    </>
  )
}

export function Settings() {
  const { s, a } = useStore()
  const ses = s.session!
  const c = s.creators.find(x => x.id === ses.userId)
  const b = s.brands.find(x => x.id === ses.userId)
  const [f, setF] = useState({ name: c?.name ?? b?.name ?? '', bio: c?.bio ?? '', location: c?.location ?? '', niche: c?.niche ?? '', industry: b?.industry ?? '' })
  const [saved, setSaved] = useState(false)
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setSaved(false); setF({ ...f, [k]: e.target.value }) }
  return (
    <>
      <PageHeader title={ses.role === 'creator' ? 'Profile and settings' : 'Settings'} />
      <div className="card max-w-xl space-y-3 text-sm">
        <label className="block">{ses.role === 'creator' ? 'Name' : 'Organization name'}<input className="input mt-1" value={f.name} onChange={set('name')} /></label>
        {c && <>
          <label className="block">Niche<input className="input mt-1" value={f.niche} onChange={set('niche')} /></label>
          <label className="block">Location<input className="input mt-1" value={f.location} onChange={set('location')} /></label>
          <label className="block">Biography<textarea className="input mt-1" rows={3} value={f.bio} onChange={set('bio')} /></label>
        </>}
        {b && <label className="block">Industry<input className="input mt-1" value={f.industry} onChange={set('industry')} /></label>}
        <div className="flex items-center gap-3">
          <button className="btn btn-p" onClick={() => { a.updateProfile(f); setSaved(true) }}>Save changes</button>
          {saved && <span role="status" className="text-emerald-700">Changes saved.</span>}
        </div>
      </div>
    </>
  )
}


export function CreatorSetup() {
  const { s, a } = useStore()
  const nav = useNavigate()
  const me = s.session?.userId
  const c = s.creators.find(x => x.id === me)
  const [f, setF] = useState({
    name: c?.name ?? '', niche: c?.niche === 'General' ? '' : c?.niche ?? '',
    bio: c?.bio ?? '', location: c?.location ?? '', platforms: c?.platforms ?? [],
    followers: c?.followers ?? 0, engagement: c?.engagement ?? 0, rateMin: c?.rateMin ?? 0, rateMax: c?.rateMax ?? 0,
  })
  const [err, setErr] = useState('')
  if (!c) return <Empty text="Creator profile not found." />
  const platforms = ['Instagram', 'YouTube', 'TikTok', 'Twitch', 'Pinterest', 'LinkedIn']
  const togglePlatform = (p: string) => setF(prev => ({ ...prev, platforms: prev.platforms.includes(p) ? prev.platforms.filter(x => x !== p) : [...prev.platforms, p] }))
  const save = async () => {
    if (!f.name.trim() || !f.niche.trim() || !f.bio.trim() || !f.location.trim() || f.platforms.length === 0) {
      setErr('Complete your name, niche, bio, location and select at least one platform.')
      return
    }
    if (f.rateMax > 0 && f.rateMin > f.rateMax) { setErr('Minimum rate cannot be greater than maximum rate.'); return }
    setErr('')
    const result = await a.updateProfile({ ...f, name: f.name.trim(), profileCompleted: true })
    if (result) nav('/creator/dashboard', { replace: true })
  }
  return (
    <div className="mx-auto max-w-2xl">
      <div className="card mb-4">
        <p className="text-sm font-medium text-accent">Welcome to Collably</p>
        <h1 className="mt-1 text-2xl font-semibold">Set up your creator profile</h1>
        <p className="mt-2 text-sm text-muted">Brands use this information to decide whether you're a fit for their campaigns. You can edit it later in Settings.</p>
      </div>
      <div className="card space-y-4 text-sm">
        <label className="block">Full name<input className="input mt-1" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label>
        <label className="block">Creator niche<input className="input mt-1" placeholder="e.g. Beauty, Tech, Food, Fitness" value={f.niche} onChange={e => setF({ ...f, niche: e.target.value })} /></label>
        <label className="block">Location<input className="input mt-1" placeholder="City, Country" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} /></label>
        <label className="block">Bio<textarea className="input mt-1" rows={4} maxLength={500} placeholder="Tell brands about your content and audience." value={f.bio} onChange={e => setF({ ...f, bio: e.target.value })} /></label>
        <div><p className="mb-2 font-medium">Platforms you create on</p><div className="flex flex-wrap gap-2">{platforms.map(p => <button type="button" key={p} className={`btn ${f.platforms.includes(p) ? 'btn-p' : ''}`} onClick={() => togglePlatform(p)}>{p}</button>)}</div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">Total followers<input type="number" min="0" className="input mt-1" value={f.followers} onChange={e => setF({ ...f, followers: Math.max(0, Number(e.target.value)) })} /></label>
          <label className="block">Engagement rate (%)<input type="number" min="0" max="100" step="0.1" className="input mt-1" value={f.engagement} onChange={e => setF({ ...f, engagement: Math.min(100, Math.max(0, Number(e.target.value))) })} /></label>
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Audience size and engagement are self-reported and are not verified by Collably.</p>
        <div><p className="mb-2 font-medium">Your rates (₹ INR)</p><div className="grid gap-3 sm:grid-cols-2"><label className="block">Minimum rate<input type="number" min="0" className="input mt-1" value={f.rateMin} onChange={e => setF({ ...f, rateMin: Math.max(0, Number(e.target.value)) })} /></label><label className="block">Maximum rate<input type="number" min="0" className="input mt-1" value={f.rateMax} onChange={e => setF({ ...f, rateMax: Math.max(0, Number(e.target.value)) })} /></label></div><p className="mt-1 text-xs text-muted">Optional estimated range per collaboration.</p></div>
        {err && <p role="alert" className="text-red-600">{err}</p>}
        <button className="btn btn-p w-full justify-center" onClick={save}>Save profile and continue</button>
      </div>
    </div>
  )
}
