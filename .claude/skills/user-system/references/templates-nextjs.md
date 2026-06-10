# Next.js App Router — User System Patterns

## Session Strategy

Next.js App Router doesn't have express-session. Use one of:

1. **`iron-session`** — encrypted cookie, no DB needed. Good for simple cases.
2. **Server-side session with DB** — store session in Redis/DB, pass session ID via cookie. More robust.

The examples below use `iron-session` for simplicity. For production, prefer a server-side store.

```bash
npm install iron-session
```

## Session Type

```ts
// lib/session.ts
import { getIronSession, SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'

export type SessionUser = {
  ssoSubject: string
  username: string
  displayName: string
  email: string
  avatarUrl: string
}

export type AppSession = {
  user?: SessionUser
  sso?: {
    state: string
    codeVerifier: string
    returnTo: string
    createdAt: number
  }
  tokens?: {
    access_token: string
    refresh_token?: string
    expires_at: number
  }
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: 'app.sid',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}

export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions)
}
```

## Route Handlers

### `app/auth/login/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { randomBase64Url, createCodeChallenge, buildAuthorizeUrl, safeReturnTo } from '@/lib/sso'

export async function GET(req: NextRequest) {
  const returnTo = safeReturnTo(req.nextUrl.searchParams.get('returnTo') ?? '')
  const state = randomBase64Url(24)
  const codeVerifier = randomBase64Url(32)
  const codeChallenge = createCodeChallenge(codeVerifier)

  const session = await getSession()
  session.sso = { state, codeVerifier, returnTo, createdAt: Date.now() }
  await session.save()

  return NextResponse.redirect(buildAuthorizeUrl({ state, codeChallenge }))
}
```

### `app/auth/callback/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { exchangeCodeForTokens, fetchUserInfo } from '@/lib/sso'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const session = await getSession()

  if (searchParams.get('error')) {
    return NextResponse.json({ error: searchParams.get('error_description') }, { status: 401 })
  }

  const sso = session.sso
  if (!sso || searchParams.get('state') !== sso.state) {
    return NextResponse.json({ error: 'invalid_state' }, { status: 400 })
  }

  const code = searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'missing_code' }, { status: 400 })

  delete session.sso

  try {
    const tokens = await exchangeCodeForTokens({ code, codeVerifier: sso.codeVerifier })
    const userInfo = await fetchUserInfo(tokens.access_token)

    session.tokens = tokens
    session.user = {
      ssoSubject: userInfo.sub,
      username: userInfo.preferred_username || userInfo.name || userInfo.sub,
      displayName: userInfo.name || userInfo.preferred_username || userInfo.sub,
      email: userInfo.email ?? '',
      avatarUrl: userInfo.picture ?? '',
    }
    await session.save()

    return NextResponse.redirect(new URL(sso.returnTo || '/', req.nextUrl.origin))
  } catch (err) {
    session.destroy()
    return NextResponse.redirect(new URL('/auth/error', req.nextUrl.origin))
  }
}
```

### `app/api/me/route.ts`

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session.user) return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  return NextResponse.json(session.user)
}
```

### `app/auth/logout/route.ts`

```ts
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function POST() {
  const session = await getSession()
  session.destroy()
  return new NextResponse(null, { status: 204 })
}

export async function GET() {
  const session = await getSession()
  session.destroy()
  return NextResponse.redirect(new URL('/', process.env.APP_BASE_URL!))
}
```

## Middleware (Protecting Routes)

```ts
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { AppSession, sessionOptions } from '@/lib/session'

const PROTECTED = ['/dashboard', '/settings', '/api/']
const AUTH_ROUTES = ['/auth/login', '/auth/callback']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const res = NextResponse.next()
  const session = await getIronSession<AppSession>(req, res, sessionOptions)

  if (!session.user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    }
    const returnTo = encodeURIComponent(pathname + req.nextUrl.search)
    return NextResponse.redirect(new URL(`/auth/login?returnTo=${returnTo}`, req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/api/:path*'],
}
```

## Server Component Auth Check

```ts
// In any server component
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function ProtectedPage() {
  const session = await getSession()
  if (!session.user) redirect('/auth/login')

  return <div>Hello {session.user.displayName}</div>
}
```

## Notes

- `iron-session` uses encrypted cookies — no DB required, but cookie size is limited (~4KB). If you store large data, switch to a server-side store.
- For local auth (mode 1) with Next.js, use the same session pattern but replace SSO routes with `app/auth/register/route.ts` and `app/auth/login/route.ts` (POST handlers).
- Prisma works well with Next.js — generate the client in `lib/db.ts` as a singleton to avoid connection pool exhaustion in dev.
