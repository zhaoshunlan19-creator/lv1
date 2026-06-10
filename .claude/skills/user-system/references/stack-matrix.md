# Stack Matrix — Per-Framework Adaptation Guide

How to read this file: SKILL.md Step 1 detects the project's stack. Use the matching section here to decide exactly what to generate — file paths, package choices, session strategy, and ORM wiring. When a combination isn't listed, apply the closest analogue and note your assumption to the user.

---

## Table of Contents

1. [Detection Cheatsheet](#1-detection-cheatsheet)
2. [Backend: Express](#2-backend-express)
3. [Backend: Next.js (App Router)](#3-backend-nextjs-app-router)
4. [Backend: NestJS](#4-backend-nestjs)
5. [Backend: Fastify](#5-backend-fastify)
6. [Backend: Koa](#6-backend-koa)
7. [Backend: Other / Unknown](#7-backend-other--unknown)
8. [Session vs JWT Decision](#8-session-vs-jwt-decision)
9. [Frontend Components by Framework](#9-frontend-components-by-framework)
10. [File Layout Conventions](#10-file-layout-conventions)

---

## 1. Detection Cheatsheet

Run these checks to determine the stack before generating anything.

### Framework detection (check package.json `dependencies`)

| Signal | Framework |
|---|---|
| `"express"` | Express |
| `"next"` | Next.js |
| `"@nestjs/core"` | NestJS |
| `"fastify"` | Fastify |
| `"koa"` | Koa |
| `"hono"` | Hono (treat like Express) |
| `"h3"` or `"nitro"` | Nuxt/H3 (treat like Next.js App Router) |

### ORM detection

| Signal | ORM |
|---|---|
| `"@prisma/client"` in deps + `prisma/schema.prisma` exists | Prisma |
| `"typeorm"` in deps | TypeORM |
| `"mongoose"` in deps | Mongoose |
| `"drizzle-orm"` in deps | Drizzle |
| `"sequelize"` in deps | Sequelize |
| None of the above | No ORM (raw SQL or in-memory) |

### Session strategy detection

| Signal | Strategy |
|---|---|
| `"express-session"` in deps | express-session |
| `"iron-session"` in deps | iron-session |
| `"@fastify/session"` or `"fastify-session"` in deps | Fastify session plugin |
| `"jsonwebtoken"` or `"jose"` in deps (no session lib) | JWT |
| `"passport"` in deps | Passport.js (wrap around existing strategy) |
| `"next-auth"` or `"@auth/core"` in deps | Auth.js — do NOT replace, extend or note incompatibility |
| Nothing found | Choose based on framework default (see §8) |

### TypeScript detection

- `tsconfig.json` exists → TypeScript
- `"typescript"` in devDependencies → TypeScript
- Source files end in `.ts` → TypeScript
- Otherwise → JavaScript

### Existing auth detection

Look for any of:
- Files containing `password`, `bcrypt`, `hash` → local auth exists
- Files containing `passport`, `jwt.sign`, `session.user` → session/auth middleware exists
- `src/routes/auth.*`, `app/api/auth/`, `src/controllers/auth.*` → auth routes exist
- `User` model with `password` or `passwordHash` field → user model exists

---

## 2. Backend: Express

**Default session**: `express-session`
**Default auth file layout**: `src/auth/` + `src/routes/`

### File paths to generate

```
src/auth/sso.ts           ← SSO module
src/auth/password.ts      ← bcrypt helpers (Mode 1/3)
src/auth/middleware.ts     ← requireAuth
src/routes/auth.ts        ← auth routes
src/types/session.d.ts    ← express-session type augmentation
app.ts / index.ts         ← session middleware wiring (show as snippet, don't overwrite)
```

If the project uses `lib/` instead of `src/`, mirror that. Check by looking at where existing route files live.

### Session middleware

```ts
// Show this as a snippet to add to app.ts — don't overwrite the whole file
import session from 'express-session'
app.use(session({
  name: 'app.sid',
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
}))
```

**Production note**: express-session default store is in-memory. Tell the user to add `connect-redis` or `connect-pg-simple` before going to production.

### Session type augmentation

```ts
// src/types/session.d.ts
import 'express-session'
declare module 'express-session' {
  interface SessionData {
    user?: { ssoSubject?: string; username: string; displayName: string; email: string; avatarUrl: string }
    sso?: { state: string; codeVerifier: string; returnTo: string; createdAt: number }
    tokens?: { access_token: string; refresh_token?: string; expires_at: number }
  }
}
```

### Packages

| Scenario | Add |
|---|---|
| Any | `express-session @types/express-session` (if TS) |
| Local auth | `bcrypt @types/bcrypt` |
| Production session | `connect-redis` or `connect-pg-simple` |
| JWT alternative | `jsonwebtoken @types/jsonwebtoken` |

---

## 3. Backend: Next.js (App Router)

**Default session**: `iron-session` (encrypted cookie, no DB needed)
**Auth file layout**: `app/auth/*/route.ts` + `lib/` + `middleware.ts`

See `references/templates-nextjs.md` for complete code.

### File paths to generate

```
lib/session.ts              ← iron-session config + getSession()
lib/sso.ts                  ← SSO module (same logic as Express version)
lib/password.ts             ← bcrypt helpers (Mode 1/3)
lib/db.ts                   ← Prisma singleton (if Prisma)
app/auth/login/route.ts     ← GET handler
app/auth/callback/route.ts  ← GET handler
app/auth/logout/route.ts    ← POST + GET handlers
app/api/me/route.ts         ← GET handler
middleware.ts               ← route protection (at project root)
components/auth/            ← frontend components
```

### If project already uses Pages Router (`pages/` directory exists)

The project uses the old Pages Router, not App Router. Adapt:
- Routes go in `pages/api/auth/[...].ts` as `NextApiHandler` functions
- Use `req.session` from `iron-session/next` legacy API
- Tell the user the templates-nextjs.md targets App Router and show the Pages Router equivalent

### If `next-auth` / `@auth/core` is present

Do NOT generate a competing auth system. Instead tell the user: "Your project uses Auth.js (NextAuth). SSO providers can be added as an OAuth provider in your Auth.js config. Do you want me to add this as an Auth.js provider instead?"

### Packages

| Scenario | Add |
|---|---|
| Any | `iron-session` |
| Local auth | `bcrypt @types/bcrypt` |
| SSO | no extra packages needed (uses native fetch) |

---

## 4. Backend: NestJS

**Default session**: `express-session` via `@nestjs/platform-express`
**Auth file layout**: feature modules under `src/auth/`

### File paths to generate

```
src/auth/auth.module.ts       ← NestJS module
src/auth/auth.controller.ts   ← routes (@Controller, @Get, @Post)
src/auth/auth.service.ts      ← business logic (SSO calls, password verify)
src/auth/sso.ts               ← SSO helper functions (same logic)
src/auth/session.guard.ts     ← SessionGuard implementing CanActivate
src/auth/session.decorator.ts ← @CurrentUser() decorator
src/users/users.module.ts     ← if no users module exists yet
src/users/users.service.ts    ← findBySSO, findByEmail, upsert
src/users/user.entity.ts      ← TypeORM entity (or Prisma model patch)
```

Wire in `main.ts` (show as a snippet):
```ts
// Add to main.ts bootstrap():
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' },
}))
```

### Controller routes

```ts
@Controller('auth')
export class AuthController {
  @Get('login')   // SSO redirect
  @Get('callback') // SSO callback
  @Post('logout')
  @Get('/api/me') // or /profile — check existing convention
}
```

### Guard pattern (replaces requireAuth)

```ts
@Injectable()
export class SessionGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest()
    return !!req.session?.user
  }
}
// Usage: @UseGuards(SessionGuard) on protected routes
```

### Packages

| Scenario | Add |
|---|---|
| Any | `express-session @types/express-session` |
| Local auth | `bcrypt @types/bcrypt` |
| If using Passport | `@nestjs/passport passport passport-local` |

**Note**: If the project already uses `@nestjs/passport` with a local strategy, generate a new Strategy class for SSO callback rather than standalone routes — it fits the existing pattern better.

---

## 5. Backend: Fastify

**Default session**: `@fastify/session` + `@fastify/cookie`
**Auth file layout**: `src/routes/auth.ts` or plugins under `src/plugins/`

### Session setup

```ts
import fastifyCookie from '@fastify/cookie'
import fastifySession from '@fastify/session'

await app.register(fastifyCookie)
await app.register(fastifySession, {
  secret: process.env.SESSION_SECRET!,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
  saveUninitialized: false,
})
```

### Route handlers

Fastify uses `RouteHandler` with `FastifyRequest` / `FastifyReply` instead of `req/res/next`:

```ts
app.get('/auth/login', async (request, reply) => {
  // ... generate state, PKCE
  reply.redirect(buildAuthorizeUrl({ state, codeChallenge }))
})

app.get('/auth/callback', async (request, reply) => {
  const { code, state, error } = request.query as Record<string, string>
  // ...
})
```

### requireAuth (Fastify hook)

```ts
export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.session.user) {
    reply.status(401).send({ message: 'unauthorized' })
  }
}
// Usage: app.get('/api/me', { preHandler: requireAuth }, handler)
```

### Type augmentation

```ts
// Extend @fastify/session's SessionData
declare module '@fastify/session' {
  interface FastifySessionObject {
    user?: { ssoSubject?: string; username: string; displayName: string; email: string; avatarUrl: string }
    sso?: { state: string; codeVerifier: string; returnTo: string; createdAt: number }
  }
}
```

### Packages

| Scenario | Add |
|---|---|
| Any | `@fastify/cookie @fastify/session` |
| Local auth | `bcrypt @types/bcrypt` |

---

## 6. Backend: Koa

**Default session**: `koa-session`
**Auth file layout**: `src/routes/` or `src/controllers/`

### Session setup

```ts
import Koa from 'koa'
import session from 'koa-session'

const app = new Koa()
app.keys = [process.env.SESSION_SECRET!]
app.use(session({ key: 'app.sid', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }, app))
```

### Route handlers (koa-router)

```ts
import Router from '@koa/router'
const router = new Router()

router.get('/auth/login', async (ctx) => {
  // ctx.session.sso = { state, codeVerifier, returnTo }
  ctx.redirect(buildAuthorizeUrl({ state, codeChallenge }))
})

router.get('/auth/callback', async (ctx) => {
  const { code, state, error } = ctx.query
  // ...
})
```

### requireAuth (Koa middleware)

```ts
export async function requireAuth(ctx: Context, next: Next) {
  if (!ctx.session?.user) {
    ctx.status = 401
    ctx.body = { message: 'unauthorized' }
    return
  }
  await next()
}
```

### Packages

| Scenario | Add |
|---|---|
| Any | `koa-session @koa/router` |
| Local auth | `bcrypt @types/bcrypt` |
| TypeScript | `@types/koa @types/koa-session @types/koa__router` |

---

## 7. Backend: Other / Unknown

If the framework can't be detected:

1. Ask the user: "你的后端用的是哪个框架？（Express / Next.js / NestJS / Fastify / Koa / 其他）"
2. If they say something not on this list, generate a **framework-agnostic SSO module** (`sso.js` / `sso.ts`) with pure functions (no framework imports), and show pseudocode for the routes:

```
// Framework-agnostic SSO module — plug these into your framework's routing layer
// Functions: buildAuthorizeUrl, exchangeCodeForTokens, fetchUserInfo, safeReturnTo

// Route: GET /auth/login
//   1. state = randomBase64Url(24)
//   2. codeVerifier = randomBase64Url(32)
//   3. codeChallenge = createCodeChallenge(codeVerifier)
//   4. Save { state, codeVerifier, returnTo } to server-side session
//   5. Redirect to buildAuthorizeUrl({ state, codeChallenge })
```

This way the SSO logic is portable and the user can wire it themselves.

---

## 8. Session vs JWT Decision

### Use sessions (default) when:
- Server-side rendering (Next.js, Express + template engines)
- You want easy server-side revocation
- The project already uses sessions
- BFF pattern (frontend and backend are the same deployment)

### Use JWT when:
- The project already uses JWT (detected `jsonwebtoken` or `jose` in deps)
- Pure API backend serving a separate SPA/mobile app
- Stateless horizontal scaling is a hard requirement

### When JWT is chosen:
- Store the JWT in an `HttpOnly` cookie — NOT in `localStorage` / `sessionStorage`
- Short expiry (15 min) + refresh token in HttpOnly cookie
- Generate these helpers instead of session middleware:

```ts
// lib/jwt.ts
import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET!)

export const signToken = (payload: object) =>
  new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('15m')
    .sign(secret)

export const verifyToken = (token: string) =>
  jwtVerify(token, secret).then(r => r.payload)
```

### When Passport.js is already present:
- Don't add a parallel session system
- Add a new `passport.use(new CustomStrategy(...))` for SSO
- The SSO callback sets `req.user` via `req.logIn()` — same as existing strategies

---

## 9. Frontend Components by Framework

### React (JSX/TSX)

See SKILL.md "Frontend Components" section — React components are the primary examples.

```tsx
// LoginButton, LogoutButton, useCurrentUser — see SKILL.md
```

### Vue 3 (Composition API)

```vue
<!-- components/LoginButton.vue -->
<template>
  <button @click="handleLogin">登录</button>
</template>
<script setup lang="ts">
function handleLogin() {
  const returnTo = window.location.pathname + window.location.search
  window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
}
</script>
```

```vue
<!-- components/LogoutButton.vue -->
<template>
  <button @click="handleLogout">退出登录</button>
</template>
<script setup lang="ts">
async function handleLogout() {
  await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
  window.location.href = '/'
}
</script>
```

```ts
// composables/useCurrentUser.ts
import { ref, onMounted } from 'vue'
export function useCurrentUser() {
  const user = ref<CurrentUser | null>(null)
  const loading = ref(true)
  onMounted(async () => {
    try {
      const res = await fetch('/api/me', { credentials: 'include' })
      user.value = res.status === 401 ? null : await res.json()
    } finally {
      loading.value = false
    }
  })
  return { user, loading }
}
```

### Svelte / SvelteKit

For **SvelteKit**, the BFF pattern works differently — use server-side `load` functions and `hooks.server.ts`:

```ts
// src/hooks.server.ts
import type { Handle } from '@sveltejs/kit'
export const handle: Handle = async ({ event, resolve }) => {
  const session = // read from cookie
  event.locals.user = session?.user ?? null
  return resolve(event)
}
```

For standalone **Svelte** (no SvelteKit), generate vanilla JS components:

```svelte
<!-- LoginButton.svelte -->
<button on:click={handleLogin}>登录</button>
<script lang="ts">
  function handleLogin() {
    const returnTo = window.location.pathname + window.location.search
    window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
  }
</script>
```

### Angular

```ts
// auth.service.ts
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUser$ = new BehaviorSubject<CurrentUser | null>(null)

  loadCurrentUser() {
    return this.http.get<CurrentUser>('/api/me', { withCredentials: true }).pipe(
      tap(user => this.currentUser$.next(user)),
      catchError(() => { this.currentUser$.next(null); return of(null) })
    )
  }

  logout() {
    return this.http.post('/auth/logout', {}, { withCredentials: true }).pipe(
      tap(() => { this.currentUser$.next(null); window.location.href = '/' })
    )
  }
}
```

### No frontend framework (vanilla JS / server-rendered HTML)

```html
<!-- Just link to the routes directly -->
<a href="/auth/login">登录</a>
<form action="/auth/logout" method="POST">
  <button type="submit">退出登录</button>
</form>
```

---

## 10. File Layout Conventions

Before writing any file, check where the project's existing source files live. Common patterns:

| Project style | Source root | Route files | Model/schema files |
|---|---|---|---|
| Express conventional | `src/` | `src/routes/` | `src/models/` |
| Express flat | `/` (root) | `routes/` | `models/` |
| Next.js | `app/` or `src/app/` | `app/api/*/route.ts` | `lib/` or `prisma/` |
| NestJS | `src/` | `src/*/controller.ts` | `src/*/entity.ts` |
| Monorepo | `apps/api/src/` | varies | varies |

**Rule**: Find one existing route or model file, use its directory as the anchor for new files. Never create a new `src/` directory if the project uses a flat layout.
