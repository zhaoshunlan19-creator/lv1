import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getHistory, addHistory } from '@/lib/history'
import { getAllIdeas } from '@/lib/storage'

// GET /api/me/history — 获取当前用户的浏览历史
export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const history = await getHistory(session.user.id)
    if (history.length === 0) {
      return NextResponse.json([])
    }

    const allIdeas = await getAllIdeas()
    const result = history.map((h) => {
      const idea = allIdeas.find((i) => i.id === h.ideaId)
      return { ideaId: h.ideaId, viewedAt: h.viewedAt, idea }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('获取浏览历史失败:', error)
    return NextResponse.json({ error: '获取浏览历史失败' }, { status: 500 })
  }
}

// POST /api/me/history — 记录一次浏览
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { ideaId } = await req.json()
    if (!ideaId) {
      return NextResponse.json({ error: '缺少 ideaId' }, { status: 400 })
    }

    await addHistory(session.user.id, ideaId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('记录浏览历史失败:', error)
    return NextResponse.json({ error: '记录失败' }, { status: 500 })
  }
}
