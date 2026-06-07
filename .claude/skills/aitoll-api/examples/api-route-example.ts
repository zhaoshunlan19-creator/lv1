/**
 * Next.js API 路由示例
 *
 * 提供三个 API 端点：
 * 1. POST /api/ai/chat - 文本对话
 * 2. POST /api/ai/image-gen - 图像生成
 * 3. POST /api/ai/image-understand - 图像理解
 *
 * 使用方法：
 * 1. 将对应的代码复制到 app/api/ai/[功能名]/route.ts
 * 2. 确保 lib/ai.ts 文件存在（从 .claude/skills/aitoll/client.ts 复制）
 * 3. 在 .env.local 配置 AITOLL_API_KEY（或其他供应商的 KEY）
 */

// ============================================
// 对话 API
// 文件位置：app/api/ai/chat/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

export const runtime = 'edge' // 可选，使用 Edge Runtime

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history, model } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: '无效的消息格式' },
        { status: 400 }
      )
    }

    // 构建消息历史（可选）
    let messages
    if (history && Array.isArray(history)) {
      messages = [...history, { role: 'user', content: message }]
    } else {
      messages = message
    }

    // 调用 AI API
    const reply = await chat(messages, {
      model: model || 'deepseek-chat',
      systemPrompt: '你是一个有帮助的AI助手', // 可自定义
    })

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '服务器错误',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 图像生成 API
// 文件位置：app/api/ai/image-gen/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, model } = body

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: '请提供图像描述' },
        { status: 400 }
      )
    }

    // 调用 AI API
    const image = await generateImage(prompt, {
      model: model || 'gemini-3-pro-image-preview',
    })

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '图像生成失败',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 图像理解 API
// 文件位置：app/api/ai/image-understand/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { understandImage } from '@/lib/ai'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image, question, model } = body

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '请上传图片' },
        { status: 400 }
      )
    }

    // 调用 AI API
    const description = await understandImage(
      image,
      question || '请描述这张图片的内容',
      { model: model || 'gemini-3-pro-preview' }
    )

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Image understanding error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : '图像理解失败',
      },
      { status: 500 }
    )
  }
}

// ============================================
// 带重试机制的对话 API（进阶）
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
  throw new Error('Max retries exceeded')
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // 带重试的 API 调用
    const reply = await withRetry(() =>
      chat(message, { model: 'deepseek-chat' })
    )

    return NextResponse.json({ reply })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}

// ============================================
// 流式响应（高级功能，需要 AITOLL 支持）
// ============================================

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 注意：此处仅为示例，实际需要 AITOLL API 支持流式输出
          // 如果 AITOLL 支持，可以参考 OpenAI 的流式调用方式

          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    )
  }
}
