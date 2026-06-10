import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { verifyPassword, DUMMY_HASH } from '@/lib/password'
import { getUserByEmail } from '@/lib/users'

// POST /api/auth/login — 邮箱密码登录
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body.email ?? '').trim().toLowerCase()
    const password = String(body.password ?? '')

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 })
    }

    const user = await getUserByEmail(email)

    // 恒时比对：邮箱不存在时也执行一次哈希校验，避免通过响应时间枚举账号
    const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH)

    if (!user || !ok) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
    }

    const session = await getSession()
    session.user = { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
    await session.save()

    return NextResponse.json({ id: user.id, email: user.email, displayName: user.displayName, role: user.role })
  } catch (error) {
    console.error('登录失败:', error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
