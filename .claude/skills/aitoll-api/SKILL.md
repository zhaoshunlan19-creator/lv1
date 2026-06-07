---
name: aitoll-api
description: AITOLL API 接入工具库。提供对话、图像生成、图像编辑、图像理解等功能的客户端代码和使用示例。
---

# AITOLL API 接入指南

## 概述

本 Skill 提供 AITOLL API 的接入方案，包含可直接使用的客户端代码和完整示例。

**AITOLL 特点**：
- 支持多种模型（DeepSeek、Claude、GPT、Gemini）
- OpenAI 兼容格式
- 成本相对较低

**本 Skill 提供**：
- 可直接使用的客户端代码
- 完整的使用示例
- 错误处理和最佳实践

---

## 快速开始

### 1. 配置 API Key

在项目根目录创建 `.env.local`：

```env
AITOLL_API_KEY=your-api-key-here
```

**获取方式**：访问 [https://aitoll.net](https://aitoll.net) 注册并获取。

### 2. 复制客户端代码到项目

```bash
cp .claude/skills/aitoll-api/client.ts lib/ai.ts
```

### 3. 在代码中使用

```typescript
import { chat, generateImage } from '@/lib/ai'

// 文本对话
const response = await chat("你好，请介绍一下自己")

// 图像生成
const imageBase64 = await generateImage("一只可爱的猫咪")
```

---

## API 调用示例

### 文本对话

```typescript
import { chat } from '@/lib/ai'

// 基础对话
const reply = await chat("什么是人工智能？")

// 指定模型
const reply = await chat("帮我写一段代码", {
  model: 'claude-haiku-4.5',
  systemPrompt: '你是一个专业的程序员助手'
})

// 多轮对话
const messages = [
  { role: 'user', content: '你好' },
  { role: 'assistant', content: '你好！' },
  { role: 'user', content: '介绍一下 React' }
]
const reply = await chat(messages)
```

### 图像生成

```typescript
import { generateImage, downloadImage } from '@/lib/ai'

const imageBase64 = await generateImage("一只橘猫坐在窗台上")

// 下载图片（浏览器端）
downloadImage(imageBase64, 'cat.jpg')
```

### 图像编辑

```typescript
import { editImage, fileToBase64 } from '@/lib/ai'

// 从文件上传
const file = event.target.files[0]
const base64 = await fileToBase64(file)

// 编辑图片
const editedImage = await editImage("将背景改为粉色", base64)
```

### 图像理解

```typescript
import { understandImage } from '@/lib/ai'

// 图片描述
const description = await understandImage(
  imageBase64,
  "请描述这张图片的内容"
)

// OCR 文字识别
const text = await understandImage(imageBase64, "提取图片中的所有文字")
```

---

## 可用模型

AITOLL 支持以下模型：

| 模型名称 | 用途 | 特点 | 推荐场景 |
|---------|------|------|---------|
| `deepseek-chat` | 文本对话 | 经济实惠 | 日常对话、文本生成 |
| `claude-haiku-4.5` | 文本对话 | 代码能力强 | 代码生成、技术问答 |
| `claude-sonnet-4.5` | 文本对话 | 综合能力强 | 通用对话、内容创作 |
| `gpt-5.2` | 文本对话 | 行业优秀 | 复杂推理、专业问答 |
| `gemini-3-flash-preview` | 多模态 | 经济快速 | 图文理解 |
| `gemini-3-pro-preview` | 多模态 | 高质量 | 复杂图文分析 |
| `gemini-3-pro-image-preview` | 图像处理 | 专业图像 | 文生图、图像编辑、图像理解 |

**默认配置**：
- 对话：`deepseek-chat`（性价比高）
- 图像生成/编辑：`gemini-3-pro-image-preview`
- 图像理解：`gemini-3-pro-preview`

---

## Next.js 集成示例

### API Route（服务器端）

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chat } from '@/lib/ai'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    const reply = await chat(message)
    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
```

### 客户端调用

```typescript
const res = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: '你好' })
})
const data = await res.json()
console.log(data.reply)
```

完整示例请查看 `examples/` 目录。

---

## 错误处理

### 基础错误处理

```typescript
try {
  const reply = await chat("你好")
} catch (error) {
  if (error instanceof Error) {
    if (error.message.includes('AITOLL_API_KEY')) {
      alert('请配置 API Key')
    } else {
      alert('API 调用失败: ' + error.message)
    }
  }
}
```

### 超时处理

```typescript
// 图像生成可能较慢，建议添加超时
async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Timeout')), ms)
  )
  return Promise.race([promise, timeout])
}

const image = await withTimeout(generateImage("风景画"), 30000)
```

---

## 故障排查

### API Key 未配置

**错误**：`AITOLL_API_KEY 未配置`

**解决**：
1. 创建 `.env.local` 文件
2. 添加 `AITOLL_API_KEY=your-key`
3. 重启开发服务器

### 请求超时

**原因**：图像生成通常需要 10-30 秒

**解决**：添加 loading 状态，增加超时时间

---

## 参考文档

- **AITOLL API 详细文档**：查看 `docs/AITOLL接口对接.md`
- **使用示例**：查看 `examples/` 目录
- **客户端源码**：查看 `client.ts`

---

## 注意事项

如需更换其他服务商，可修改 `client.ts` 中的配置（API_BASE_URL、API_KEY_ENV、DEFAULT_MODELS），详见代码中的注释说明。

---

## 许可证

本 Skill 基于项目许可证提供，详见项目根目录的 LICENSE 文件。
