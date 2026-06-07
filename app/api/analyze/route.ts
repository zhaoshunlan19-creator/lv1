import { NextRequest, NextResponse } from 'next/server'
import { chatWithUsage } from '@/lib/ai'
import { buildAnalyzePrompt, extractJson } from '@/lib/prompts'
import type { AnalyzeInput } from '@/lib/prompts'

export async function POST(req: NextRequest) {
  try {
    const input: AnalyzeInput = await req.json()

    if (!input.title?.trim() || !input.description?.trim()) {
      return NextResponse.json(
        { error: '请提供创意名称和描述' },
        { status: 400 }
      )
    }

    const prompt = buildAnalyzePrompt(input)

    const { reply, usage } = await chatWithUsage(prompt, {
      model: 'deepseek-chat',
      temperature: 0.7,
      maxTokens: 4000,
    })

    // 尝试提取 JSON
    try {
      const result = extractJson(reply)
      return NextResponse.json({
        ...result,
        _raw: reply, // 保留原始输出，用于调试
        _usage: usage,
      })
    } catch {
      // JSON 解析失败，返回原始文本
      return NextResponse.json({
        raw: reply,
        _usage: usage,
      })
    }
  } catch (error) {
    console.error('AI 分析失败:', error)
    const message = error instanceof Error ? error.message : '未知错误'
    return NextResponse.json(
      { error: `AI 分析失败: ${message}` },
      { status: 500 }
    )
  }
}
