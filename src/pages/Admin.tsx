import { useState } from 'react'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { brandOf, useStore } from '../store'
import { Badge, Empty, PageHeader, Stat, fmt$ } from '../ui'

export function AdminDash() {
  const { s } = useStore()
  const stats: [string, number][] = [
    ['Total users', s.creators.length + s.brands.length], ['Brands', s.brands.length], ['Creators', s.creators.length],
    ['Active campaigns', s.campaigns.filter(k => k.status === 'active' || k.status === 'in_review').length],
    ['Completed campaigns', s.campaigns.filter(k => k.status === 'completed').length],
    ['Pending reports', s.reports.filter(r => r.status === 'open').length],
  ]
  const data = (['draft', 'active', 'in_review', 'completed'] as const).map(st => ({ name: st.replace('_', ' '), count: s.campaigns.filter(k => k.status === st).length }))
  return (
    <>
      <PageHeader title="Platform overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{stats.map(([l, v]) => <Stat key={l} label={l} value={v} />)}</div>
      <section className="card mt-6">
        <h2 className="font-semibold">Campaigns by status</h2>
        <div className="mt-3 h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}><XAxis dataKey="name" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="count" fill="#5b45d6" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </>
  )
}

export function AdminUsers() {
  const { s, a } = useStore()
  const [q, setQ] = useState('')
  const rows = [
    ...s.brands.map(b => ({ id: b.id, name: b.name, role: 'brand', status: b.status, n: s.campaigns.filter(k => k.brandId === b.id).length })),
    ...s.creators.map(c => ({ id: c.id, name: c.name, role: 'creator', status: c.status, n: s.collabs.filter(l => l.creatorId === c.id).length })),
  ].filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <>
      <PageHeader title="Users" />
      <input aria-label="Search users" className="input mb-4" placeholder="Search users" value={q} onChange={e => setQ(e.target.value)} />
      {rows.length ? (
        <div className="card overflow-x-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted"><tr>{['User', 'Role', 'Status', 'Campaigns or collaborations', ''].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id} className="border-t border-line">
                <td className="p-3">{r.name}</td><td className="p-3 capitalize">{r.role}</td><td className="p-3"><Badge s={r.status} /></td><td className="p-3">{r.n}</td>
                <td className="p-3 text-right"><button className="btn" onClick={() => { if (r.status === 'suspended' || confirm(`Suspend ${r.name}?`)) a.toggleStatus(r.id) }}>{r.status === 'active' ? 'Suspend' : 'Activate'}</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : <Empty text="No users match your search." />}
    </>
  )
}

export function AdminReports() {
  const { s, a } = useStore()
  return (
    <>
      <PageHeader title="Reports" />
      {s.reports.map(r => (
        <div key={r.id} className="card mb-2 flex flex-wrap items-center gap-3 text-sm">
          <span className="flex-1"><b>{r.target}</b><small className="block text-muted">{r.reason}</small></span>
          <Badge s={r.priority} /><Badge s={r.status} />
          {r.status === 'open' && <><button className="btn btn-p" onClick={() => a.resolveReport(r.id, 'resolved')}>Resolve</button><button className="btn" onClick={() => a.resolveReport(r.id, 'dismissed')}>Dismiss</button></>}
        </div>
      ))}
    </>
  )
}

export function AdminCampaigns() {
  const { s } = useStore()
  return (
    <>
      <PageHeader title="Campaigns" />
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted"><tr>{['Campaign', 'Brand', 'Status', 'Budget', 'Creators'].map(h => <th key={h} className="p-3 font-medium">{h}</th>)}</tr></thead>
          <tbody>{s.campaigns.map(k => (
            <tr key={k.id} className="border-t border-line">
              <td className="p-3">{k.name}</td><td className="p-3">{brandOf(s, k).name}</td><td className="p-3"><Badge s={k.status} /></td>
              <td className="p-3">{fmt$(k.budget)}</td><td className="p-3">{s.collabs.filter(l => l.campaignId === k.id && l.status !== 'rejected').length}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </>
  )
}
