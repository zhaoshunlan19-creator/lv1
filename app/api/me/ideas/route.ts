import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getIdeasByUserId } from '@/lib/storage'

// GET /api/me/ideas — 获取当前用户的创意列表
export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const ideas = await getIdeasByUserId(session.user.id)
    return NextResponse.json(ideas)
  } catch (error) {
    console.error('获取用户创意列表失败:', error)
    return NextResponse.json(
      { error: '获取创意列表失败' },
      { status: 500 }
    )
  }
}
