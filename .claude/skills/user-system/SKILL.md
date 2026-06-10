---
name: user-system
description: "Scaffold a complete user system for web applications — local auth, SSO, or both. Use this skill whenever the user wants to add login or registration to their app, integrate SSO, set up authentication, build a user account system, or protect routes behind a login wall. Trigger on phrases like: 帮我搭建用户系统, 我想做用户登录, 接入 SSO, add auth to my app, I need a login system, set up user accounts, add SSO login, my app needs authentication, integrate single sign-on, 用户注册登录, protect my routes. Also trigger when the user already has a user system and wants to bolt on SSO, or says they need to link accounts to a corporate identity provider."
---

# User System Skill

You scaffold a working authentication skeleton for web applications. You support four modes that cover the full spectrum from a fresh local auth setup to surgically adding SSO onto an existing system.

## Step 1: Read the Project First

Before asking anything, explore the project to understand its stack. Read `references/stack-matrix.md` §1 for the full detection cheatsheet. Quick summary of what to look for:

```
package.json          → framework, ORM, session lib, language (TS vs JS)
tsconfig.json         → TypeScript?
src/routes/ or app/   → existing auth routes? existing file layout?
src/models/ or prisma/schema.prisma → existing user model?
.env or .env.example  → SSO vars or JWT_SECRET already configured?
```

Determine these four things — you'll need them in Step 3:

- **framework**: `express` | `nextjs` | `nestjs` | `fastify` | `koa` | `other`
- **orm**: `prisma` | `typeorm` | `mongoose` | `drizzle` | `sequelize` | `none`
- **language**: `typescript` | `javascript`
- **session_strategy**: `express-session` | `iron-session` | `fastify-session` | `jwt` | `passport` | `unknown`
- **has_existing_auth**: `true` if you find password fields, session middleware, or login routes
- **source_root**: the directory where existing route/controller files live (e.g. `src/routes/`, `app/api/`)

## Step 2: Ask One Question to Choose Mode

Present these options, pre-selecting the most likely based on what you found:

> 你想要哪种用户系统？
>
> **1. 基础用户系统** — 本地邮箱+密码注册登录，无 SSO（适合全新项目）
> **2. 仅 SSO 登录** — 所有登录走 SSO，不维护本地密码（适合企业内部工具）
> **3. 用户系统 + SSO** — 邮箱密码 + SSO 双通道，用户可任选（最灵活）
> **4. 在现有用户系统上集成 SSO** — 追加 SSO 登录，不动已有认证逻辑（适合已有系统）

If the framework wasn't detected, add one follow-up: "后端用的是 Express / Next.js / 其他？"

If the user is asking about SSO specifically, also ask: "是否已经从 SSO 管理员那里拿到了 client_id 等配置？（有的话告诉我，没有的话我会生成带占位符的配置）"

## Step 3: Generate the Skeleton

**Before writing any file**, read the relevant section of `references/stack-matrix.md` for your detected framework. It tells you:
- Exact file paths to use (matching the project's existing layout)
- Which session library and how to configure it
- How to adapt `requireAuth` to the framework's middleware pattern
- Which packages to install

Generate TypeScript if `tsconfig.json` exists or `.ts` files are found, JavaScript otherwise.

**File layout rule**: find one existing route or model file in the project, use its directory as the anchor for new files. Never create a `src/` tree if the project uses a flat layout.

---

### All Modes: `.env.example`

Always create or update `.env.example`. Never overwrite existing vars — append only.

**Local auth vars:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
SESSION_SECRET=replace-with-random-32-char-secret
# or if using JWT:
JWT_SECRET=replace-with-random-32-char-secret
```

**SSO vars (modes 2, 3, 4):**
```env
SSO_ISSUER=https://account.youngala.com
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret
SSO_REDIRECT_URI=http://localhost:3000/auth/callback
SSO_SCOPES=openid profile email
APP_BASE_URL=http://localhost:3000
SESSION_SECRET=replace-with-random-32-char-secret
```

---

### Mode 1: Basic User System

Read `references/stack-matrix.md` §2–6 for your framework's file paths and session wiring. The logic below is framework-agnostic; adapt the syntax to match.

**Core files to generate** (paths from stack-matrix):
- Password helpers — `hashPassword` / `verifyPassword` using bcrypt (12 rounds)
- `requireAuth` middleware/guard/hook in the framework's style
- Auth routes: `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /api/me`
- Session middleware wiring (show as a snippet to add, don't overwrite existing app entry)

**Register**: validate input → check email uniqueness → hash password → create user → start session
**Login**: find user by email → verify password (constant-time, dummy compare if email not found) → start session
**Logout**: destroy session
**Me**: return session user or 401

**Session shape** (store this, never include passwordHash):
```ts
session.user = { id, email, displayName, avatarUrl }
```

Include the user model for the detected ORM (see "User Models" section below).

For Next.js: also read `references/templates-nextjs.md`.

---

### Mode 2: SSO Only

**Read `references/sso-spec.md` before writing any SSO code.** The spec defines exact endpoints, PKCE flow, security rules, and reference implementations. Following it is non-negotiable.

**Also read `references/stack-matrix.md`** for your framework's file paths and session wiring.

Generate (paths adapted to the detected framework/layout):
- SSO module — `buildAuthorizeUrl`, `exchangeCodeForTokens`, `fetchUserInfo`, `refreshAccessToken`, `safeReturnTo`
- Auth routes — `GET /auth/login`, `GET /auth/callback`, `POST+GET /auth/logout`, `GET /api/me`
- `requireAuth` middleware/guard/hook in the framework's style
- User model with `ssoSubject` (no password field — see "User Models" below)

---

### Mode 3: User System + SSO

Read `references/sso-spec.md` and `references/stack-matrix.md` before writing any code.

Combine both auth paths. Key design points:
- `passwordHash` is nullable — SSO-only users have no password
- `ssoSubject` is nullable and unique — local-only users have no SSO link
- Both login paths create the **same local session shape**
- During SSO callback: first look up user by `ssoSubject`, then try email match to link an existing local account, then create new user
- Expose `/auth/login` (local form) and `/auth/sso/login` (SSO redirect) as separate entry points

---

### Mode 4: Add SSO to Existing System

Read `references/sso-spec.md` and `references/stack-matrix.md` before writing any code.

**Surgical additions only. Do not touch existing auth code.**

Steps:
1. Read the existing session shape (what does `session.user` / `req.user` look like?) — the SSO callback must write the **same shape**
2. Add `ssoSubject` column to existing user model (generate migration if Prisma/TypeORM; use `sparse: true` for Mongoose)
3. Create the SSO module in the project's existing lib/auth directory
4. Add SSO routes under **`/auth/sso/`** prefix to avoid collisions with existing routes
5. During SSO callback: find user by `sub` → find by email → create new → set `ssoSubject`; then write `session.user` in the same shape as the existing system
6. Append SSO env vars to `.env.example` — do not overwrite existing vars

Explicitly list which files are **new** and which are **modified** (additive only).

---

## User Models by ORM

Generate only the fields relevant to the chosen mode.

### Prisma (`prisma/schema.prisma`)
```prisma
model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String?   // Mode 1 and 3 only
  ssoSubject   String?   @unique  // Mode 2, 3, 4 only
  username     String?
  displayName  String?
  avatarUrl    String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
}
```

### Mongoose
```ts
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,                                    // Mode 1/3
  ssoSubject: { type: String, unique: true, sparse: true }, // Mode 2/3/4
  displayName: String,
  avatarUrl: String,
}, { timestamps: true })
```

### Drizzle (PostgreSQL)
```ts
export const users = pgTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),       // Mode 1/3
  ssoSubject: text('sso_subject').unique(),  // Mode 2/3/4
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

For TypeORM: generate an `@Entity()` class with equivalent `@Column({ nullable: true })` fields.

---

## Frontend Components

If the project has a frontend, generate auth components. **Read `references/stack-matrix.md` §9** for the correct component style:

- **React** — `.tsx` components + `useCurrentUser` hook (see SKILL.md examples below)
- **Vue 3** — `.vue` SFCs with Composition API
- **Svelte** — `.svelte` components or SvelteKit hooks
- **Angular** — `AuthService` with `HttpClient`
- **Vanilla JS / server-rendered** — plain `<a>` links and `<form>` submits

React examples (default — adapt syntax for other frameworks):

**`LoginButton`**

**`LoginButton.tsx`**
```tsx
export function LoginButton() {
  const handleLogin = () => {
    const returnTo = `${window.location.pathname}${window.location.search}`
    window.location.href = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`
  }
  return <button onClick={handleLogin}>登录</button>
}
```

**`LogoutButton.tsx`**
```tsx
export function LogoutButton() {
  const handleLogout = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/'
  }
  return <button onClick={handleLogout}>退出登录</button>
}
```

**`useCurrentUser.ts`**
```ts
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.status === 401 ? null : r.json())
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])
  return { user, loading }
}
```

---

## Security Rules (Apply to All SSO Code)

These are load-bearing constraints — break them and the integration fails or creates vulnerabilities:

- `client_secret` only in server env vars — never in frontend code, logs, or responses
- PKCE always on (`code_challenge_method=S256`) — even for confidential clients
- `state` is random, stored server-side, deleted immediately after first use
- `returnTo` accepts only relative paths (`/` prefix, no `//` prefix, no external URLs)
- Session cookies: `httpOnly: true`, `sameSite: 'lax'`, `secure: true` in production
- Logout clears local session only — DO NOT call `/connect/logout` (doesn't exist)
- Authorization: use `/connect/authorize` NOT `/oauth/authorize`
- Token exchange: use `/oauth/token`
- User info: use `/connect/userinfo`

---

## Packages to Install

After generating, tell the user which packages to install. Base packages come from `references/stack-matrix.md` for their specific framework. General rules:

| Scenario | Packages |
|---|---|
| Local auth (Express) | `express-session bcrypt @types/express-session @types/bcrypt` |
| Local auth (Next.js) | `iron-session bcrypt @types/bcrypt` |
| Local auth (Fastify) | `@fastify/cookie @fastify/session bcrypt @types/bcrypt` |
| SSO (Express) | `express-session @types/express-session` |
| SSO (Next.js) | `iron-session` |
| SSO (Fastify) | `@fastify/cookie @fastify/session` |
| JWT alternative | `jose` (preferred) or `jsonwebtoken @types/jsonwebtoken` |
| Production session store | `connect-redis` or `connect-pg-simple` (Express only) |

---

## Verification Checklist

End every generation with this checklist (adapt to what was actually generated):

```
验收清单：
□ npm install [packages]
□ 填写 .env 中的配置值（替换占位符）
□ 运行数据库迁移（prisma migrate dev / typeorm migration:run）
□ 启动应用，访问受保护路由 → 应跳转到 /auth/login
□ 完成完整登录流程 → /api/me 返回用户信息
□ 调用 /auth/logout → /api/me 返回 401
□ 生产部署前：SESSION_SECRET 换成随机强密钥
□ 生产部署前：确认 cookie.secure = true（HTTPS 环境）
□ 生产部署前：SESSION_SECRET 不进 git
```

---

## References

- **`references/stack-matrix.md`** — Per-framework adaptation guide. Read §1 during detection, then the matching framework section (§2–6) before generating files. Covers Express, Next.js, NestJS, Fastify, Koa, Vue/Svelte/Angular frontend components, session vs JWT decision, and file layout conventions.
- **`references/sso-spec.md`** — Full SSO integration spec with complete working code. Read before generating any SSO route or module.
- **`references/templates-nextjs.md`** — Next.js App Router patterns: route handlers, `middleware.ts`, iron-session setup, server component auth check.
