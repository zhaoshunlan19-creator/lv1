import { NextRequest, NextResponse } from 'next/server'
import { getAllIdeas, saveIdea } from '@/lib/storage'
import { getSession } from '@/lib/session'
import type { Idea } from '@/lib/types'

// GET /api/ideas — 获取所有创意（公开，广场展示用）
export async function GET() {
  try {
    const ideas = await getAllIdeas()
    return NextResponse.json(ideas)
  } catch (error) {
    console.error('获取创意列表失败:', error)
    return NextResponse.json(
      { error: '获取创意列表失败' },
      { status: 500 }
    )
  }
}

// POST /api/ideas — 创建创意（仅管理员）
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()

    // 仅管理员可创建创意
    if (!session.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: '无权创建创意' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { title, description, targetUser, source } = body

    if (!title?.trim() || !description?.trim() || !targetUser?.trim()) {
      return NextResponse.json(
        { error: '请填写所有必填字段' },
        { status: 400 }
      )
    }

    const idea: Idea = {
      id: crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      targetUser: targetUser.trim(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      userId: session.user.id,
      ...(source ? { source } : {}),
    }

    await saveIdea(idea)
    return NextResponse.json(idea)
  } catch (error) {
    console.error('创建创意失败:', error)
    return NextResponse.json(
      { error: '创建创意失败' },
      { status: 500 }
    )
  }
}
