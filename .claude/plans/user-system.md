# 用户系统实现计划

## 背景与决策

**需求确认**
- 模式：基础用户系统（本地邮箱+密码）
- 角色：管理员 vs 普通用户（区分）
- 首页 `/`：保持开放，无需登录
- 后台 `/admin/**`：仅管理员可访问

**技术选型**
- Session：`iron-session`（加密 Cookie，延续无数据库风格）
- 密码哈希：`bcryptjs`（纯 JS 实现，避免 Windows 原生模块编译问题）
- 存储：`data/users.json`（延续项目 JSON 文件模式）
- 路由保护：`middleware.ts`（Next.js App Router 标准做法）

---

## 新增文件（13 个）

### 1. `lib/users.ts` — 用户存储层
延续 `storage.ts` 模式，操作 `data/users.json`。
包含：`getAllUsers`, `getUserByEmail`, `getUserById`, `saveUser`。

### 2. `lib/session.ts` — iron-session 配置
```ts
export type SessionUser = { id, email, displayName, role: 'admin' | 'user' }
export type AppSession = { user?: SessionUser }
export const sessionOptions = { password: process.env.SESSION_SECRET!, cookieName: 'ideaforge.sid', ... }
export async function getSession()
```

### 3. `lib/password.ts` — 密码哈希工具
```ts
export async function hashPassword(plain: string): Promise<string>
export async function verifyPassword(plain: string, hash: string): Promise<boolean>
```

### 4. `app/api/auth/register/route.ts` — 注册接口
`POST`：验证输入 → 检查邮箱唯一性 → 哈希密码 → 保存用户 → 建立 session  
首个注册用户自动成为 `admin`，后续用户角色为 `user`。

### 5. `app/api/auth/login/route.ts` — 登录接口
`POST`：查找用户 → 恒时密码比对 → 建立 session → 返回用户信息

### 6. `app/api/auth/logout/route.ts` — 登出接口
`POST`：销毁 session

### 7. `app/api/me/route.ts` — 当前用户接口
`GET`：返回 session 用户或 401

### 8. `middleware.ts`（项目根目录）
保护 `/admin/**` 路由：
- 无 session → 重定向到 `/login?returnTo=...`
- 有 session 但非 admin → 重定向到 `/` 并展示提示
- `/api/admin/**` 将来可用（当前 API 无需单独保护，已通过后台页面保护）

### 9. `app/login/page.tsx` — 登录页
- 邮箱 + 密码表单（使用 shadcn/ui Input + Button）
- 表单验证（与项目现有 useState 模式一致）
- 登录成功后跳转到 `returnTo` 参数指定路径或 `/admin`
- 底部链接"没有账号？注册"

### 10. `app/register/page.tsx` — 注册页
- 显示名 + 邮箱 + 密码 + 确认密码
- 仅在没有任何用户时可注册（初始化管理员），或后续注册普通用户
- 底部链接"已有账号？登录"

### 11. `components/auth/user-nav.tsx` — 用户状态导航组件（客户端）
展示当前登录用户信息 + 退出按钮，供 admin layout 使用。

### 12. `app/admin/users/page.tsx` — 用户管理页（仅管理员）
- 显示用户列表（邮箱、显示名、角色、注册时间）
- 支持修改用户角色（提升/降级）

### 13. `app/api/admin/users/route.ts` — 用户管理 API
`GET`：获取用户列表（脱敏，不含密码哈希）
`PATCH`：修改用户角色（`/api/admin/users/[id]/route.ts`）

---

## 修改文件（3 个）

### `lib/types.ts` — 添加 User 类型
```ts
export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  displayName: string
  passwordHash: string
  role: UserRole
  createdAt: number
  updatedAt: number
}
```

### `app/admin/layout.tsx` — 添加用户状态显示
- Sidebar 底部添加 `<UserNav />` 组件（显示当前用户 + 退出按钮）
- 添加"用户管理"导航项到 `NAV_ITEMS`

### `.env.example` — 添加 SESSION_SECRET
```env
SESSION_SECRET=replace-with-a-random-32-character-secret
```

---

## 数据结构

### `data/users.json`
```json
[
  {
    "id": "uuid",
    "email": "admin@example.com",
    "displayName": "管理员",
    "passwordHash": "$2b$12$...",
    "role": "admin",
    "createdAt": 1700000000000,
    "updatedAt": 1700000000000
  }
]
```

### Session 形状（存入加密 Cookie）
```ts
{
  user: {
    id: string,
    email: string,
    displayName: string,
    role: 'admin' | 'user'
  }
}
```

---

## 路由保护规则

| 路由 | 访问要求 |
|------|---------|
| `/` | 开放 |
| `/idea/[id]` | 开放 |
| `/login` | 开放（已登录则跳走） |
| `/register` | 开放 |
| `/admin/**` | 需要 `role === 'admin'` |
| `/api/admin/**` | 需要 `role === 'admin'`（通过 middleware） |

---

## 需要安装的包

```bash
pnpm add iron-session bcryptjs
pnpm add -D @types/bcryptjs
```

---

## 验收清单

```
□ pnpm add iron-session bcryptjs && pnpm add -D @types/bcryptjs
□ 在 .env.local 中配置 SESSION_SECRET（32位随机字符串）
□ 启动应用，访问 /register 注册第一个用户（自动成为 admin）
□ 访问 /admin → 应正常进入后台
□ 退出登录 → 访问 /admin → 应跳转到 /login?returnTo=/admin
□ 注册第二个用户（普通用户）→ 登录后访问 /admin → 应跳转到首页
□ /admin/users 可查看和修改用户角色
□ /api/me 返回当前用户信息
```
