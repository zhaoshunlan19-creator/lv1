# SSO Integration Spec

This is the authoritative reference for implementing SSO in this system. Follow it exactly.

## Endpoints

| Use | Method | URL |
|-----|--------|-----|
| Authorization | GET | `{SSO_ISSUER}/connect/authorize` |
| Token exchange | POST | `{SSO_ISSUER}/oauth/token` |
| User info | GET | `{SSO_ISSUER}/connect/userinfo` |

**Never use:** `/oauth/authorize` (old), `/oauth/me`, `/connect/consent`, `/connect/logout`, `/oauth2`

## Environment Variables

```env
SSO_ISSUER=https://account.youngala.com   # no trailing slash
SSO_CLIENT_ID=your-client-id
SSO_CLIENT_SECRET=your-client-secret      # confidential clients only; leave empty for public
SSO_REDIRECT_URI=https://app.example.com/auth/callback
SSO_SCOPES=openid profile email
APP_BASE_URL=https://app.example.com
SESSION_SECRET=random-long-secret
```

## Login Flow

```
GET /auth/login
  1. Generate random state (crypto.randomBytes(24).toString('base64url'))
  2. Generate random code_verifier (crypto.randomBytes(32).toString('base64url'))
  3. Compute code_challenge = base64url(SHA256(code_verifier))
  4. Save { state, code_verifier, returnTo } to server-side session (short TTL)
  5. 302 → {SSO_ISSUER}/connect/authorize?response_type=code
             &client_id=CLIENT_ID
             &redirect_uri=REDIRECT_URI
             &scope=openid+profile+email
             &state=STATE
             &code_challenge=CODE_CHALLENGE
             &code_challenge_method=S256
```

## Callback Flow

```
GET /auth/callback?code=CODE&state=STATE
  1. If query.error exists → show error, stop
  2. Validate query.state === session.sso.state → 400 if mismatch
  3. Delete session.sso immediately (one-time use)
  4. POST /oauth/token (see Token Exchange below)
  5. GET /connect/userinfo (see User Info below)
  6. Upsert local user by sub
  7. Set req.session.user
  8. Redirect to returnTo (or /)
```

## Token Exchange

```http
POST {SSO_ISSUER}/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code=AUTH_CODE
&redirect_uri=REDIRECT_URI
&client_id=CLIENT_ID
&code_verifier=CODE_VERIFIER
# confidential client only:
&client_secret=CLIENT_SECRET
```

Response:
```json
{
  "access_token": "eyJ...",
  "token_type": "Bearer",
  "expires_in": 86400,
  "refresh_token": "optional",
  "scope": "openid profile email"
}
```

## User Info

```http
GET {SSO_ISSUER}/connect/userinfo
Authorization: Bearer ACCESS_TOKEN
Accept: application/json
```

Response:
```json
{
  "sub": "user-stable-id",
  "name": "张三",
  "preferred_username": "zhangsan",
  "email": "zhangsan@example.com",
  "picture": "https://..."
}
```

Map to local user:
| Local field | Source |
|---|---|
| `ssoSubject` | `sub` — the stable unique ID; bind all permissions to this |
| `username` | `preferred_username` → `name` → `sub` |
| `displayName` | `name` → `preferred_username` |
| `email` | `email` |
| `avatarUrl` | `picture` |

## Token Refresh (Optional)

Only implement if the server receives a `refresh_token` in the token response. Don't assume it exists.

```http
POST {SSO_ISSUER}/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=refresh_token
&refresh_token=REFRESH_TOKEN
&client_id=CLIENT_ID
# confidential client only:
&client_secret=CLIENT_SECRET
```

## Error Handling

**Callback errors** (`?error=...`):
- `access_denied` — user refused; show message, offer re-login
- `login_required` — no active SSO session; clear temp SSO context, re-login
- `consent_required` — offer re-login
- Other — log server-side (without tokens), show generic error

**Token exchange errors:**
- `invalid_grant` — code expired/reused or code_verifier mismatch
- `invalid_client` — wrong client_id/secret or wrong client type
- `invalid_request` — redirect_uri mismatch
- On any failure: do NOT create session; do NOT log code/secret/tokens; redirect to login

**UserInfo errors:**
- 401 → try refresh; if no refresh token, destroy session and re-login
- 404 → account doesn't exist; destroy session
- Other → log (no tokens in log), show login failure

## Complete sso.js Reference Implementation

```js
// sso.js
const crypto = require('node:crypto')

function requiredEnv(name) {
  const v = process.env[name]
  if (!v) throw new Error(`missing_env_${name}`)
  return v
}

const config = {
  issuer: requiredEnv('SSO_ISSUER').replace(/\/+$/, ''),
  clientId: requiredEnv('SSO_CLIENT_ID'),
  clientSecret: process.env.SSO_CLIENT_SECRET || '',
  redirectUri: requiredEnv('SSO_REDIRECT_URI'),
  scopes: process.env.SSO_SCOPES || 'openid profile email',
}

function randomBase64Url(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url')
}

function createCodeChallenge(codeVerifier) {
  return crypto.createHash('sha256').update(codeVerifier).digest('base64url')
}

function buildAuthorizeUrl({ state, codeChallenge }) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })
  return `${config.issuer}/connect/authorize?${params}`
}

async function exchangeCodeForTokens({ code, codeVerifier }) {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: config.redirectUri,
    client_id: config.clientId,
    code_verifier: codeVerifier,
  })
  if (config.clientSecret) body.set('client_secret', config.clientSecret)

  const res = await fetch(`${config.issuer}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error_description || data.error || 'token_exchange_failed')
  return { ...data, expires_at: Date.now() + Math.max(0, Number(data.expires_in || 0)) * 1000 }
}

async function fetchUserInfo(accessToken) {
  const res = await fetch(`${config.issuer}/connect/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`userinfo_failed_${res.status}`)
  if (!data.sub) throw new Error('userinfo_missing_sub')
  return data
}

async function refreshAccessToken(refreshToken) {
  if (!refreshToken) throw new Error('missing_refresh_token')
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: config.clientId,
  })
  if (config.clientSecret) body.set('client_secret', config.clientSecret)

  const res = await fetch(`${config.issuer}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error_description || data.error || 'token_refresh_failed')
  return {
    ...data,
    refresh_token: data.refresh_token || refreshToken,
    expires_at: Date.now() + Math.max(0, Number(data.expires_in || 0)) * 1000,
  }
}

function safeReturnTo(value) {
  if (!value || typeof value !== 'string') return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ message: 'unauthorized' })
  next()
}

module.exports = {
  randomBase64Url, createCodeChallenge, buildAuthorizeUrl,
  exchangeCodeForTokens, fetchUserInfo, refreshAccessToken,
  safeReturnTo, requireAuth,
}
```

## Complete Express Route Reference

```js
// auth routes (app.js)
app.get('/auth/login', (req, res) => {
  const state = randomBase64Url(24)
  const codeVerifier = randomBase64Url(32)
  const codeChallenge = createCodeChallenge(codeVerifier)
  req.session.sso = { state, codeVerifier, returnTo: safeReturnTo(req.query.returnTo), createdAt: Date.now() }
  res.redirect(buildAuthorizeUrl({ state, codeChallenge }))
})

app.get('/auth/callback', async (req, res, next) => {
  try {
    if (req.query.error) return res.status(401).send(req.query.error_description || req.query.error)
    const sso = req.session.sso
    if (!sso || req.query.state !== sso.state) return res.status(400).send('invalid_state')
    const code = req.query.code
    if (!code || typeof code !== 'string') return res.status(400).send('missing_code')
    delete req.session.sso

    const tokens = await exchangeCodeForTokens({ code, codeVerifier: sso.codeVerifier })
    const userInfo = await fetchUserInfo(tokens.access_token)

    req.session.tokens = tokens
    req.session.user = {
      ssoSubject: userInfo.sub,
      username: userInfo.preferred_username || userInfo.name || userInfo.sub,
      displayName: userInfo.name || userInfo.preferred_username || userInfo.sub,
      email: userInfo.email || '',
      avatarUrl: userInfo.picture || '',
    }
    res.redirect(sso.returnTo || '/')
  } catch (err) { next(err) }
})

app.get('/api/me', requireAuth, (req, res) => res.json(req.session.user))

app.post('/auth/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('app.sid'); res.status(204).end() })
})

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => { res.clearCookie('app.sid'); res.redirect('/') })
})
```

## Security Checklist

- state: random, server-side, deleted after first use
- PKCE: always S256, never plain
- client_secret: env var only, never in frontend, never in logs
- returnTo: safeReturnTo() always — relative paths only
- cookie production: httpOnly + secure + sameSite=lax
- logout: local session destroy only — no /connect/logout call
- tokens: never in localStorage/sessionStorage
