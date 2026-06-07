/**
 * 图像生成示例
 *
 * 功能：
 * - 用户输入图像描述
 * - 调用 AITOLL API 生成图像
 * - 显示生成的图像
 * - 下载图像
 *
 * 使用方法：
 * 1. 复制此文件到 app/image-gen/page.tsx
 * 2. 创建对应的 API 路由
 * 3. 访问 /image-gen 页面
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ImageGenExample() {
  const [prompt, setPrompt] = useState('')
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateImage = async () => {
    if (!prompt.trim() || loading) return

    setLoading(true)
    setGeneratedImage(null)

    try {
      const response = await fetch('/api/ai/image-gen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })

      if (!response.ok) {
        throw new Error('API 调用失败')
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      setGeneratedImage(data.image)
    } catch (error) {
      console.error('图像生成失败:', error)
      alert(error instanceof Error ? error.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const downloadImage = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `aitoll-image-${Date.now()}.jpg`
    link.click()
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">AI 图像生成示例</h1>

      {/* 输入区域 */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          图像描述
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想生成的图像，例如：一只可爱的橘猫坐在窗台上看风景"
          className="w-full border rounded-lg px-4 py-2 min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={generateImage}
          disabled={!prompt.trim() || loading}
          className="mt-3 w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '正在生成...' : '生成图像'}
        </button>
      </div>

      {/* 图像显示区域 */}
      {generatedImage ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="relative w-full aspect-square bg-gray-100">
            <Image
              src={generatedImage}
              alt="Generated image"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="p-4 bg-gray-50 flex justify-between items-center">
            <p className="text-sm text-gray-600">生成成功！</p>
            <button
              onClick={downloadImage}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              下载图片
            </button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-lg p-12 text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-16 w-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">
            {loading ? '正在生成图像...' : '在上方输入描述，点击生成按钮'}
          </p>
        </div>
      )}

      {/* 提示 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">💡 使用技巧</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 描述越详细，生成的图像越符合预期</li>
          <li>• 可以指定风格：水彩画、写实照片、卡通风格等</li>
          <li>• 尝试添加光线、构图等细节描述</li>
          <li>• 生成通常需要 10-30 秒，请耐心等待</li>
        </ul>
      </div>
    </div>
  )
}
