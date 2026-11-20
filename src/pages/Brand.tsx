import { useState, type ChangeEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowUpRight, BadgeCheck, Bookmark, BookmarkCheck, CalendarDays, Clock3, Plus, Search, Sparkles, TrendingUp, Users, Wallet } from 'lucide-react'
import { brandData, camp, campaignProgress, cr, useStore } from '../store'
import { Avatar, Badge, Empty, PageHeader, Progress, Stat, fmt$, fmtD, fmtN } from '../ui'
import type { Creator, Deliverable } from '../types'

export function BrandDash() {
  const { s } = useStore()
  const { campaigns, collabs } = brandData(s)
  const pending = collabs.filter(l => l.status === 'pending')
  const active = campaigns.filter(k => k.status === 'active' || k.status === 'in_review')
  const hired = collabs.filter(l => ['accepted', 'active', 'completed'].includes(l.status))
  const completed = campaigns.filter(k => k.status === 'completed')
  const totalBudget = campaigns.filter(k => k.status !== 'draft').reduce((sum, k) => sum + k.budget, 0)
  const stats = [
    { label: 'Active campaigns', value: active.length, note: `${campaigns.length} total campaigns`, icon: TrendingUp, tone: 'lime' },
    { label: 'Creators hired', value: hired.length, note: 'Across all campaigns', icon: Users, tone: 'lavender' },
    { label: 'Pending requests', value: pending.length, note: 'Need your attention', icon: Clock3, tone: 'peach' },
    { label: 'Campaign budget', value: fmt$(totalBudget), note: `${completed.length} completed campaigns`, icon: Wallet, tone: 'blue' },
  ]
  const recent = campaigns.slice(0, 4)
  return (
    <div className="brand-dashboard">
      <div className="brand-welcome">
        <div><div className="brand-overline"><span className="brand-live-dot"/> YOUR WORKSPACE</div><h1>Good morning<span>,</span> {s.brands.find(b => b.id === s.session?.userId)?.name?.split(' ')[0] || 'there'}.</h1><p>Here's what's happening with your creator partnerships.</p></div>
        <Link className="btn btn-p brand-create-btn" to="/brand/campaigns/new"><Plus size={17}/> Create campaign</Link>
      </div>
      <div className="brand-stat-grid">{stats.map(({ label, value, note, icon: Icon, tone }) => <div className="brand-stat-card" key={label}><div className="brand-stat-top"><span>{label}</span><span className={`brand-stat-icon ${tone}`}><Icon size={17}/></span></div><strong>{value}</strong><small>{note}</small></div>)}</div>
      <div className="brand-dashboard-grid">
        <section className="brand-panel brand-campaign-panel">
          <div className="brand-panel-head"><div><span className="brand-overline">KEEP THINGS MOVING</span><h2>Campaigns at a glance</h2></div><Link to="/brand/campaigns" className="brand-text-link">All campaigns <ArrowUpRight size={15}/></Link></div>
          {recent.length ? <div className="brand-campaign-list">{recent.map(k => { const progress = campaignProgress(s, k.id); const count = collabs.filter(l => l.campaignId === k.id && l.status !== 'rejected').length; return <Link to={`/brand/campaigns/${k.id}`} className="brand-campaign-row" key={k.id}><div className="brand-campaign-mark"><Sparkles size={17}/></div><div className="brand-campaign-main"><div className="brand-campaign-title"><strong>{k.name}</strong><Badge s={k.status}/></div><div className="brand-campaign-meta"><span><Users size={13}/>{count} creators</span><span><CalendarDays size={13}/>{fmtD(k.deadline)}</span><span>{fmt$(k.budget)}</span></div><div className="brand-progress-track"><span style={{ width: `${progress}%` }}/></div></div><div className="brand-progress-value">{progress}%</div></Link> })}</div> : <div className="brand-empty"><span className="brand-empty-icon"><Sparkles size={21}/></span><strong>Your first campaign starts here</strong><p>Set a brief, choose your deliverables and invite creators who fit your brand.</p><Link className="btn btn-p" to="/brand/campaigns/new">Create a campaign <ArrowUpRight size={15}/></Link></div>}
        </section>
        <section className="brand-panel brand-requests-panel">
          <div className="brand-panel-head"><div><span className="brand-overline">IN YOUR INBOX</span><h2>Needs your attention</h2></div><span className="brand-count-pill">{pending.length} new</span></div>
          {pending.length ? <div className="brand-request-list">{pending.slice(0, 5).map(l => { const creator = cr(s, l.creatorId); const campaign = camp(s, l.campaignId); return <Link key={l.id} to={`/brand/campaigns/${l.campaignId}`} className="brand-request-row"><Avatar name={creator.name} size={42}/><span className="brand-request-info"><strong>{creator.name}</strong><small>Requested to join <b>{campaign.name}</b></small></span><ArrowUpRight size={16}/></Link> })}</div> : <div className="brand-requests-empty"><span className="brand-empty-icon"><Clock3 size={20}/></span><strong>You're all caught up</strong><p>New creator requests will show up here.</p></div>}
          <Link className="brand-panel-bottom-link" to="/brand/collaborations">View collaborations <ArrowUpRight size={14}/></Link>
        </section>
      </div>
      <section className="brand-quick-section"><div className="brand-panel-head"><div><span className="brand-overline">MAKE YOUR NEXT MOVE</span><h2>Quick actions</h2></div></div><div className="brand-quick-grid"><Link to="/brand/discover" className="brand-quick-card"><span className="brand-quick-icon"><Search size={19}/></span><span><strong>Find creators</strong><small>Discover talent for your next idea</small></span><ArrowUpRight size={17}/></Link><Link to="/brand/campaigns/new" className="brand-quick-card"><span className="brand-quick-icon"><Plus size={19}/></span><span><strong>Start a campaign</strong><small>Turn a brief into a collaboration</small></span><ArrowUpRight size={17}/></Link><Link to="/brand/contacts" className="brand-quick-card"><span className="brand-quick-icon"><Users size={19}/></span><span><strong>Your creator list</strong><small>Revisit people you've saved</small></span><ArrowUpRight size={17}/></Link></div></section>
    </div>
  )
}

function CreatorCard({ c }: { c: Creator }) {
  const { s, a } = useStore()
  const { campaigns } = brandData(s)
  const open = campaigns.filter(k => k.status !== 'draft' && k.status !== 'completed')
  const [k, setK] = useState('')
  const saved = s.saved.includes(c.id)
  const invited = !!k && s.collabs.some(l => l.campaignId === k && l.creatorId === c.id && l.status !== 'rejected')
  return (
    <div className="card overflow-hidden p-0">
      <div className="h-16" style={{ background: 'linear-gradient(120deg,#eef2e5,#e5eadb)' }} />
      <div className="px-5 pb-5">
        <div className="-mt-7 flex items-end justify-between">
          <span className="rounded-full border-4 border-white"><Avatar name={c.name} size={56} /></span>
          <button className="btn" onClick={() => a.toggleSave(c.id)}>{saved ? <BookmarkCheck size={14} className="text-accent" /> : <Bookmark size={14} />}{saved ? 'Saved' : 'Save'}</button>
        </div>
        <Link to={`/brand/creators/${c.id}`} className="mt-3 flex items-center gap-1 font-display text-lg font-semibold hover:text-accent">
          {c.name}{c.verified && <BadgeCheck size={16} className="text-accent" aria-label="Verified" />}
        </Link>
        <div className="text-sm text-muted">@{c.handle} in {c.location}</div>
        <p className="mt-2 text-sm">{c.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5"><span className="chip chip-on">{c.niche}</span>{c.platforms.map(p => <span key={p} className="chip">{p}</span>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-3 text-center">
          <div><b className="font-display text-lg">{fmtN(c.followers)}</b><div className="text-xs text-muted">Followers</div></div>
          <div><b className="font-display text-lg">{c.engagement}%</b><div className="text-xs text-muted">Engagement</div></div>
        </div>
        <div className="mt-4 flex gap-2">
          <select aria-label={`Campaign for ${c.name}`} className="btn min-w-0 flex-1" value={k} onChange={e => setK(e.target.value)}>
            <option value="">{open.length ? 'Choose campaign' : 'No open campaigns'}</option>
            {open.map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
          <button className="btn btn-p" disabled={!k || invited} onClick={() => a.inviteCreator(k, c.id)}>{invited ? 'Invited' : 'Invite'}</button>
        </div>
      </div>
    </div>
  )
}

export function Discover() {
  const { s } = useStore()
  const [q, setQ] = useState(''), [niche, setNiche] = useState(''), [plat, setPlat] = useState(''), [min, setMin] = useState(0)
  const niches = [...new Set(s.creators.map(c => c.niche))]
  const plats = [...new Set(s.creators.flatMap(c => c.platforms))]
  const list = s.creators.filter(c => c.status === 'active' && (!niche || c.niche === niche) && (!plat || c.platforms.includes(plat)) && c.followers >= min &&
    `${c.name} ${c.handle} ${c.niche} ${c.bio}`.toLowerCase().includes(q.toLowerCase()))
  const chips: [string, () => void][] = []
  if (q) chips.push([`Search: ${q}`, () => setQ('')])
  if (niche) chips.push([niche, () => setNiche('')])
  if (plat) chips.push([plat, () => setPlat('')])
  if (min) chips.push([`${fmtN(min)}+ followers`, () => setMin(0)])
  return (
    <>
      <PageHeader title="Discover creators" />
      <div className="grid gap-2 md:grid-cols-4">
        <input aria-label="Search creators" className="input" placeholder="Search name, niche or keyword" value={q} onChange={e => setQ(e.target.value)} />
        <select aria-label="Niche" className="btn" value={niche} onChange={e => setNiche(e.target.value)}><option value="">All niches</option>{niches.map(n => <option key={n}>{n}</option>)}</select>
        <select aria-label="Platform" className="btn" value={plat} onChange={e => setPlat(e.target.value)}><option value="">All platforms</option>{plats.map(n => <option key={n}>{n}</option>)}</select>
        <select aria-label="Audience size" className="btn" value={min} onChange={e => setMin(+e.target.value)}>
          <option value={0}>Any audience</option><option value={50000}>50K+</option><option value={100000}>100K+</option><option value={200000}>200K+</option>
        </select>
      </div>
      <div className="my-3 flex flex-wrap items-center gap-2 text-sm text-muted">
        {list.length} creators
        {chips.map(([l, f]) => <button key={l} className="btn" aria-label={`Remove filter ${l}`} onClick={f}>{l} ×</button>)}
        {chips.length > 0 && <button className="btn" onClick={() => { setQ(''); setNiche(''); setPlat(''); setMin(0) }}>Reset filters</button>}
      </div>
      {list.length ? <div className="grid gap-4 md:grid-cols-2">{list.map(c => <CreatorCard key={c.id} c={c} />)}</div> : <Empty text="No creators match these filters. Try resetting them." />}
    </>
  )
}

export function Contacts() {
  const { s, a } = useStore()
  const { collabs } = brandData(s)
  const list = s.creators.filter(c => s.saved.includes(c.id))
  const label = (id: string) => {
    const ls = collabs.filter(l => l.creatorId === id)
    return ls.some(l => l.status === 'accepted' || l.status === 'active') ? 'Collaborating' : ls.some(l => l.status === 'completed') ? 'Past collaborator' : ls.some(l => l.status === 'pending') ? 'Invited' : 'Potential'
  }
  return (
    <>
      <PageHeader title="Contacts" action={<Link className="btn" to="/brand/discover">Discover creators</Link>} />
      {list.length ? list.map(c => (
        <div key={c.id} className="card mb-2 flex items-center gap-3 text-sm">
          <Avatar name={c.name} />
          <span className="flex-1">{c.name}<small className="block text-muted">{c.niche}, {fmtN(c.followers)} followers</small></span>
          <Badge s={label(c.id) === 'Collaborating' ? 'active' : 'pending'} />
          <span className="hidden w-32 text-muted md:block">{label(c.id)}</span>
          <button className="btn" onClick={() => a.toggleSave(c.id)}>Remove</button>
        </div>
      )) : <Empty text="No creators saved yet. Discover creators and save promising profiles to build your contact list." />}
    </>
  )
}

export function Campaigns() {
  const { s } = useStore()
  const { campaigns } = brandData(s)
  const [q, setQ] = useState(''), [st, setSt] = useState('')
  const list = campaigns.filter(k => (!st || k.status === st) && k.name.toLowerCase().includes(q.toLowerCase()))
  const live = campaigns.filter(k => k.status === 'active' || k.status === 'in_review').length
  return (
    <div className="brand-campaign-workspace">
      <PageHeader title="Campaigns" action={<Link className="btn btn-p" to="/brand/campaigns/new"><Plus size={16}/> Create campaign</Link>} />
      <div className="brand-campaign-intro"><div><span className="brand-overline">YOUR CAMPAIGN STUDIO</span><h2>Make every collaboration count.</h2><p>Keep your briefs, creators, timelines and deliverables moving in one place.</p></div><div className="brand-campaign-intro-stat"><strong>{live}</strong><span>live campaigns</span></div></div>
      <div className="brand-campaign-filterbar"><div className="brand-campaign-search"><Search size={16}/><input aria-label="Search campaigns" placeholder="Search campaign name" value={q} onChange={e => setQ(e.target.value)}/></div><select aria-label="Campaign status" value={st} onChange={e => setSt(e.target.value)}><option value="">All statuses</option>{['draft', 'active', 'in_review', 'completed'].map(x => <option key={x} value={x}>{x.replace('_', ' ')}</option>)}</select></div>
      <div className="brand-campaign-results-count">Showing <strong>{list.length}</strong> {list.length === 1 ? 'campaign' : 'campaigns'}</div>
      {list.length ? <div className="brand-campaign-cards">{list.map(k => {
        const progress = campaignProgress(s, k.id)
        const count = s.collabs.filter(l => l.campaignId === k.id && l.status !== 'rejected').length
        return <Link key={k.id} to={`/brand/campaigns/${k.id}`} className="brand-campaign-work-card"><div className="brand-campaign-work-top"><span className="brand-campaign-work-icon"><Sparkles size={17}/></span><Badge s={k.status}/></div><h3>{k.name}</h3><p>{k.description || 'No campaign description yet.'}</p><div className="brand-campaign-work-meta"><div><small>Budget</small><strong>{fmt$(k.budget)}</strong></div><div><small>Deadline</small><strong>{fmtD(k.deadline)}</strong></div><div><small>Creators</small><strong>{count}</strong></div></div><div className="brand-campaign-work-progress"><div><span>Campaign progress</span><strong>{progress}%</strong></div><div className="brand-progress-track"><span style={{width: `${progress}%`}}/></div></div><div className="brand-campaign-work-footer">View campaign details <ArrowUpRight size={15}/></div></Link>
      })}</div> : <Empty text="No campaigns match. Create a campaign to begin inviting creators."/>}
    </div>
  )
}

export function CampaignNew() {
  const { s, a } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ name: '', description: '', budget: '', deadline: '', deliverables: 'Instagram Reel, Story Set' })
  const [pick, setPick] = useState<string[]>([]), [q, setQ] = useState(''), [err, setErr] = useState('')
  const set = (k: string) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const go = (launch: boolean) => {
    const dl = f.deliverables.split(',').map(x => x.trim()).filter(Boolean)
    if (!f.name.trim() || !(+f.budget > 0) || !f.deadline || !dl.length) { setErr('Name, a budget above zero, a deadline and at least one deliverable are required.'); return }
    const id = a.createCampaign({ name: f.name.trim(), description: f.description.trim(), budget: +f.budget, deadline: f.deadline, deliverables: dl }, pick, launch)
    nav(`/brand/campaigns/${id}`)
  }
  const list = s.creators.filter(c => c.status === 'active' && `${c.name} ${c.niche}`.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="New campaign" />
      <div className="card space-y-3 text-sm">
        <label className="block">Campaign name<input className="input mt-1" value={f.name} onChange={set('name')} /></label>
        <label className="block">Description and creative guidelines<textarea className="input mt-1" rows={3} value={f.description} onChange={set('description')} /></label>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">Budget (₹)<input type="number" min="0" className="input mt-1" value={f.budget} onChange={set('budget')} /></label>
          <label className="block">Deadline<input type="date" className="input mt-1" value={f.deadline} onChange={set('deadline')} /></label>
        </div>
        <label className="block">Deliverables (comma separated)<input className="input mt-1" value={f.deliverables} onChange={set('deliverables')} /></label>
        <fieldset>
          <legend className="mb-1">Creators to invite on launch ({pick.length} selected)</legend>
          <input aria-label="Search creators" className="input mb-2" placeholder="Search creators" value={q} onChange={e => setQ(e.target.value)} />
          <div className="max-h-48 overflow-y-auto rounded-lg border border-line p-2">
            {list.map(c => (
              <label key={c.id} className="flex items-center gap-2 py-1">
                <input type="checkbox" checked={pick.includes(c.id)} onChange={() => setPick(p => (p.includes(c.id) ? p.filter(x => x !== c.id) : [...p, c.id]))} />
                {c.name} <span className="text-muted">({c.niche})</span>
              </label>
            ))}
          </div>
        </fieldset>
        {err && <p role="alert" className="text-red-600">{err}</p>}
        <p className="text-muted">Invitations are sent when you launch. A saved draft keeps no invitations.</p>
        <div className="flex gap-2"><button className="btn" onClick={() => go(false)}>Save as draft</button><button className="btn btn-p" onClick={() => go(true)}>Launch campaign</button></div>
      </div>
    </>
  )
}

function ReviewRow({ d }: { d: Deliverable }) {
  const { a } = useStore()
  const [fb, setFb] = useState('')
  return (
    <div className="mt-3 border-t border-line pt-3 text-sm">
      <div className="flex items-center justify-between gap-2"><span>{d.title}</span><Badge s={d.status} /></div>
      {d.url && <a className="text-accent underline" href={d.url} target="_blank" rel="noreferrer">View submission</a>}
      {d.notes && <p className="text-muted">{d.notes}</p>}
      {d.status === 'submitted' && <button className="btn mt-2" onClick={() => a.review(d.id, 'in_review')}>Start review</button>}
      {d.status === 'in_review' && (
        <div className="mt-2 space-y-2">
          <input aria-label="Revision feedback" className="input" placeholder="Feedback (required to request changes)" value={fb} onChange={e => setFb(e.target.value)} />
          <div className="flex gap-2">
            <button className="btn btn-p" onClick={() => a.review(d.id, 'approved')}>Approve</button>
            <button className="btn" disabled={!fb.trim()} onClick={() => a.review(d.id, 'revision_requested', fb.trim())}>Request revision</button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CampaignDetail() {
  const { id } = useParams()
  const { s, a } = useStore()
  const k = s.campaigns.find(x => x.id === id && x.brandId === s.session!.userId)
  if (!k) return <Empty text="Campaign not found." />
  const ls = s.collabs.filter(l => l.campaignId === k.id)
  return (
    <>
      <PageHeader title={k.name} action={k.status === 'draft' ? <button className="btn btn-p" onClick={() => a.launch(k.id)}>Launch campaign</button> : undefined} />
      <div className="card text-sm">
        <div className="flex flex-wrap items-center gap-4"><Badge s={k.status} /><span>Budget {fmt$(k.budget)}</span><span>Deadline {fmtD(k.deadline)}</span></div>
        <p className="mt-3 text-muted">{k.description || 'No description yet.'}</p>
        <p className="mt-2">Deliverables: {k.deliverables.join(', ')}</p>
        <Progress value={campaignProgress(s, k.id)} />
      </div>
      <h2 className="mb-2 mt-6 font-semibold">Creators and deliverables</h2>
      {ls.length ? ls.map(l => (
        <div key={l.id} className="card mb-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Avatar name={cr(s, l.creatorId).name} />{cr(s, l.creatorId).name}</span>
            <Badge s={l.status} />
          </div>
          {l.status === 'pending' && <p className="mt-2 text-sm text-muted">Waiting for a response since {fmtD(l.invitedAt)}.</p>}
          {s.deliverables.filter(d => d.collabId === l.id).map(d => <ReviewRow key={d.id} d={d} />)}
          {(l.status === 'accepted' || l.status === 'active' || l.status === 'completed') && <Link className="btn mt-3" to={`/brand/messages?c=${l.id}`}>Message creator</Link>}
        </div>
      )) : <Empty text="No creators invited yet. Invite creators from Discover." />}
    </>
  )
}

export function Collaborations() {
  const { s } = useStore()
  const { collabs } = brandData(s)
  const groups: [string, string[]][] = [['Pending requests', ['pending']], ['Active collaborations', ['accepted', 'active']], ['Completed', ['completed']], ['Declined', ['rejected']]]
  return (
    <>
      <PageHeader title="Collaborations" />
      {groups.map(([t, sts]) => {
        const ls = collabs.filter(l => sts.includes(l.status))
        return (
          <section key={t} className="mb-6">
            <h2 className="mb-2 font-semibold">{t} <span className="text-muted">({ls.length})</span></h2>
            {ls.length ? ls.map(l => (
              <Link key={l.id} to={`/brand/campaigns/${l.campaignId}`} className="card mb-2 flex items-center gap-3 text-sm">
                <Avatar name={cr(s, l.creatorId).name} />
                <span className="flex-1">{cr(s, l.creatorId).name}<small className="block text-muted">{camp(s, l.campaignId).name}, invited {fmtD(l.invitedAt)}</small></span>
                <Badge s={l.status} />
              </Link>
            )) : <Empty text="Nothing here yet." />}
          </section>
        )
      })}
    </>
  )
}
