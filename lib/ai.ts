/**
 * AI API 客户端（基于 AITOLL 实现）
 *
 * 本客户端提供通用的 AI 功能接口，当前基于 AITOLL 服务实现。
 * 如需切换其他供应商（OpenAI、Claude API 等），只需修改底层实现，
 * 不影响上层调用代码。
 *
 * 使用方法：
 * 1. 在 .env.local 中配置 AITOLL_API_KEY
 * 2. 导入并使用函数
 *
 * @example
 * import { chat } from '@/lib/ai'
 *
 * const reply = await chat("你好")
 */

// ============================================
// 类型定义
// ============================================

export type MessageRole = 'user' | 'assistant' | 'system'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ImageContent {
  type: 'image_url'
  image_url: {
    url: string
  }
}

export type MultimodalContent = TextContent | ImageContent

export interface Message {
  role: MessageRole
  content: string | MultimodalContent[]
}

export interface ChatOptions {
  model?: string
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface ImageOptions {
  model?: string
}

export interface ChatResponse {
  reply: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// ============================================
// 配置（可根据供应商修改）
// ============================================

// AITOLL 配置
const API_BASE_URL = 'https://aitoll.net/api/gateway/api/chat/completions'

// 默认模型（可根据供应商修改）
const DEFAULT_MODELS = {
  CHAT: 'deepseek-chat',
  IMAGE: 'gemini-3-pro-image-preview',
  MULTIMODAL: 'gemini-3-pro-preview',
} as const

// ============================================
// 内部 API 调用（供应商相关实现）
// ============================================

/**
 * 调用底层 API（AITOLL 实现）
 */
async function callAPI(request: {
  model: string
  messages: Message[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}): Promise<any> {
  // 动态 import 避免在客户端 bundle 中引入 fs
  const { getApiKey } = await import('./settings')
  const apiKey = await getApiKey('AITOLL_API_KEY')

  if (!apiKey) {
    throw new Error('AITOLL_API_KEY 未配置，请在设置页或 .env.local 中添加')
  }

  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[AITOLL] API 请求失败:', {
      status: response.status,
      url: API_BASE_URL,
      model: request.model,
      authHeader: `Bearer ${apiKey.slice(0, 10)}...`,
      error: errorText,
    })
    throw new Error(`API 调用失败: ${response.status} ${errorText}`)
  }

  return response.json()
}

// ============================================
// 公共 API 函数（供应商无关）
// ============================================

/**
 * 文本对话
 */
export async function chat(
  input: string | Message[],
  options: ChatOptions = {}
): Promise<string> {
  const {
    model = DEFAULT_MODELS.CHAT,
    systemPrompt,
    temperature,
    maxTokens,
  } = options

  let messages: Message[]

  if (typeof input === 'string') {
    messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: input })
  } else {
    messages = input
  }

  const response = await callAPI({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  })

  return response.choices[0]?.message?.content as string || ''
}

/**
 * 带使用统计的对话（用于成本控制）
 */
export async function chatWithUsage(
  input: string | Message[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  const {
    model = DEFAULT_MODELS.CHAT,
    systemPrompt,
    temperature,
    maxTokens,
  } = options

  let messages: Message[]

  if (typeof input === 'string') {
    messages = []
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt })
    }
    messages.push({ role: 'user', content: input })
  } else {
    messages = input
  }

  const response = await callAPI({
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
    stream: false,
  })

  return {
    reply: response.choices[0]?.message?.content as string || '',
    usage: response.usage,
  }
}

/**
 * 检查 API Key 是否已配置（优先 settings，回退 env）
 */
export async function isConfigured(): Promise<boolean> {
  const { getApiKey } = await import('./settings')
  return !!(await getApiKey('AITOLL_API_KEY'))
}
