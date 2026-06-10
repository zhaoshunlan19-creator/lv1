import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getUserById, saveUser } from '@/lib/users'
import type { UserRole } from '@/lib/types'

// PATCH /api/admin/users/[id] — 修改用户角色
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    const { id } = await params
    const body = await req.json()
    const role = body.role as UserRole

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json({ error: '无效的角色值' }, { status: 400 })
    }

    // 不允许修改自己的角色（防止意外取消自己的管理员权限）
    if (session.user?.id === id) {
      return NextResponse.json({ error: '不能修改自己的角色' }, { status: 400 })
    }

    const user = await getUserById(id)
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    user.role = role
    user.updatedAt = Date.now()
    await saveUser(user)

    const { passwordHash: _pw, ...safe } = user
    return NextResponse.json(safe)
  } catch (error) {
    console.error('修改角色失败:', error)
    return NextResponse.json({ error: '修改角色失败' }, { status: 500 })
  }
}
