import { NextRequest, NextResponse } from 'next/server'
import { getIdea, saveIdea, deleteIdea } from '@/lib/storage'
import { getSession } from '@/lib/session'

// GET /api/ideas/[id] — 获取单个创意（公开）
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

// PUT /api/ideas/[id] — 更新创意（需要权限）
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const userId = session.user?.id
    const isAdmin = session.user?.role === 'admin'
    const { id } = await params
    const body = await req.json()
    const existing = await getIdea(id)

    if (!existing) {
      return NextResponse.json({ error: '创意不存在' }, { status: 404 })
    }

    // 有 userId 的创意，只有创建者或管理员能修改
    if (existing.userId && existing.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: '无权修改此创意' }, { status: 403 })
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

// DELETE /api/ideas/[id] — 删除创意（需要权限）
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    const userId = session.user?.id
    const isAdmin = session.user?.role === 'admin'
    const { id } = await params
    const existing = await getIdea(id)

    if (!existing) {
      return NextResponse.json({ error: '创意不存在' }, { status: 404 })
    }

    // 有 userId 的创意，只有创建者或管理员能删除
    if (existing.userId && existing.userId !== userId && !isAdmin) {
      return NextResponse.json({ error: '无权删除此创意' }, { status: 403 })
    }

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
