import { NextResponse } from 'next/server'
import { getAllUsers } from '@/lib/users'

// GET /api/admin/users — 获取用户列表（脱敏，不含密码哈希）
export async function GET() {
  try {
    const users = await getAllUsers()
    const safe = users.map(({ passwordHash: _pw, ...u }) => u)
    return NextResponse.json(safe)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    return NextResponse.json({ error: '获取用户列表失败' }, { status: 500 })
  }
}
