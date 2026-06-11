import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUserById, saveUser } from '@/lib/users'
import { hashPassword } from '@/lib/password'

// GET /api/me — 返回当前登录用户，未登录返回 401
export async function GET() {
  const session = await getSession()
  if (!session.user) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
  }
  return NextResponse.json(session.user)
}

// PATCH /api/me — 更新当前用户个人信息
export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ message: 'unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const user = await getUserById(session.user.id)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (body.displayName?.trim()) {
      user.displayName = body.displayName.trim()
    }

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: '密码至少 8 位' }, { status: 400 })
      }
      user.passwordHash = await hashPassword(body.password)
    }

    user.updatedAt = Date.now()
    await saveUser(user)

    // 更新 session 中的 displayName
    session.user = { ...session.user, displayName: user.displayName }
    await session.save()

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json({ error: '更新失败' }, { status: 500 })
  }
}
