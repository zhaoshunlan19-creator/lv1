import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getFollowedIdeaIds, followIdea, unfollowIdea } from '@/lib/follows'
import { getAllIdeas } from '@/lib/storage'

// GET /api/me/follows — 获取当前用户关注的创意列表
export async function GET() {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const ideaIds = await getFollowedIdeaIds(session.user.id)
    if (ideaIds.length === 0) {
      return NextResponse.json([])
    }

    const allIdeas = await getAllIdeas()
    const ideas = ideaIds
      .map((id) => allIdeas.find((i) => i.id === id))
      .filter(Boolean)

    return NextResponse.json(ideas)
  } catch (error) {
    console.error('获取关注列表失败:', error)
    return NextResponse.json({ error: '获取关注列表失败' }, { status: 500 })
  }
}

// POST /api/me/follows — 关注一个创意
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

    await followIdea(session.user.id, ideaId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('关注创意失败:', error)
    return NextResponse.json({ error: '关注失败' }, { status: 500 })
  }
}

// DELETE /api/me/follows — 取消关注一个创意
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session.user) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const ideaId = searchParams.get('ideaId')
    if (!ideaId) {
      return NextResponse.json({ error: '缺少 ideaId' }, { status: 400 })
    }

    await unfollowIdea(session.user.id, ideaId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('取消关注失败:', error)
    return NextResponse.json({ error: '取消关注失败' }, { status: 500 })
  }
}
