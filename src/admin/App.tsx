import {
  Briefcase,
  Building2,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Home,
  Info,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Palette,
  Phone,
  Quote,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { api, ApiError, type AdminUser, type Model } from './api'
import { sectionProblems } from './checks'
import { SectionEditor } from './editors'
import { sections } from './sections'

const ICONS: Record<string, LucideIcon> = { quote: Quote, users: Users, building: Building2, briefcase: Briefcase, home: Home, info: Info, file: FileText, phone: Phone, palette: Palette, search: Search }

type Route = 'dashboard' | 'users' | 'account' | (typeof sections)[number]['id']

const routeFromHash = (): Route => {
  const h = window.location.hash.replace(/^#\/?/, '')
  return (['dashboard', 'users', 'account', ...sections.map((s) => s.id)].includes(h) ? h : 'dashboard') as Route
}

const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50'
const btnPrimary = `${btn} bg-amber-500 text-zinc-950 shadow-sm hover:bg-amber-400`
const btnDark = `${btn} bg-zinc-900 text-white hover:bg-zinc-700`
const btnGhost = `${btn} text-zinc-700 hover:bg-zinc-100`
const inputClass = 'w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-zinc-900 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/15'

export default function App() {
  const [state, setState] = useState<{ loading: boolean; user: AdminUser | null; setupProblem: string | null; readOnly: boolean; notice?: string }>({ loading: true, user: null, setupProblem: null, readOnly: false })

  const refresh = useCallback(async (notice?: string) => {
    try {
      const me = await api.me()
      setState({ loading: false, user: me.user, setupProblem: me.setupProblem, readOnly: me.readOnly, notice })
    } catch (e) {
      setState({ loading: false, user: null, setupProblem: (e as Error).message, readOnly: false })
    }
  }, [])

  useEffect(() => {
    // Load the signed-in user once on start.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh()
  }, [refresh])

  if (state.loading) return <FullScreenSpinner />
  if (!state.user) return <Login setupProblem={state.setupProblem} notice={state.notice} onLogin={() => refresh()} />
  return <Shell user={state.user} readOnly={state.readOnly} onSignedOut={(notice) => refresh(notice)} />
}

function FullScreenSpinner() {
  return (
    <div className="grid min-h-screen place-items-center bg-zinc-100">
      <LoaderCircle className="size-8 animate-spin text-amber-500" aria-label="Loading" />
    </div>
  )
}

function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <img src="/logo.webp" alt="Kunnect" className="h-9 w-auto" />
      <span className={`rounded-md px-2 py-0.5 text-[0.7rem] font-bold tracking-wider uppercase ${dark ? 'bg-white/10 text-amber-300' : 'bg-zinc-900 text-amber-300'}`}>Admin</span>
    </div>
  )
}

// ── Login ───────────────────────────────────────────────────────────────────

function Login({ setupProblem, notice, onLogin }: { setupProblem: string | null; notice?: string; onLogin: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api.login(username, password)
      onLogin()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_top,#2a2110,#07070b_60%)] p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand dark />
        </div>
        <form onSubmit={submit} className="rounded-2xl bg-white p-7 shadow-2xl shadow-black/40" aria-describedby={error ? 'login-error' : undefined}>
          <h1 className="text-xl font-semibold text-zinc-900">Log in to your website</h1>
          <p className="mt-1 text-sm text-zinc-500">Edit content, testimonials, team and more.</p>
          {(setupProblem || notice) && (
            <p className={`mt-5 flex gap-2 rounded-lg p-3 text-sm ${setupProblem ? 'bg-amber-50 text-amber-900' : 'bg-emerald-50 text-emerald-900'}`}>
              {setupProblem ? <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
              {setupProblem || notice}
            </p>
          )}
          <label htmlFor="u" className="mt-6 block text-sm font-semibold text-zinc-800">
            Username
          </label>
          <input id="u" className={`${inputClass} mt-1.5`} autoComplete="username" autoCapitalize="none" spellCheck={false} required value={username} onChange={(e) => setUsername(e.target.value)} />
          <label htmlFor="p" className="mt-4 block text-sm font-semibold text-zinc-800">
            Password
          </label>
          <div className="relative mt-1.5">
            <input id="p" className={`${inputClass} pr-11`} type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-zinc-500 hover:text-zinc-800">
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {error && (
            <p id="login-error" role="alert" className="mt-4 text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy || !!setupProblem} className={`${btnPrimary} mt-6 w-full py-3`}>
            {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-400">
          <a href="/" className="hover:text-white">
            ← Back to the website
          </a>
        </p>
      </div>
    </main>
  )
}

// ── Signed-in shell ─────────────────────────────────────────────────────────

type SaveState = { kind: 'idle' } | { kind: 'saving' } | { kind: 'publishing'; revision: number; since: number } | { kind: 'live' } | { kind: 'saved-no-publish' } | { kind: 'error'; message: string; errors?: string[]; conflict?: boolean }

function Shell({ user, readOnly, onSignedOut }: { user: AdminUser; readOnly: boolean; onSignedOut: (notice?: string) => void }) {
  const [route, setRoute] = useState<Route>(routeFromHash)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [revision, setRevision] = useState('')
  const [model, setModelState] = useState<Model | null>(null)
  const [saved, setSaved] = useState<string>('')
  const [save, setSave] = useState<SaveState>({ kind: 'idle' })
  const [sheetWarnings, setSheetWarnings] = useState<string[]>([])

  const dirty = useMemo(() => model !== null && JSON.stringify(model) !== saved, [model, saved])

  const handleAuth = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) onSignedOut('Your session ended. Please log in again.')
    },
    [onSignedOut],
  )

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const data = await api.content()
      const m = { settings: data.settings, lists: data.lists }
      setModelState(m)
      setSaved(JSON.stringify(m))
      setRevision(data.revision)
      setSheetWarnings(data.warnings ?? [])
    } catch (e) {
      handleAuth(e)
      setLoadError((e as Error).message)
    }
  }, [handleAuth])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  useEffect(() => {
    const onHash = () => {
      setRoute(routeFromHash())
      setMenuOpen(false)
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  // After saving, watch the live website until the new content is published.
  const pollRef = useRef<number | undefined>(undefined)
  useEffect(() => {
    if (save.kind !== 'publishing') return
    const check = async () => {
      try {
        const res = await fetch(`/content-version.json?t=${Date.now()}`, { cache: 'no-store' })
        const live = res.ok ? Number((await res.json()).revision) : NaN
        if (live >= save.revision) return setSave({ kind: 'live' })
      } catch {
        /* keep waiting */
      }
      if (Date.now() - save.since < 8 * 60_000) pollRef.current = window.setTimeout(check, 10_000)
    }
    pollRef.current = window.setTimeout(check, 15_000)
    return () => window.clearTimeout(pollRef.current)
  }, [save])

  const setModel = useCallback((fn: (m: Model) => Model) => setModelState((m) => (m ? fn(m) : m)), [])

  const doSave = async () => {
    if (!model) return
    setSave({ kind: 'saving' })
    try {
      const res = await api.save(revision, model)
      setRevision(res.revision)
      setSaved(JSON.stringify(model))
      setSheetWarnings([])
      setSave(res.publishing ? { kind: 'publishing', revision: Number(res.revision), since: Date.now() } : { kind: 'saved-no-publish' })
    } catch (e) {
      handleAuth(e)
      const err = e as ApiError
      setSave({ kind: 'error', message: err.message, errors: (err.data?.errors as string[]) ?? undefined, conflict: err.status === 409 })
    }
  }

  const logout = async () => {
    if (dirty && !window.confirm('You have unsaved changes. Log out anyway?')) return
    await api.logout().catch(() => {})
    onSignedOut('You have logged out.')
  }

  const section = sections.find((s) => s.id === route)
  const nav = (
    <nav aria-label="Admin" className="space-y-6">
      <ul className="space-y-0.5">
        <NavItem href="#/dashboard" active={route === 'dashboard'} icon={LayoutDashboard} label="Dashboard" />
      </ul>
      <div>
        <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-zinc-500 uppercase">Content</p>
        <ul className="mt-2 space-y-0.5">
          {sections.map((s) => (
            <NavItem key={s.id} href={`#/${s.id}`} active={route === s.id} icon={ICONS[s.icon] ?? FileText} label={s.label} problems={model ? sectionProblems(s, model) : 0} />
          ))}
        </ul>
      </div>
      <div>
        <p className="px-3 text-[0.7rem] font-semibold tracking-wider text-zinc-500 uppercase">Settings</p>
        <ul className="mt-2 space-y-0.5">
          <NavItem href="#/users" active={route === 'users'} icon={Users} label="Users" />
          <NavItem href="#/account" active={route === 'account'} icon={KeyRound} label="My account" />
        </ul>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-zinc-950 p-4 text-zinc-300 lg:flex">
        <div className="px-2 py-2">
          <Brand dark />
        </div>
        <div className="mt-8 flex-1 overflow-y-auto">{nav}</div>
        <div className="mt-4 border-t border-white/10 pt-4 text-sm">
          <p className="truncate px-2 text-zinc-400">
            Signed in as <span className="font-semibold text-white">{user.username}</span>
          </p>
          <button type="button" onClick={logout} className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-zinc-300 hover:bg-white/10 hover:text-white">
            <LogOut className="size-4" aria-hidden="true" /> Log out
          </button>
        </div>
      </aside>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-zinc-950 p-4 text-zinc-300">
            <div className="flex items-center justify-between">
              <Brand dark />
              <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="grid size-10 place-items-center rounded-lg hover:bg-white/10">
                <X className="size-5" />
              </button>
            </div>
            <div className="mt-6">{nav}</div>
            <button type="button" onClick={logout} className="mt-6 flex w-full items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10">
              <LogOut className="size-4" aria-hidden="true" /> Log out
            </button>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
          <div className="flex items-center gap-3 px-4 py-3 md:px-8">
            <button type="button" onClick={() => setMenuOpen(true)} aria-label="Open menu" className="grid size-10 place-items-center rounded-lg hover:bg-zinc-100 lg:hidden">
              <Menu className="size-5" />
            </button>
            <h1 className="min-w-0 flex-1 truncate text-lg font-semibold">{section?.label ?? { dashboard: 'Dashboard', users: 'Users', account: 'My account' }[route as string]}</h1>
            <a href="/" target="_blank" rel="noopener" className={`${btnGhost} hidden sm:inline-flex`}>
              <ExternalLink className="size-4" aria-hidden="true" /> View website
            </a>
            {model && (
              <>
                {dirty && <span className="hidden text-sm font-medium text-amber-700 sm:inline">Unsaved changes</span>}
                <button type="button" onClick={doSave} disabled={readOnly || !dirty || save.kind === 'saving'} className={btnPrimary}>
                  {save.kind === 'saving' ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <Send className="size-4" aria-hidden="true" />}
                  {save.kind === 'saving' ? 'Saving…' : 'Save & publish'}
                </button>
              </>
            )}
          </div>
          <StatusBar save={save} onDismiss={() => setSave({ kind: 'idle' })} onReload={() => (setSave({ kind: 'idle' }), load())} />
        </header>

        <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          {readOnly && (
            <p className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
              This is a preview deploy, so editing is switched off here. Use the admin panel on the live website to make changes.
            </p>
          )}
          {loadError && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">Could not load the content.</p>
              <p className="mt-1">{loadError}</p>
              <button type="button" onClick={load} className={`${btnDark} mt-3`}>
                <RefreshCw className="size-4" aria-hidden="true" /> Try again
              </button>
            </div>
          )}
          {sheetWarnings.length > 0 && route !== 'users' && route !== 'account' && (
            <details className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <summary className="cursor-pointer font-semibold">{sheetWarnings.length} item(s) in the content need attention</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {sheetWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          )}

          {route === 'dashboard' && <Dashboard model={model} user={user} readOnly={readOnly} onAuth={handleAuth} />}
          {route === 'users' && <UsersPage me={user} readOnly={readOnly} onAuth={handleAuth} />}
          {route === 'account' && <AccountPage me={user} readOnly={readOnly} onSignedOut={onSignedOut} />}
          {section && (
            <>
              {section.description && <p className="mb-6 text-zinc-600">{section.description}</p>}
              {model ? <SectionEditor section={section} model={model} setModel={setModel} readOnly={readOnly} /> : !loadError && <LoadingCard />}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function NavItem({ href, active, icon: Icon, label, problems = 0 }: { href: string; active: boolean; icon: LucideIcon; label: string; problems?: number }) {
  return (
    <li>
      <a href={href} aria-current={active ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active ? 'bg-amber-500 font-semibold text-zinc-950' : 'text-zinc-300 hover:bg-white/10 hover:text-white'}`}>
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        <span className="flex-1 truncate">{label}</span>
        {problems > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 text-[0.7rem] font-bold text-white" title={`${problems} field(s) to fix`}>
            {problems}
          </span>
        )}
      </a>
    </li>
  )
}

function LoadingCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-8 text-zinc-500">
      <LoaderCircle className="size-5 animate-spin text-amber-500" aria-hidden="true" /> Loading content from Google Sheets…
    </div>
  )
}

function StatusBar({ save, onDismiss, onReload }: { save: SaveState; onDismiss: () => void; onReload: () => void }) {
  if (save.kind === 'idle' || save.kind === 'saving') return null
  const tone =
    save.kind === 'error' ? 'bg-red-50 text-red-800 border-red-200' : save.kind === 'live' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-amber-50 text-amber-900 border-amber-200'
  return (
    <div role="status" className={`border-t px-4 py-3 text-sm md:px-8 ${tone}`}>
      <div className="flex items-start gap-3">
        {save.kind === 'publishing' ? <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden="true" /> : save.kind === 'error' ? <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /> : <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
        <div className="flex-1">
          {save.kind === 'publishing' && <p>Saved to Google Sheets. The website is updating — this usually takes about 2 minutes.</p>}
          {save.kind === 'live' && (
            <p>
              Your changes are live.{' '}
              <a href="/" target="_blank" rel="noopener" className="font-semibold underline">
                View website
              </a>
            </p>
          )}
          {save.kind === 'saved-no-publish' && <p>Saved to Google Sheets. Publishing isn’t set up yet (NETLIFY_BUILD_HOOK), so the website will update on its next build.</p>}
          {save.kind === 'error' && (
            <>
              <p className="font-semibold">{save.message}</p>
              {save.errors && (
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {save.errors.slice(0, 12).map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
              {save.conflict && (
                <button type="button" onClick={onReload} className="mt-2 font-semibold underline">
                  Reload the latest content (your unsaved changes will be lost)
                </button>
              )}
            </>
          )}
        </div>
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="grid size-7 place-items-center rounded hover:bg-black/5">
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

// ── Dashboard ───────────────────────────────────────────────────────────────

function Dashboard({ model, user, readOnly, onAuth }: { model: Model | null; user: AdminUser; readOnly: boolean; onAuth: (e: unknown) => void }) {
  const [publishMsg, setPublishMsg] = useState('')
  const count = (tab: string) => (model?.lists[tab] ?? []).filter((i) => i.show).length
  const cards = [
    { href: '#/testimonials', label: 'Testimonials', value: count('Testimonials'), icon: Quote },
    { href: '#/services', label: 'Services', value: count('Services'), icon: Briefcase },
    { href: '#/team', label: 'Team members', value: count('Team'), icon: Users },
    { href: '#/clients', label: 'Clients & collaborators', value: count('Clients'), icon: Building2 },
  ]
  const placeholders = model ? Object.values(model.lists).flat().filter((i) => i.show && /^yes$/i.test(i.cells.placeholder ?? '')).length : 0
  const hide = /^yes$/i.test(model?.settings.Company?.['launch.hide_placeholders'] ?? '')

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-zinc-950 p-7 text-white">
        <p className="text-sm text-amber-300">Welcome back</p>
        <h2 className="mt-1 text-2xl font-semibold">Hello, {user.name === 'Owner' ? user.username : user.name}</h2>
        <p className="mt-2 max-w-xl text-zinc-400">Choose a section on the left, make your changes, then click Save &amp; publish. The website updates in about 2 minutes.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-amber-400">
            <span className="grid size-12 place-items-center rounded-xl bg-amber-100 text-amber-700">
              <c.icon className="size-6" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-2xl font-semibold">{model ? c.value : '–'}</span>
              <span className="text-sm text-zinc-500">{c.label} shown</span>
            </span>
          </a>
        ))}
      </div>
      {model && placeholders > 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">{placeholders} placeholder item(s) {hide ? 'are hidden on the website' : 'are still visible on the website'}.</p>
          <p className="mt-1">Replace them with real content, or turn on “Hide placeholder content” under <a className="underline" href="#/company">Company &amp; contact</a> before launch.</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Customer reviews</h3>
          <p className="mt-1 text-sm text-zinc-600">Reviews sent from the website arrive in Netlify → Forms → feedback. Add the approved ones under <a className="underline" href="#/testimonials">Testimonials</a>.</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Rebuild the website</h3>
          <p className="mt-1 text-sm text-zinc-600">Only needed if you edited the Google Sheet directly.</p>
          <button
            type="button"
            disabled={readOnly}
            className={`${btnDark} mt-3`}
            onClick={async () => {
              setPublishMsg('')
              try {
                await api.publish()
                setPublishMsg('Publishing started — the website updates in about 2 minutes.')
              } catch (e) {
                onAuth(e)
                setPublishMsg((e as Error).message)
              }
            }}
          >
            <RefreshCw className="size-4" aria-hidden="true" /> Publish now
          </button>
          {publishMsg && <p className="mt-2 text-sm text-zinc-700">{publishMsg}</p>}
        </div>
      </div>
    </div>
  )
}

// ── Users ───────────────────────────────────────────────────────────────────

function UsersPage({ me, readOnly, onAuth }: { me: AdminUser; readOnly: boolean; onAuth: (e: unknown) => void }) {
  const [users, setUsers] = useState<(AdminUser & { createdAt: string; createdBy: string })[] | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ username: '', name: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    try {
      setUsers((await api.users()).users)
    } catch (e) {
      onAuth(e)
      setError((e as Error).message)
    }
  }, [onAuth])
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const add = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await api.addUser(form.username, form.name, form.password)
      setMessage(`${form.name} can now log in as “${form.username.toLowerCase()}”.`)
      setForm({ username: '', name: '', password: '' })
      await load()
    } catch (err) {
      onAuth(err)
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-semibold">People who can log in</h2>
        {!users && !error && <LoaderCircle className="mt-4 size-5 animate-spin text-amber-500" aria-label="Loading" />}
        <ul className="mt-4 divide-y divide-zinc-100">
          {users?.map((u) => (
            <li key={u.username} className="flex items-center gap-3 py-3">
              <span className="grid size-10 place-items-center rounded-full bg-zinc-900 font-semibold text-amber-300">{(u.name || u.username).charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">
                  {u.name} {u.username === me.username && <span className="text-sm font-normal text-zinc-500">(you)</span>}
                </span>
                <span className="block truncate text-sm text-zinc-500">
                  {u.username}
                  {u.owner ? ' · owner (managed in Netlify)' : u.createdBy ? ` · added by ${u.createdBy}` : ''}
                </span>
              </span>
              {!u.owner && u.username !== me.username && (
                <button
                  type="button"
                  disabled={readOnly}
                  className="rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40"
                  onClick={async () => {
                    if (!window.confirm(`Remove ${u.name}? They will no longer be able to log in.`)) return
                    try {
                      await api.removeUser(u.username)
                      await load()
                    } catch (e) {
                      onAuth(e)
                      setError((e as Error).message)
                    }
                  }}
                >
                  Remove
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={add} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-semibold">Add a user</h2>
        <p className="mt-1 text-sm text-zinc-500">They can edit all content. Share the password with them privately.</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-zinc-800">
            Name
            <input className={`${inputClass} mt-1.5 font-normal`} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-zinc-800">
            Username
            <input className={`${inputClass} mt-1.5 font-normal`} required autoCapitalize="none" pattern="[a-zA-Z0-9._\-]{3,32}" title="3–32 letters, numbers, dots, dashes or underscores" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          </label>
          <label className="block text-sm font-semibold text-zinc-800 sm:col-span-2">
            Password (at least 10 characters)
            <input className={`${inputClass} mt-1.5 font-normal`} required minLength={10} type="password" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </label>
        </div>
        {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
        {message && <p role="status" className="mt-4 text-sm font-medium text-emerald-700">{message}</p>}
        <button type="submit" disabled={busy || readOnly} className={`${btnDark} mt-5`}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <UserPlus className="size-4" aria-hidden="true" />} Add user
        </button>
      </form>
    </div>
  )
}

// ── Account ─────────────────────────────────────────────────────────────────

function AccountPage({ me, readOnly, onSignedOut }: { me: AdminUser; readOnly: boolean; onSignedOut: (n?: string) => void }) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (me.owner) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
        <h2 className="text-lg font-semibold">Owner account</h2>
        <p className="mt-2 text-sm text-zinc-600">
          You’re signed in with the owner account <strong>{me.username}</strong>. Its password is set in Netlify → Site configuration → Environment variables (<code>ADMIN_PASSWORD</code>). Change it there and redeploy; everyone using the owner login is signed out.
        </p>
      </section>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (next !== confirm) return setError('The new passwords don’t match.')
    setBusy(true)
    try {
      await api.changePassword(current, next)
      onSignedOut('Password changed. Please log in with your new password.')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm md:p-7">
      <h2 className="text-lg font-semibold">Change your password</h2>
      <p className="mt-1 text-sm text-zinc-500">Signed in as {me.username}.</p>
      {[
        ['Current password', current, setCurrent, 'current-password'],
        ['New password (at least 10 characters)', next, setNext, 'new-password'],
        ['Repeat new password', confirm, setConfirm, 'new-password'],
      ].map(([label, value, set, ac]) => (
        <label key={label as string} className="mt-4 block text-sm font-semibold text-zinc-800">
          {label as string}
          <input className={`${inputClass} mt-1.5 font-normal`} type="password" required minLength={label === 'Current password' ? 1 : 10} autoComplete={ac as string} value={value as string} onChange={(e) => (set as (v: string) => void)(e.target.value)} />
        </label>
      ))}
      {error && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy || readOnly} className={`${btnDark} mt-5`}>
        {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />} Change password
      </button>
    </form>
  )
}
