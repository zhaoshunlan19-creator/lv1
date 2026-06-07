'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface CreateIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateIdeaDialog({ open, onOpenChange, onCreated }: CreateIdeaDialogProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }

    setError('')
    setIsAnalyzing(true)

    try {
      // 1. 创建创意
      const createRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, targetUser }),
      })

      if (!createRes.ok) {
        throw new Error('创建创意失败')
      }

      const idea = await createRes.json()

      // 2. 调用 AI 分析
      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, targetUser }),
      })

      if (!analyzeRes.ok) {
        throw new Error('AI 分析失败')
      }

      const result = await analyzeRes.json()

      // 3. 更新创意状态和分析结果
      await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          analysis: result.analysis || null,
          mvpPlan: result.mvpPlan || null,
        }),
      })

      // 关闭弹窗并跳转
      onOpenChange(false)
      resetForm()
      onCreated?.()
      router.push(`/idea/${idea.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setIsAnalyzing(false)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setTargetUser('')
    setError('')
    setIsAnalyzing(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!isAnalyzing) {
        onOpenChange(v)
        if (!v) resetForm()
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            记录你的创意
          </DialogTitle>
        </DialogHeader>

        {isAnalyzing ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">AI 正在分析你的创意...</p>
              <p className="text-sm text-muted-foreground mt-1">
                正在生成需求分析和 MVP 规划，约需 10-30 秒
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">
                创意名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                placeholder="比如：自动整理读书笔记的工具"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                详细描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="具体描述你想做什么、解决什么问题..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetUser">
                目标用户 / 痛点 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="targetUser"
                placeholder="比如：20-35岁知识工作者，读完书记不住..."
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleSubmit} className="gap-1">
                <Lightbulb className="h-4 w-4" />
                开始分析
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
