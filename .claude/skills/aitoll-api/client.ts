/**
 * AI API 客户端（基于 AITOLL 实现）
 *
 * 本客户端提供通用的 AI 功能接口，当前基于 AITOLL 服务实现。
 * 如需切换其他供应商（OpenAI、Claude API 等），只需修改底层实现，
 * 不影响上层调用代码。
 *
 * 使用方法：
 * 1. 复制此文件到项目的 lib/ 目录（可改名，如 ai.ts 或 llm.ts）
 * 2. 在 .env.local 中配置 AITOLL_API_KEY（或改为其他供应商的 KEY）
 * 3. 导入并使用函数
 *
 * @example
 * import { chat, generateImage } from '@/lib/ai'
 *
 * const reply = await chat("你好")
 * const image = await generateImage("一只猫")
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
const API_KEY_ENV = 'AITOLL_API_KEY' // 切换供应商时修改此处

// 默认模型（可根据供应商修改）
const DEFAULT_MODELS = {
  CHAT: 'deepseek-chat',              // 对话模型
  IMAGE: 'gemini-3-pro-image-preview', // 图像处理模型
  MULTIMODAL: 'gemini-3-pro-preview',  // 多模态模型
} as const

// ============================================
// 内部 API 调用（供应商相关实现）
// ============================================

/**
 * 调用底层 API（AITOLL 实现）
 * 切换供应商时修改此函数
 */
async function callAPI(request: {
  model: string
  messages: Message[]
  stream?: boolean
  temperature?: number
  max_tokens?: number
}): Promise<any> {
  const apiKey = process.env[API_KEY_ENV]

  if (!apiKey) {
    throw new Error(`${API_KEY_ENV} 未配置，请在 .env.local 中添加`)
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
    throw new Error(`API 调用失败: ${response.status} ${errorText}`)
  }

  return response.json()
}

// ============================================
// 公共 API 函数（供应商无关）
// ============================================

/**
 * 文本对话
 *
 * @example
 * // 简单对话
 * const reply = await chat("你好")
 *
 * // 指定模型
 * const reply = await chat("写一段代码", {
 *   model: 'claude-haiku-4.5'
 * })
 *
 * // 带系统提示词
 * const reply = await chat("帮我分析这段代码", {
 *   systemPrompt: "你是一个专业的代码审查员"
 * })
 *
 * // 多轮对话
 * const messages = [
 *   { role: 'user', content: '你好' },
 *   { role: 'assistant', content: '你好！' },
 *   { role: 'user', content: '介绍一下 React' }
 * ]
 * const reply = await chat(messages)
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

  // 构建消息列表
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

  // 调用 API
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
 * 生成图像
 *
 * @example
 * const imageBase64 = await generateImage("一只可爱的猫咪")
 *
 * // 保存图片
 * const link = document.createElement('a')
 * link.href = imageBase64
 * link.download = 'cat.jpg'
 * link.click()
 */
export async function generateImage(
  prompt: string,
  options: ImageOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODELS.IMAGE } = options

  const response = await callAPI({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
    stream: false,
  })

  const content = response.choices[0]?.message?.content

  if (Array.isArray(content)) {
    const imageContent = content.find((item) => item.type === 'image_url')
    if (imageContent && 'image_url' in imageContent) {
      return imageContent.image_url.url
    }
  }

  throw new Error('未返回图像数据')
}

/**
 * 编辑图像
 *
 * @example
 * const editedImage = await editImage(
 *   "将背景改为蓝色",
 *   originalImageBase64
 * )
 */
export async function editImage(
  prompt: string,
  imageBase64: string,
  options: ImageOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODELS.IMAGE } = options

  // 确保 Base64 格式正确
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`

  const response = await callAPI({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    stream: false,
  })

  const content = response.choices[0]?.message?.content

  if (Array.isArray(content)) {
    const imageContent = content.find((item) => item.type === 'image_url')
    if (imageContent && 'image_url' in imageContent) {
      return imageContent.image_url.url
    }
  }

  throw new Error('未返回图像数据')
}

/**
 * 理解/描述图像
 *
 * @example
 * const description = await understandImage(
 *   imageBase64,
 *   "请描述这张图片的内容"
 * )
 *
 * // OCR 识别
 * const text = await understandImage(
 *   imageBase64,
 *   "提取图片中的所有文字"
 * )
 */
export async function understandImage(
  imageBase64: string,
  question: string = '请描述这张图片的内容',
  options: ImageOptions = {}
): Promise<string> {
  const { model = DEFAULT_MODELS.MULTIMODAL } = options

  // 确保 Base64 格式正确
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`

  const response = await callAPI({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: question,
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
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

// ============================================
// 工具函数
// ============================================

/**
 * 检查 API Key 是否已配置
 */
export function isConfigured(): boolean {
  return !!process.env[API_KEY_ENV]
}

/**
 * 将文件转换为 Base64
 * 仅在浏览器环境使用
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('文件读取失败'))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * 下载 Base64 图片
 * 仅在浏览器环境使用
 */
export function downloadImage(base64: string, filename: string = 'image.jpg') {
  const link = document.createElement('a')
  link.href = base64
  link.download = filename
  link.click()
}

// ============================================
// 供应商切换指南
// ============================================

/*
如何切换到其他供应商：

1. 修改配置：
   - API_BASE_URL：改为新供应商的 API 地址
   - API_KEY_ENV：改为新的环境变量名
   - DEFAULT_MODELS：改为新供应商的模型名称

2. 修改 callAPI 函数：
   - 调整请求格式（如果新供应商不兼容 OpenAI 格式）
   - 调整响应解析逻辑

3. 更新 .env.local：
   - 添加新供应商的 API Key

示例：切换到 OpenAI

const API_BASE_URL = 'https://api.openai.com/v1/chat/completions'
const API_KEY_ENV = 'OPENAI_API_KEY'

const DEFAULT_MODELS = {
  CHAT: 'gpt-4',
  IMAGE: 'dall-e-3',
  MULTIMODAL: 'gpt-4-vision-preview',
}

上层调用代码（chat(), generateImage() 等）无需修改！
*/
