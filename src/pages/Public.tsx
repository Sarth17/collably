import { useEffect, useRef, useState } from 'react'
import { Bell, Check, Images, Megaphone, MessageCircle, Search, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { SHOW_DEMO, useStore } from '../store'
import type { Role } from '../types'

function Preview() {
  const creators = [
    { name: 'Priya Mehta', niche: 'Beauty · Mumbai', initials: 'PM', followers: '182K', engagement: '5.4%', color: '#f2d8c9' },
    { name: 'Aarav Shah', niche: 'Lifestyle · Pune', initials: 'AS', followers: '96K', engagement: '4.8%', color: '#d8e5c5' },
    { name: 'Maya Kapoor', niche: 'Fashion · Delhi', initials: 'MK', followers: '241K', engagement: '6.1%', color: '#d7d9ed' },
  ]
  return (
    <div className="hero-workspace rise">
      <div className="workspace-topbar"><div className="flex items-center gap-2"><span className="workspace-dot"/><span className="workspace-dot"/><span className="workspace-dot"/></div><span className="workspace-title">creator discovery</span><span className="workspace-avatar">S</span></div>
      <div className="workspace-body">
        <div className="workspace-heading"><div><span className="workspace-eyebrow">YOUR NEXT COLLAB</span><h3>Find your people.</h3></div><span className="workspace-filter">⌕ Filters</span></div>
        <div className="workspace-stats"><div><b>128</b><span>Creators found</span></div><div><b>4.9%</b><span>Avg. engagement</span></div><div><b>3</b><span>Saved today</span></div></div>
        <div className="creator-preview-list">
          {creators.map((creator, i) => <div className="creator-preview" key={creator.name}><div className="creator-preview-avatar" style={{ background: creator.color }}>{creator.initials}</div><div className="creator-preview-info"><strong>{creator.name}</strong><span>{creator.niche}</span></div><div className="creator-preview-metrics"><b>{creator.followers}</b><span>{creator.engagement}</span></div><span className="creator-save">{i === 0 ? '♥' : '＋'}</span></div>)}
        </div>
        <div className="workspace-footer"><span><span className="live-dot"/> Sample workspace</span><span>View all creators ↗</span></div>
      </div>
      <div className="hero-floating-card"><span className="floating-check">✓</span><div><b>Campaign is moving</b><span>Creator approved your brief</span></div></div>
    </div>
  )
}


export function Landing() {
  const steps: [string, string][] = [
    ['Find', 'Discover creators who fit your brand, audience and campaign goals.'],
    ['Connect', 'Reach out and keep every conversation in context.'],
    ['Create', 'Share briefs, timelines and deliverables in one place.'],
    ['Grow', 'Review work and build partnerships worth repeating.'],
  ]
  const feats: [LucideIcon, string, string][] = [
    [Search, 'Creator discovery', 'Explore creators by niche, platform and audience fit.'],
    [Megaphone, 'Campaign workspace', 'Keep briefs, budgets and deadlines together.'],
    [MessageCircle, 'Conversations', 'Stay on the same page from first message to final delivery.'],
    [Bell, 'Useful updates', 'Follow important activity without losing your focus.'],
    [Images, 'Portfolio-first', 'Let creators showcase their style and past work.'],
    [ShieldCheck, 'A clear workflow', 'Bring collaboration details into one organized place.'],
  ]
  return (
    <div className="canvas-landing collably-landing">
      <header className="landing-header mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="brand-lockup"><span className="logo">C</span><span>collably</span></Link>
        <nav className="landing-nav hidden gap-7 md:flex"><a href="#how">How it works</a><a href="#features">Platform</a><a href="#about">Who it's for</a></nav>
        <div className="flex items-center gap-2"><Link className="landing-signin" to="/login">Sign in</Link><Link className="btn btn-p landing-cta" to="/register">Get started <span>↗</span></Link></div>
      </header>
      <main>
        <section className="landing-hero mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-12 lg:grid-cols-[.9fr_1.1fr] lg:pt-20">
          <div className="landing-copy rise"><div className="landing-kicker"><span className="kicker-dot"/> THE COLLABORATION SPACE</div><h1>Good work happens <em>together.</em></h1><p className="landing-subtitle">Where brands meet creators, ideas become campaigns, and collaborations feel effortless.</p><div className="landing-actions"><Link className="btn btn-p btn-lg" to="/register">Start collaborating <span>↗</span></Link><Link className="landing-secondary" to="/login">Explore the workspace <span>→</span></Link></div><div className="landing-proof"><div className="proof-avatars"><span>PM</span><span>AS</span><span>MK</span></div><p><b>Made for both sides.</b><br/>Brands and creators, in sync.</p></div></div>
          <Preview />
        </section>
        <section id="how" className="landing-section mx-auto max-w-7xl px-6 py-20"><div className="section-heading"><span className="landing-kicker">A SIMPLE FLOW</span><h2>From hello to <em>hell yes.</em></h2><p>Less chasing. More creating. One shared place for the work.</p></div><div className="landing-step-grid mt-10">{steps.map(([title, desc], i) => <div className="landing-step" key={title}><span className="step-num">0{i + 1}</span><h3>{title}</h3><p>{desc}</p></div>)}</div></section>
        <section id="about" className="landing-role-section mx-auto max-w-7xl px-6 py-16"><div className="landing-role-card role-brand"><span className="role-label">FOR BRANDS</span><h2>Find creators.<br/><em>Build momentum.</em></h2><p>Discover talent, organize campaigns, and turn your ideas into work people remember.</p><Link to="/register" className="role-link">Build your next campaign ↗</Link><div className="role-art"><div className="role-art-pill">Campaign / 04</div><div className="role-art-squares"><span/><span/><span/></div></div></div><div className="landing-role-card role-creator"><span className="role-label">FOR CREATORS</span><h2>Show your work.<br/><em>Find your next fit.</em></h2><p>Make your portfolio visible, connect with brands, and manage opportunities with clarity.</p><Link to="/register" className="role-link">Create your profile ↗</Link><div className="creator-art"><span className="art-circle circle-one"/><span className="art-circle circle-two"/><span className="art-star">✳</span><span className="art-note">Make<br/>something<br/>great.</span></div></div></section>
        <section id="features" className="landing-section mx-auto max-w-7xl px-6 py-20"><div className="section-heading"><span className="landing-kicker">THE TOOLKIT</span><h2>Everything in its <em>right place.</em></h2><p>A little more structure behind every creative partnership.</p></div><div className="landing-feature-grid mt-10">{feats.map(([I, t, d]) => <div key={t} className="landing-feature"><span className="feature-icon"><I size={19}/></span><h3>{t}</h3><p>{d}</p></div>)}</div></section>
        <section className="landing-final mx-auto max-w-7xl px-6 pb-20"><div className="landing-final-inner"><div><span className="landing-kicker">LET'S MAKE IT HAPPEN</span><h2>Your next great<br/><em>collaboration starts here.</em></h2></div><Link className="btn btn-p btn-lg" to="/register">Join Collably ↗</Link></div></section>
      </main>
      <footer className="landing-footer mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-8"><Link to="/" className="brand-lockup"><span className="logo">C</span><span>collably</span></Link><p>College project prototype · Sample creators and campaigns</p><span>© Collably</span></footer>
    </div>
  )
}

export function Login() {
  const { a } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
  const [verifyNotice, setVerifyNotice] = useState('')
  const resend = async () => {
    if (!f.email.includes('@')) { setVerifyNotice('Enter your email above first.'); return }
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: f.email }),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Unable to send email right now.')
      }
      setVerifyNotice('If this account needs verification, a new link has been sent.')
    } catch (error) { setVerifyNotice((error as Error).message) }
  }
  // The route guard sends each role to its own dashboard, so any dashboard path works here.
  const enter = async (ok: Promise<boolean>) => { if (await ok) nav('/brand/dashboard') }
  return (
    <div className="mx-auto mt-16 max-w-md px-6">
      <h1 className="text-2xl font-semibold">Sign in to Collably</h1>
      <form className="mt-6 space-y-3 text-sm" onSubmit={e => { e.preventDefault(); enter(a.login(f.email, f.password)) }}>
        <label className="block">Email<input type="email" className="input mt-1" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label>
        <label className="block">Password<input type="password" className="input mt-1" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>
        <button className="btn btn-p w-full justify-center" type="submit">Sign in</button>
        <p className="text-muted"><Link className="text-accent underline" to="/forgot-password">Forgot password?</Link> Or <Link className="text-accent underline" to="/register">create an account</Link>.</p>
        <button type="button" className="text-accent underline" onClick={resend}>Resend verification email</button>{verifyNotice && <p className="text-muted">{verifyNotice}</p>}
      </form>
      {SHOW_DEMO && <><p className="mt-8 text-sm font-medium">Or try a demo account (password demo1234)</p>
      <div className="mt-3 space-y-3">
        {(['brand', 'creator', 'admin'] as Role[]).map(r => (
          <button key={r} className="card block w-full text-left" onClick={() => enter(a.demoLogin(r))}>
            <b className="capitalize">Continue as {r}</b>
            <span className="block text-sm text-muted">demo-{r}@collably.test</span>
          </button>
        ))}
      </div></>}
    </div>
  )
}


export function Register() {
  const nav = useNavigate()
  const [role, setRole] = useState<'brand' | 'creator'>('brand')
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState('')
  const [result, setResult] = useState<{ verificationRequired: boolean, emailSent: boolean } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const submit = async () => {
    setErr('')
    if (!f.name.trim() || !f.email.includes('@') || f.password.length < 8) { setErr('Enter your name, a valid email and a password of at least 8 characters.'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, name: f.name.trim(), email: f.email.trim(), password: f.password }) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Registration failed')
      setResult(data)
    } catch (e) { setErr((e as Error).message) }
    finally { setSubmitting(false) }
  }
  const roles: ['brand' | 'creator', string, string][] = [
    ['brand', 'Brand', 'Find creators, run campaigns and review their work.'],
    ['creator', 'Creator', 'Build a portfolio and collaborate with brands.'],
  ]
  return (
    <div className="mx-auto mt-16 max-w-md px-6">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      {result ? <div className="mt-6 card">
        <h2 className="font-semibold">{result.verificationRequired ? 'Verify your email' : 'Account created'}</h2>
        <p className="mt-2 text-sm text-muted">{result.emailSent
          ? `We sent a verification link to ${f.email}. Verify your email before signing in.`
          : result.verificationRequired ? 'Request a new verification email on the sign-in page.' : 'You can now sign in to Collably.'}</p>
        <button className="btn btn-p mt-4" onClick={() => nav('/login')}>Go to sign in</button>
      </div> : <>
      <fieldset className="mt-6 grid gap-3"><legend className="mb-2 text-sm font-medium">I am joining as</legend>{roles.map(([r, t, d]) => (
        <label key={r} className={`card cursor-pointer ${role === r ? 'border-accent' : ''}`}><input type="radio" name="role" className="mr-2" checked={role === r} onChange={() => setRole(r)} /><b>{t}</b><span className="block text-sm text-muted">{d}</span></label>
      ))}</fieldset>
      <div className="mt-4 space-y-3 text-sm"><label className="block">Full name<input className="input mt-1" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></label><label className="block">Email<input type="email" className="input mt-1" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></label><label className="block">Password<input type="password" className="input mt-1" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></label>{err && <p role="alert" className="text-red-600">{err}</p>}<button className="btn btn-p w-full justify-center" disabled={submitting} onClick={submit}>Create account</button><p className="text-muted">Already registered? <Link className="text-accent underline" to="/login">Sign in</Link></p></div></>}
    </div>
  )
}


export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')
  const send = async () => {
    setErr('')
    if (!email.includes('@')) { setErr('Enter a valid email address.'); return }
    try {
      const response = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.detail || 'Could not send reset request. Try again.')
      }
      setSent(true)
    } catch (e) { setErr((e as Error).message) }
  }
  return <div className="mx-auto mt-24 max-w-md px-6 text-sm"><h1 className="text-2xl font-semibold">Reset your password</h1>{sent ? <p className="mt-4 card">If an account exists for {email}, a password-reset email has been sent.</p> : <div className="mt-4 space-y-3"><label className="block">Email<input type="email" className="input mt-1" value={email} onChange={e => setEmail(e.target.value)} /></label>{err && <p role="alert" className="text-red-600">{err}</p>}<button className="btn btn-p" onClick={send}>Send reset link</button></div>}<p className="mt-4"><Link className="text-accent underline" to="/login">Back to sign in</Link></p></div>
}


export function VerifyEmail() {
  const [message, setMessage] = useState('Verifying your email…')
  const [error, setError] = useState(false)
  const started = useRef(false)
  useEffect(() => {
    if (started.current) return
    started.current = true
    const token = new URLSearchParams(window.location.search).get('token')
    if (!token) { setMessage('Verification link is missing.'); setError(true); return }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`).then(async response => {
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || 'Verification failed')
      setMessage('Your email is verified. You can now sign in to Collably.')
    }).catch(e => { setMessage((e as Error).message); setError(true) })
  }, [])
  return <div className="mx-auto mt-24 max-w-md px-6"><div className="card"><h1 className="text-xl font-semibold">Email verification</h1><p className={`mt-3 ${error ? 'text-red-600' : 'text-muted'}`}>{message}</p><Link className="btn btn-p mt-5 inline-flex" to="/login">Go to sign in</Link></div></div>
}


export function ResetPassword() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(false)
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const submit = async () => { setMessage(''); if (password.length < 8) { setError(true); setMessage('Password must be at least 8 characters.'); return } try { const r = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) }); const data = await r.json().catch(() => ({})); if (!r.ok) throw new Error(data.detail || 'Password reset failed'); setError(false); setMessage('Password updated successfully. You can now sign in.') } catch (e) { setError(true); setMessage((e as Error).message) } }
  return <div className="mx-auto mt-24 max-w-md px-6"><div className="card"><h1 className="text-xl font-semibold">Choose a new password</h1><label className="block mt-4 text-sm">New password<input type="password" className="input mt-1" value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p className={`mt-3 ${error ? 'text-red-600' : 'text-green-700'}`}>{message}</p>}<button className="btn btn-p mt-4" onClick={submit}>Update password</button><Link className="block mt-4 text-accent underline" to="/login">Back to sign in</Link></div></div>
}
