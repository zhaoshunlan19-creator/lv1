/**
 * iron-session 配置
 * 使用加密 Cookie 存储会话，无需数据库
 */

import { getIronSession, type SessionOptions } from 'iron-session'
import { cookies } from 'next/headers'
import type { UserRole } from './types'

export type SessionUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
}

export type AppSession = {
  user?: SessionUser
}

// 开发环境下若未配置 SESSION_SECRET，用固定占位值兜底（仅本地可用）
const SESSION_PASSWORD =
  process.env.SESSION_SECRET ||
  'dev-only-insecure-session-secret-change-me-32'

export const sessionOptions: SessionOptions = {
  password: SESSION_PASSWORD,
  cookieName: 'ideaforge.sid',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  },
}

/**
 * 在 Route Handler / Server Component 中获取会话
 */
export async function getSession() {
  return getIronSession<AppSession>(await cookies(), sessionOptions)
}
