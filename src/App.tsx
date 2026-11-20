import { Link, Navigate, NavLink, Outlet, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { Bell, Compass, Contact, Flag, Handshake, Images, LayoutDashboard, Megaphone, MessageCircle, Settings as Cog, Users, type LucideIcon } from 'lucide-react'
import { Avatar } from './ui'
import { resetDemo, SHOW_DEMO, useStore } from './store'
import type { Role } from './types'
import { ForgotPassword, Landing, Login, Register, VerifyEmail, ResetPassword } from './pages/Public'
import { CreatorProfile, PortfolioPage, Settings, CreatorSetup } from './pages/Profile'
import { BrandDash, Campaigns, CampaignDetail, CampaignNew, Collaborations, Contacts, Discover } from './pages/Brand'
import { CollabDetail, CreatorDash, CreatorCampaigns } from './pages/Creator'
import { Messages, Notifications } from './pages/Shared'
import { AdminCampaigns, AdminDash, AdminReports, AdminUsers } from './pages/Admin'

const ROLES: Role[] = ['brand', 'creator', 'admin']
const NAV: Record<Role, [string, string][]> = {
  brand: [['dashboard', 'Overview'], ['discover', 'Discover'], ['contacts', 'Contacts'], ['campaigns', 'Campaigns'], ['collaborations', 'Collaborations'], ['messages', 'Messages'], ['notifications', 'Notifications'], ['settings', 'Settings']],
  creator: [['dashboard', 'Overview'], ['campaigns', 'Discover campaigns'], ['portfolio', 'Portfolio'], ['messages', 'Messages'], ['notifications', 'Notifications'], ['settings', 'Settings']],
  admin: [['dashboard', 'Overview'], ['users', 'Users'], ['campaigns', 'Campaigns'], ['reports', 'Reports']],
}

const ICONS: Record<string, LucideIcon> = { dashboard: LayoutDashboard, discover: Compass, contacts: Contact, campaigns: Megaphone, collaborations: Handshake, messages: MessageCircle, notifications: Bell, settings: Cog, portfolio: Images, users: Users, reports: Flag }

function Shell() {
  const { s, a } = useStore()
  const nav = useNavigate()
  const ses = s.session!
  const me = (ses.role === 'brand' ? s.brands.find(b => b.id === ses.userId)?.name : ses.role === 'creator' ? s.creators.find(c => c.id === ses.userId)?.name : 'Platform admin') ?? 'there'
  const unread = s.notifications.filter(n => n.to === ses.userId && !n.read).length
  const h = new Date().getHours()
  return (
    <div className="app-shell min-h-screen md:flex">
      <aside className="side md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0">
        <Link to="/" className="shell-brand flex items-center gap-2 font-display text-lg font-semibold text-white"><span className="logo">C</span>Collably</Link>
        <nav aria-label="Main" className="shell-nav flex gap-1 overflow-x-auto md:flex-col">
          {NAV[ses.role].map(([p, l]) => {
            const I = ICONS[p]
            return (
              <NavLink key={p} to={`/${ses.role}/${p}`} className={({ isActive }) => `navlink ${isActive ? 'on' : ''}`}>
                <I size={18} />{l}
                {p === 'notifications' && unread > 0 && <span className="ml-auto rounded-full bg-accent px-1.5 text-xs text-white">{unread}</span>}
              </NavLink>
            )
          })}
        </nav>
        <div className="mt-auto hidden items-center gap-3 rounded-xl bg-white/5 p-3 md:flex">
          <Avatar name={me} />
          <span className="min-w-0 text-sm"><b className="block truncate text-white">{me}</b><span className="capitalize">{ses.role}</span></span>
        </div>
      </aside>
      <div className="canvas min-w-0 flex-1">
        <header className="shell-header flex flex-wrap items-center justify-between gap-2 px-6 py-4">
          <p className="font-display text-lg font-semibold">Good {h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening'}, {me.split(' ')[0]}</p>
          <span className="shell-actions flex gap-2">
            {SHOW_DEMO && ses.demo && <>
              <select aria-label="Switch demo role" className="btn" value={ses.role} onChange={async e => { const r = e.target.value as Role; if (await a.demoLogin(r)) nav(`/${r}/dashboard`) }}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {import.meta.env.DEV && <button className="btn" onClick={resetDemo}>Reset demo</button>}
            </>}
            <button className="btn" onClick={() => { a.logout(); nav('/') }}>Log out</button>
          </span>
        </header>
        <main className="shell-main mx-auto max-w-5xl px-6 pb-12 pt-2"><Outlet /></main>
      </div>
    </div>
  )
}

// Demo-only route guard. Not real security.
function Guard({ role }: { role: Role }) {
  const { s, ready } = useStore()
  const location = useLocation()
  if (!ready) return <p className="p-10 text-sm text-muted">Loading…</p>
  if (!s.session) return <Navigate to="/login" replace />
  if (s.session.role !== role) return <Navigate to={`/${s.session.role}/dashboard`} replace />
  if (role === 'creator') {
    const creator = s.creators.find(c => c.id === s.session?.userId)
    const complete = creator?.profileCompleted || (!!creator?.bio?.trim() && !!creator?.niche && creator.niche !== 'General' && creator.platforms.length > 0)
    if (!complete && location.pathname !== '/creator/setup') return <Navigate to='/creator/setup' replace />
  }
  return <Shell />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/brand" element={<Guard role="brand" />}>
        <Route path="dashboard" element={<BrandDash />} />
        <Route path="discover" element={<Discover />} />
        <Route path="creators/:id" element={<CreatorProfile />} />
        <Route path="contacts" element={<Contacts />} />
        <Route path="campaigns" element={<Campaigns />} />
        <Route path="campaigns/new" element={<CampaignNew />} />
        <Route path="campaigns/:id" element={<CampaignDetail />} />
        <Route path="collaborations" element={<Collaborations />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/brand/dashboard" replace />} />
      </Route>
      <Route path="/creator" element={<Guard role="creator" />}>
        <Route path="dashboard" element={<CreatorDash />} />
        <Route path="setup" element={<CreatorSetup />} />
        <Route path="campaigns" element={<CreatorCampaigns />} />
        <Route path="collaborations/:id" element={<CollabDetail />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/creator/dashboard" replace />} />
      </Route>
      <Route path="/admin" element={<Guard role="admin" />}>
        <Route path="dashboard" element={<AdminDash />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="campaigns" element={<AdminCampaigns />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
