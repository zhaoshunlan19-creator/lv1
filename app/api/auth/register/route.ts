import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { hashPassword } from '@/lib/password'
import { getUserByEmail, saveUser, countUsers } from '@/lib/users'
import type { User } from '@/lib/types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// POST /api/auth/register — 注册并自动登录
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const displayName = String(body.displayName ?? '').trim()
    const password = String(body.password ?? '')

    if (!email || !displayName || !password) {
      return NextResponse.json({ error: '请填写所有必填字段' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要 8 位' }, { status: 400 })
    }

    const existing = await getUserByEmail(email)
    if (existing) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 })
    }

    // 第一个注册的用户自动成为管理员
    const isFirstUser = (await countUsers()) === 0

    const now = Date.now()
    const user: User = {
      id: crypto.randomUUID(),
      email,
      displayName,
      passwordHash: await hashPassword(password),
      role: isFirstUser ? 'admin' : 'user',
      createdAt: now,
      updatedAt: now,
    }
    await saveUser(user)

    const session = await getSession()
    session.user = { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    await session.save()

    return NextResponse.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role })
  } catch (error) {
    console.error('注册失败:', error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
