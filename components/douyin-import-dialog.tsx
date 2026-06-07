'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Music2, Loader2, ArrowRight, Sparkles } from 'lucide-react'
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

type Stage = 'input' | 'extracting' | 'generating' | 'preview'

interface DouyinImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function DouyinImportDialog({ open, onOpenChange, onCreated }: DouyinImportDialogProps) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('input')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [videoSource, setVideoSource] = useState<null | {
    videoId: string
    shareUrl: string
    videoTitle: string
    coverImage: string
    authorName: string
    stats: { playCount: number; likeCount: number; commentCount: number; shareCount: number }
  }>(null)

  const handleExtract = async () => {
    if (!url.trim()) {
      setError('请输入抖音视频链接')
      return
    }
    setError('')
    setStage('extracting')

    try {
      // 1. 提取视频元数据
      const extractRes = await fetch('/api/douyin/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const extractData = await extractRes.json()
      if (!extractRes.ok) {
        throw new Error(extractData.error || '提取失败')
      }

      setStage('generating')

      // 2. 调用 AI 生成创意草稿
      const draftRes = await fetch('/api/douyin/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: extractData.title,
          description: extractData.description,
        }),
      })
      const draftData = await draftRes.json()
      if (!draftRes.ok) {
        throw new Error(draftData.error || 'AI 生成草稿失败')
      }

      setTitle(draftData.title || extractData.title || '')
      setDescription(draftData.description || '')
      setTargetUser(draftData.targetUser || '')
      setVideoSource({
        videoId: extractData.videoId,
        shareUrl: extractData.shareUrl,
        videoTitle: extractData.title,
        coverImage: extractData.coverImage,
        authorName: extractData.authorName,
        stats: extractData.stats,
      })
      setStage('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setStage('input')
    }
  }

  const handleConfirm = async () => {
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const createRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          targetUser,
          source: videoSource ? {
            type: 'douyin',
            ...videoSource,
          } : undefined,
        }),
      })
      if (!createRes.ok) throw new Error('创建创意失败')
      const idea = await createRes.json()

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, targetUser }),
      })
      if (!analyzeRes.ok) throw new Error('AI 分析失败')
      const result = await analyzeRes.json()

      await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          analysis: result.analysis || null,
          mvpPlan: result.mvpPlan || null,
        }),
      })

      onOpenChange(false)
      resetForm()
      onCreated?.()
      router.push(`/idea/${idea.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setStage('input')
    setUrl('')
    setTitle('')
    setDescription('')
    setTargetUser('')
    setError('')
    setIsSubmitting(false)
    setVideoSource(null)
  }

  const isLoading = stage === 'extracting' || stage === 'generating' || isSubmitting
  const loadingText =
    stage === 'extracting'
      ? '正在提取视频信息...'
      : stage === 'generating'
      ? 'AI 正在生成创意草稿...'
      : 'AI 正在深度分析创意...'

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!isLoading) {
          onOpenChange(v)
          if (!v) resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music2 className="h-5 w-5 text-primary" />
            从抖音导入创意
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div>
              <p className="font-medium">{loadingText}</p>
              <p className="text-sm text-muted-foreground mt-1">请稍候...</p>
            </div>
          </div>
        ) : stage === 'input' ? (
          <div className="space-y-4 pt-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="douyin-url">
                抖音视频链接 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="douyin-url"
                placeholder={"粘贴抖音分享文字或链接，例如：\n2.00 复制打开抖音，看看【...】 https://v.douyin.com/xxx/"}
                rows={3}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                直接粘贴抖音 App 的「复制链接」或「分享文字」均可，系统会自动提取链接
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                取消
              </Button>
              <Button onClick={handleExtract} className="gap-1">
                <ArrowRight className="h-4 w-4" />
                提取视频信息
              </Button>
            </div>
          </div>
        ) : (
          // stage === 'preview'
          <div className="space-y-4 pt-2">
            {error && (
              <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary shrink-0" />
              AI 已根据视频内容生成草稿，你可以直接编辑后确认
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-title">
                创意名称 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="preview-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-description">
                详细描述 <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="preview-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preview-target">
                目标用户 / 痛点 <span className="text-destructive">*</span>
              </Label>
              <Input
                id="preview-target"
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
              />
            </div>
            <div className="flex justify-between gap-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setStage('input'); setError('') }}
              >
                重新输入链接
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  取消
                </Button>
                <Button onClick={handleConfirm} className="gap-1">
                  <Sparkles className="h-4 w-4" />
                  确认创建并分析
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
