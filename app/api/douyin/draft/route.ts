import { NextRequest, NextResponse } from 'next/server'
import { chatWithUsage } from '@/lib/ai'
import { buildDouyinIdeaPrompt, extractJson } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { title, description } = body

  if (!title || typeof title !== 'string') {
    return NextResponse.json({ error: '缺少视频标题' }, { status: 400 })
  }

  try {
    const prompt = buildDouyinIdeaPrompt({ title, description: description || '' })
    const { reply } = await chatWithUsage(prompt, {
      temperature: 0.7,
      maxTokens: 1000,
    })

    const draft = extractJson(reply) as {
      title?: string
      description?: string
      targetUser?: string
    }

    return NextResponse.json({
      title: draft.title || '',
      description: draft.description || '',
      targetUser: draft.targetUser || '',
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'AI 生成草稿失败' },
      { status: 500 },
    )
  }
}
