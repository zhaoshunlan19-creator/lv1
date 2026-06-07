import { NextRequest, NextResponse } from 'next/server'
import { getIdea, saveIdea, deleteIdea } from '@/lib/storage'

// GET /api/ideas/[id] — 获取单个创意
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const idea = await getIdea(id)
    if (!idea) {
      return NextResponse.json({ error: '创意不存在' }, { status: 404 })
    }
    return NextResponse.json(idea)
  } catch (error) {
    console.error('获取创意失败:', error)
    return NextResponse.json(
      { error: '获取创意失败' },
      { status: 500 }
    )
  }
}

// PUT /api/ideas/[id] — 更新创意
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const existing = await getIdea(id)

    if (!existing) {
      return NextResponse.json({ error: '创意不存在' }, { status: 404 })
    }

    const updated = {
      ...existing,
      ...body,
      id: existing.id, // 防止篡改 ID
      updatedAt: Date.now(),
    }

    await saveIdea(updated)
    return NextResponse.json(updated)
  } catch (error) {
    console.error('更新创意失败:', error)
    return NextResponse.json(
      { error: '更新创意失败' },
      { status: 500 }
    )
  }
}

// DELETE /api/ideas/[id] — 删除创意
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteIdea(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除创意失败:', error)
    return NextResponse.json(
      { error: '删除创意失败' },
      { status: 500 }
    )
  }
}
