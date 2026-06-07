/**
 * 简单聊天界面示例
 *
 * 功能：
 * - 用户输入消息
 * - 调用 AITOLL API 获取回复
 * - 显示对话历史
 *
 * 使用方法：
 * 1. 复制此文件到 app/chat/page.tsx
 * 2. 创建对应的 API 路由（参考 api-route-example.ts）
 * 3. 访问 /chat 页面
 */

'use client'

import { useState } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatExample() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          // 可选：传递对话历史
          history: messages,
        }),
      })

      if (!response.ok) {
        throw new Error('API 调用失败')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.reply,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('发送消息失败:', error)
      alert(error instanceof Error ? error.message : '发生错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI 对话示例</h1>

      {/* 消息列表 */}
      <div className="space-y-4 mb-6 min-h-[400px] max-h-[500px] overflow-y-auto border rounded-lg p-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            开始对话吧！
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2">
              <p className="text-gray-500">正在输入...</p>
            </div>
          </div>
        )}
      </div>

      {/* 输入框 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              sendMessage()
            }
          }}
          placeholder="输入消息... (Enter 发送)"
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || loading}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>
    </div>
  )
}
