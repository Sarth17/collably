import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowUpRight, BadgeCheck, CalendarDays, Clock3, Search, Sparkles, TrendingUp, Users } from 'lucide-react'
import { brandOf, camp, MAX_UPLOAD_MB, useStore } from '../store'
import { Badge, Empty, PageHeader, Stat, fmt$, fmtD } from '../ui'
import type { Collab, Deliverable } from '../types'

export function CreatorDash() {
  const { s, a } = useStore()
  const me = s.session!.userId
  const ls = s.collabs.filter(l => l.creatorId === me)
  const pend = ls.filter(l => l.status === 'pending')
  const live = ls.filter(l => l.status === 'accepted' || l.status === 'active')
  const due = s.deliverables.filter(d => live.some(l => l.id === d.collabId) && (d.status === 'pending' || d.status === 'revision_requested'))
  const completed = ls.filter(l => l.status === 'completed')
  const stats = [
    { label: 'Active collaborations', value: live.length, note: 'Currently in progress', tone: 'lime' },
    { label: 'Pending invitations', value: pend.length, note: 'Waiting for your response', tone: 'peach' },
    { label: 'Deliverables to do', value: due.length, note: 'Needs your attention', tone: 'blue' },
    { label: 'Completed', value: completed.length, note: 'Finished collaborations', tone: 'lavender' },
  ]
  const info = (l: Collab) => { const k = camp(s, l.campaignId); return { k, b: brandOf(s, k) } }
  return (
    <div className="creator-dashboard">
      <div className="creator-welcome">
        <div><div className="brand-overline"><span className="brand-live-dot"/> CREATOR SPACE</div><h1>Make room for<br/><span>good work.</span></h1><p>Your collaborations, deadlines and opportunities — all in one place.</p></div>
        <Link className="btn btn-p creator-discover-btn" to="/creator/campaigns"><Sparkles size={16}/> Explore campaigns <ArrowUpRight size={16}/></Link>
      </div>
      <div className="creator-stat-grid">{stats.map(x => <div className="creator-stat-card" key={x.label}><div className="creator-stat-top"><span>{x.label}</span><span className={`creator-stat-dot ${x.tone}`}/></div><strong>{x.value}</strong><small>{x.note}</small></div>)}</div>
      <div className="creator-dashboard-grid">
        <section className="brand-panel creator-panel">
          <div className="brand-panel-head"><div><span className="brand-overline">YOUR CURRENT WORK</span><h2>Active collaborations</h2></div><span className="brand-count-pill">{live.length} ongoing</span></div>
          {live.length ? <div className="creator-work-list">{live.slice(0,5).map(l => { const { k, b } = info(l); const items = s.deliverables.filter(d => d.collabId === l.id); const completedItems = items.filter(d => d.status === 'approved').length; const progress = items.length ? Math.round(completedItems/items.length*100) : 0; return <Link key={l.id} to={`/creator/collaborations/${l.id}`} className="creator-work-row"><span className="creator-work-mark"><Sparkles size={17}/></span><span className="creator-work-main"><span className="creator-work-title"><strong>{k.name}</strong><Badge s={l.status}/></span><small>{b.name} · due {fmtD(k.deadline)}</small><span className="brand-progress-track"><span style={{width: `${progress}%`}}/></span></span><span className="creator-progress-value">{progress}%</span></Link> })}</div> : <div className="brand-empty"><span className="brand-empty-icon"><Sparkles size={21}/></span><strong>Your next collaboration starts here</strong><p>Explore campaigns and find brands that match your content and style.</p><Link className="btn btn-p" to="/creator/campaigns">Discover campaigns <ArrowUpRight size={15}/></Link></div>}
        </section>
        <section className="brand-panel creator-attention-panel">
          <div className="brand-panel-head"><div><span className="brand-overline">DON'T MISS A THING</span><h2>Invitations</h2></div><span className="brand-count-pill">{pend.length} new</span></div>
          {pend.length ? <div className="creator-invite-list">{pend.slice(0,4).map(l => { const { k, b } = info(l); return <div className="creator-invite-row" key={l.id}><div className="creator-invite-avatar">{b.name.slice(0,1).toUpperCase()}</div><div className="creator-invite-info"><strong>{b.name}</strong><small>{k.name} · {fmt$(k.budget)}</small><div className="creator-invite-actions"><button className="btn btn-p" onClick={() => a.respond(l.id, true)}>Accept</button><button className="btn" onClick={() => a.respond(l.id, false)}>Decline</button></div></div></div>})}</div> : <div className="brand-requests-empty"><span className="brand-empty-icon"><Clock3 size={20}/></span><strong>No new invitations</strong><p>When brands invite you, you'll see them here.</p></div>}
          <Link className="brand-panel-bottom-link" to="/creator/collaborations">All collaborations <ArrowUpRight size={14}/></Link>
        </section>
      </div>
      <section className="creator-deadline-section"><div className="brand-panel-head"><div><span className="brand-overline">YOUR NEXT STEPS</span><h2>Deliverables to focus on</h2></div><span className="brand-count-pill">{due.length} outstanding</span></div>
        {due.length ? <div className="creator-deadline-grid">{due.slice(0,4).map(d => { const l = ls.find(x => x.id === d.collabId)!; const { k, b } = info(l); return <Link to={`/creator/collaborations/${l.id}`} className="creator-deadline-card" key={d.id}><div className="creator-deadline-top"><span className="creator-deadline-icon"><CalendarDays size={16}/></span><Badge s={d.status}/></div><strong>{d.title}</strong><small>{k.name}</small><span className="creator-deadline-brand">{b.name} · due {fmtD(k.deadline)}</span></Link>})}</div> : <div className="brand-requests-empty creator-no-deadlines"><span className="brand-empty-icon"><BadgeCheck size={20}/></span><strong>You're all caught up</strong><p>No pending deliverables right now. Keep creating!</p></div>}
      </section>
      <section className="brand-quick-section"><div className="brand-panel-head"><div><span className="brand-overline">KEEP GROWING</span><h2>Quick links</h2></div></div><div className="brand-quick-grid"><Link to="/creator/campaigns" className="brand-quick-card"><span className="brand-quick-icon"><Search size={19}/></span><span><strong>Find campaigns</strong><small>Explore new opportunities</small></span><ArrowUpRight size={17}/></Link><Link to="/creator/collaborations" className="brand-quick-card"><span className="brand-quick-icon"><Users size={19}/></span><span><strong>My collaborations</strong><small>Manage your ongoing work</small></span><ArrowUpRight size={17}/></Link><Link to="/creator/portfolio" className="brand-quick-card"><span className="brand-quick-icon"><TrendingUp size={19}/></span><span><strong>Creator profile</strong><small>Keep your profile up to date</small></span><ArrowUpRight size={17}/></Link></div></section>
    </div>
  )
}

function SubmitRow({ d }: { d: Deliverable }) {
  const { a } = useStore()
  const [url, setUrl] = useState(d.url ?? '')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState('')
  const open = d.status === 'pending' || d.status === 'revision_requested'
  const send = async () => {
    if (!file && !/^https?:\/\/\S+$/.test(url)) { setErr('Enter a valid link or attach a file.'); return }
    setErr(''); setUploading(true)
    try {
      const submittedUrl = file ? await a.uploadFile(file) : url
      if (submittedUrl) await a.submit(d.id, submittedUrl, notes.trim())
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className="card mt-3 text-sm">
      <div className="flex items-center justify-between"><b>{d.title}</b><Badge s={d.status} /></div>
      {d.status === 'revision_requested' && d.feedback && <p className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-800">Feedback: {d.feedback}</p>}
      {open ? (
        <div className="mt-3 space-y-2">
          <label className="block">Content URL<input className="input mt-1" placeholder="https://" value={url} onChange={e => setUrl(e.target.value)} /></label>
          <label className="block">Upload deliverable (image, video or PDF, max {MAX_UPLOAD_MB} MB)<input className="input mt-1" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} /></label>
        {file && <p className="text-xs text-muted">Selected: {file.name}</p>}
        <label className="block">Notes for the brand<textarea className="input mt-1" rows={2} value={notes} onChange={e => setNotes(e.target.value)} /></label>
          {err && <p role="alert" className="text-red-600">{err}</p>}
          <button className="btn btn-p" disabled={uploading} onClick={send}>{uploading ? 'Uploading…' : d.status === 'pending' ? 'Submit for review' : 'Resubmit for review'}</button>
        </div>
      ) : d.url && <a className="mt-2 block text-accent underline" href={d.url} target="_blank" rel="noreferrer">View submission</a>}
    </div>
  )
}

export function CollabDetail() {
  const { id } = useParams()
  const { s, a } = useStore()
  const l = s.collabs.find(x => x.id === id && x.creatorId === s.session!.userId)
  if (!l) return <Empty text="Collaboration not found." />
  const k = camp(s, l.campaignId)
  const ds = s.deliverables.filter(d => d.collabId === l.id)
  const chat = l.status === 'accepted' || l.status === 'active' || l.status === 'completed'
  return (
    <>
      <PageHeader title={k.name} action={chat ? <Link className="btn" to={`/creator/messages?c=${l.id}`}>Message brand</Link> : undefined} />
      <div className="card text-sm">
        <div className="flex flex-wrap items-center gap-4"><span className="font-medium">{brandOf(s, k).name}</span><Badge s={l.status} /><span>Budget {fmt$(k.budget)}</span><span>Deadline {fmtD(k.deadline)}</span></div>
        <p className="mt-3 text-muted">{k.description}</p>
        <p className="mt-2">Requirements: {k.deliverables.join(', ')}</p>
      </div>
      {l.status === 'pending' && (
        <div className="mt-4 flex gap-2"><button className="btn btn-p" onClick={() => a.respond(l.id, true)}>Accept request</button><button className="btn" onClick={() => a.respond(l.id, false)}>Reject request</button></div>
      )}
      {l.status === 'rejected' && <Empty text="You declined this invitation." />}
      {ds.map(d => <SubmitRow key={d.id} d={d} />)}
    </>
  )
}


export function CreatorCampaigns() {
  const { s } = useStore()
  const [q, setQ] = useState('')
  const [niche, setNiche] = useState('')
  const active = s.campaigns.filter(k => k.status === 'active' || k.status === 'in_review')
  const brands = [...new Set(active.map(k => s.brands.find(b => b.id === k.brandId)?.name).filter(Boolean))]
  const list = active.filter(k => {
    const brand = s.brands.find(b => b.id === k.brandId)?.name ?? ''
    return (!niche || brand === niche) && `${k.name} ${k.description} ${brand} ${k.deliverables.join(' ')}`.toLowerCase().includes(q.toLowerCase())
  })
  return (
    <div className="creator-marketplace">
      <div className="marketplace-hero">
        <div className="marketplace-hero-copy">
          <span className="brand-overline"><span className="brand-live-dot"/> CREATOR OPPORTUNITIES</span>
          <h1>Find your next<br/><em>great collaboration.</em></h1>
          <p>Discover brands that fit your style, explore creative briefs, and find opportunities to make something worth sharing.</p>
        </div>
        <div className="marketplace-hero-art"><div className="marketplace-orbit orbit-one"/><div className="marketplace-orbit orbit-two"/><div className="marketplace-art-core"><Sparkles size={28}/></div><span className="marketplace-art-tag tag-top">Your next brief</span><span className="marketplace-art-tag tag-bottom">Create · Connect · Grow</span></div>
      </div>
      <div className="marketplace-toolbar">
        <div className="marketplace-search"><Search size={17}/><input aria-label="Search campaigns" placeholder="Search campaigns, brands or deliverables" value={q} onChange={e => setQ(e.target.value)}/></div>
        <select aria-label="Filter by brand" value={niche} onChange={e => setNiche(e.target.value)}><option value="">All brands</option>{brands.map(name => <option key={name}>{name}</option>)}</select>
      </div>
      <div className="marketplace-results-head"><div><h2>Open opportunities</h2><p>Campaigns currently looking for creators</p></div><span className="marketplace-result-count">{list.length} opportunities</span></div>
      {list.length ? <div className="marketplace-campaign-grid">{list.map(k => {
        const b = s.brands.find(x => x.id === k.brandId)
        const already = s.collabs.some(l => l.campaignId === k.id && l.creatorId === s.session?.userId && l.status !== 'rejected')
        return <article className="marketplace-campaign-card" key={k.id}>
          <div className="marketplace-card-top"><div className="marketplace-brand-avatar">{(b?.name ?? 'B').slice(0,1).toUpperCase()}</div><div className="marketplace-brand-copy"><strong>{b?.name ?? 'Brand'}</strong><small>{b?.industry || 'Brand collaboration'}</small></div><Badge s={k.status}/></div>
          <h3>{k.name}</h3><p className="marketplace-campaign-description">{k.description || 'A new opportunity to collaborate with this brand.'}</p>
          <div className="marketplace-meta-grid"><div><small>Campaign budget</small><strong>₹{k.budget.toLocaleString('en-IN')}</strong></div><div><small>Deadline</small><strong>{fmtD(k.deadline)}</strong></div></div>
          <div className="marketplace-deliverables"><span>Deliverables</span><div>{k.deliverables.map(d => <span className="marketplace-chip" key={d}>{d}</span>)}</div></div>
          <button className="marketplace-apply-btn" disabled>{already ? 'Already connected' : 'Applications coming soon'}<ArrowUpRight size={16}/></button>
        </article>
      })}</div> : <Empty text="No campaigns match your search. Try another keyword or select all brands."/>}
    </div>
  )
}
