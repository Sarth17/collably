"""Run once from your project root (the folder that contains package.json):  python upgrade_frontend.py
Switches the frontend from sample data in the browser to the FastAPI backend. All edits are checked first;
if any expected text is missing nothing is changed."""
import os
import sys

LOGIN = '''export function Login() {
  const { a } = useStore()
  const nav = useNavigate()
  const [f, setF] = useState({ email: '', password: '' })
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
      </form>
      <p className="mt-8 text-sm font-medium">Or try a demo account (password demo1234)</p>
      <div className="mt-3 space-y-3">
        {(['brand', 'creator', 'admin'] as Role[]).map(r => (
          <button key={r} className="card block w-full text-left" onClick={() => enter(a.demoLogin(r))}>
            <b className="capitalize">Continue as {r}</b>
            <span className="block text-sm text-muted">demo-{r}@collably.test</span>
          </button>
        ))}
      </div>
    </div>
  )
}

'''

EDITS = {
    'vite.config.ts': [
        ('export default defineConfig({ plugins: [react(), tailwindcss()] })',
         "export default defineConfig({\n  plugins: [react(), tailwindcss()],\n  server: { proxy: { '/api': 'http://localhost:8000' } }, // the FastAPI backend\n})"),
    ],
    'src/App.tsx': [
        ('  const { s } = useStore()\n  if (!s.session) return <Navigate to="/login" replace />',
         '  const { s, ready } = useStore()\n  if (!ready) return <p className="p-10 text-sm text-muted">Loading…</p>\n  if (!s.session) return <Navigate to="/login" replace />'),
        ('onChange={e => { const r = e.target.value as Role; a.login(r); nav(`/${r}/dashboard`) }}',
         'onChange={async e => { const r = e.target.value as Role; if (await a.demoLogin(r)) nav(`/${r}/dashboard`) }}'),
    ],
    'src/pages/Brand.tsx': [
        ('const go = (launch: boolean) => {', 'const go = async (launch: boolean) => {'),
        ('const id = a.createCampaign(', 'const id = await a.createCampaign('),
        ('    nav(`/brand/campaigns/${id}`)', '    if (id) nav(`/brand/campaigns/${id}`)'),
    ],
    'src/pages/Public.tsx': [
        ('Prototype: nothing is stored on a server. Registering signs you in as the demo account for the role you choose.',
         'Your account is saved in the Collably database, so you can sign in again later.'),
        ('  const submit = () => {', '  const submit = async () => {'),
        ('    a.login(role)\n    nav(`/${role}/dashboard`)',
         "    if (await a.register({ role, name: f.name.trim(), email: f.email.trim(), password: f.password })) nav(`/${role}/dashboard`)"),
        ('block', 'export function Login() {', 'export function Register() {', LOGIN),
    ],
}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def plan():
    out = {}
    for path, edits in EDITS.items():
        text = read(path)
        for e in edits:
            if e[0] == 'block':
                _, start, end, new = e
                i = text.find(start)
                j = text.find(end, i) if i >= 0 else -1
                if i < 0 or j < 0:
                    sys.exit(f'Cannot patch {path}: could not find "{start}". Nothing was changed.')
                text = text[:i] + new + text[j:]
            else:
                old, new = e
                if text.count(old) != 1:
                    sys.exit(f'Cannot patch {path}: expected text not found:\n  {old[:80]}\nNothing was changed.')
                text = text.replace(old, new)
        out[path] = text
    return out


if __name__ == '__main__':
    if not (os.path.exists('package.json') and os.path.exists('src/App.tsx')):
        sys.exit('Run this from the project root (the folder with package.json).')
    if 'demoLogin' in read('src/App.tsx'):
        sys.exit('Already upgraded. Nothing to do.')
    result = plan()
    for path, text in result.items():
        with open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(text)
    if os.path.exists('src/data.ts'):
        os.remove('src/data.ts')  # sample data now lives in backend/seed.py
    print('Frontend upgraded. Now start the backend (see UPGRADE.md), then run: npm run dev')
