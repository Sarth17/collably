import type { ReactNode } from 'react'
import { Activity, Building2, Check, Clock, Eye, FileText, Flag, Handshake, Megaphone, Sparkles, UserCheck, Users, type LucideIcon } from 'lucide-react'

export const fmt$ = (n: number) => '₹' + n.toLocaleString('en-IN')
export const fmtN = (n: number) => (n >= 1000 ? `${+(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : String(n))
export const fmtD = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const fmtT = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

const TONE: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700', accepted: 'bg-emerald-50 text-emerald-700', approved: 'bg-emerald-50 text-emerald-700',
  completed: 'bg-sky-50 text-sky-700', resolved: 'bg-sky-50 text-sky-700',
  pending: 'bg-amber-50 text-amber-700', medium: 'bg-amber-50 text-amber-700',
  in_review: 'bg-violet-50 text-violet-700', submitted: 'bg-violet-50 text-violet-700',
  revision_requested: 'bg-orange-50 text-orange-700', open: 'bg-orange-50 text-orange-700',
  high: 'bg-red-50 text-red-700', rejected: 'bg-red-50 text-red-700', suspended: 'bg-red-50 text-red-700',
}
export const Badge = ({ s }: { s: string }) => (
  <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${TONE[s] ?? 'bg-stone-100 text-stone-600'}`}><i className="h-1.5 w-1.5 rounded-full bg-current" />{s.replace('_', ' ')}</span>
)

const GRADS = ['#8caa55,#647d34', '#c2a58b,#98795f', '#8ba8a0,#607f74', '#b6bd88,#87915c', '#8797a5,#637481', '#b58f78,#87674f']
export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <span aria-hidden className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
    style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg,${GRADS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 6]})` }}>
    {name.split(' ').map(w => w[0]).slice(0, 2).join('')}
  </span>
)

export const PageHeader = ({ title, action }: { title: string; action?: ReactNode }) => (
  <div className="page-heading flex items-center justify-between gap-3">
    <h1 className="text-3xl font-semibold">{title}</h1>
    {action}
  </div>
)
const STAT_ICON: Record<string, LucideIcon> = {
  'Active campaigns': Megaphone, 'Creators hired': UserCheck, 'Pending requests': Clock, 'Completed campaigns': Check, 'Active collaborations': Handshake,
  'Deliverables due': FileText, 'Total users': Users, Brands: Building2, Creators: Sparkles, 'Pending reports': Flag, Followers: Users,
  'Engagement rate': Activity, 'Average views': Eye, 'Completed collaborations': Check,
}
export const Stat = ({ label, value }: { label: string; value: number | string }) => {
  const I = STAT_ICON[label] ?? Sparkles
  return (
    <div className="card flex items-center gap-4">
      <span className="icon-tile"><I size={20} /></span>
      <div><div className="font-display text-3xl font-semibold leading-none">{value}</div><div className="mt-1 text-xs text-muted">{label}</div></div>
    </div>
  )
}
export const Progress = ({ value }: { value: number }) => (
  <div role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} className="mt-2 h-1.5 rounded-full bg-stone-100">
    <div className="h-full rounded-full" style={{ width: `${value}%`, background: 'linear-gradient(90deg,#b7df54,#91bc32)' }} />
  </div>
)
export const Empty = ({ text }: { text: string }) => (
  <div className="mt-3 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-white/60 p-8 text-center text-sm text-muted">
    <Sparkles size={20} className="text-accent" />{text}
  </div>
)
