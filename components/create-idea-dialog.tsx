'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Music2, Loader2, ArrowRight, Sparkles } from 'lucide-react'
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

type Tab = 'manual' | 'douyin'
type DouyinStage = 'input' | 'extracting' | 'generating' | 'preview'

interface CreateIdeaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

export function CreateIdeaDialog({ open, onOpenChange, onCreated }: CreateIdeaDialogProps) {
  const router = useRouter()

  // 共用 Tab
  const [tab, setTab] = useState<Tab>('manual')

  // 手动录入
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // 抖音导入
  const [douyinStage, setDouyinStage] = useState<DouyinStage>('input')
  const [douyinUrl, setDouyinUrl] = useState('')
  const [douyinTitle, setDouyinTitle] = useState('')
  const [douyinDescription, setDouyinDescription] = useState('')
  const [douyinTargetUser, setDouyinTargetUser] = useState('')
  const [isSubmittingDouyin, setIsSubmittingDouyin] = useState(false)
  const [videoSource, setVideoSource] = useState<null | {
    videoId: string
    shareUrl: string
    videoTitle: string
    coverImage: string
    authorName: string
    stats: { playCount: number; likeCount: number; commentCount: number; shareCount: number }
  }>(null)

  // 公用错误
  const [error, setError] = useState('')

  // ─── 手动录入逻辑 ────────────────────────────────────────────────────────────

  const handleManualSubmit = async () => {
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }
    setError('')
    setIsAnalyzing(true)
    try {
      const createRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, targetUser }),
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
      resetAll()
      onCreated?.()
      router.push(`/idea/${idea.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setIsAnalyzing(false)
    }
  }

  // ─── 抖音导入逻辑 ────────────────────────────────────────────────────────────

  const handleDouyinConfirm = async () => {
    if (!douyinTitle.trim() || !douyinDescription.trim() || !douyinTargetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }
    setError('')
    setIsSubmittingDouyin(true)
    try {
      const createRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: douyinTitle,
          description: douyinDescription,
          targetUser: douyinTargetUser,
          source: videoSource ? { type: 'douyin', ...videoSource } : undefined,
        }),
      })
      if (!createRes.ok) throw new Error('创建创意失败')
      const idea = await createRes.json()

      const analyzeRes = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: douyinTitle, description: douyinDescription, targetUser: douyinTargetUser }),
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
      resetAll()
      onCreated?.()
      router.push(`/idea/${idea.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setIsSubmittingDouyin(false)
    }
  }

  const handleDouyinExtract = async () => {
    if (!douyinUrl.trim()) {
      setError('请输入抖音视频链接')
      return
    }
    setError('')
    setDouyinStage('extracting')
    try {
      const extractRes = await fetch('/api/douyin/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: douyinUrl }),
      })
      const extractData = await extractRes.json()
      if (!extractRes.ok) throw new Error(extractData.error || '提取失败')

      setDouyinStage('generating')

      const draftRes = await fetch('/api/douyin/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: extractData.title, description: extractData.description }),
      })
      const draftData = await draftRes.json()
      if (!draftRes.ok) throw new Error(draftData.error || 'AI 生成草稿失败')

      setDouyinTitle(draftData.title || extractData.title || '')
      setDouyinDescription(draftData.description || '')
      setDouyinTargetUser(draftData.targetUser || '')
      setVideoSource({
        videoId: extractData.videoId,
        shareUrl: extractData.shareUrl,
        videoTitle: extractData.title,
        coverImage: extractData.coverImage,
        authorName: extractData.authorName,
        stats: extractData.stats,
      })
      setDouyinStage('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setDouyinStage('input')
    }
  }

  // ─── 重置 ────────────────────────────────────────────────────────────────────

  const resetAll = () => {
    setTab('manual')
    setTitle('')
    setDescription('')
    setTargetUser('')
    setIsAnalyzing(false)
    setDouyinStage('input')
    setDouyinUrl('')
    setDouyinTitle('')
    setDouyinDescription('')
    setDouyinTargetUser('')
    setIsSubmittingDouyin(false)
    setVideoSource(null)
    setError('')
  }

  // ─── 派生状态 ─────────────────────────────────────────────────────────────────

  const douyinLoading = douyinStage === 'extracting' || douyinStage === 'generating' || isSubmittingDouyin
  const douyinLoadingText =
    douyinStage === 'extracting'
      ? '正在提取视频信息...'
      : douyinStage === 'generating'
      ? 'AI 正在生成创意草稿...'
      : 'AI 正在深度分析创意...'
  const anyLoading = isAnalyzing || douyinLoading

  // ─── 渲染 ────────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!anyLoading) {
          onOpenChange(v)
          if (!v) resetAll()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            新建创意
          </DialogTitle>
        </DialogHeader>

        {/* Tab 切换 */}
        {!anyLoading && (
          <div className="flex rounded-lg border bg-muted/50 p-1 gap-1">
            <button
              onClick={() => { setTab('manual'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'manual'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Lightbulb className="h-4 w-4" />
              手动录入
            </button>
            <button
              onClick={() => { setTab('douyin'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === 'douyin'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Music2 className="h-4 w-4" />
              从抖音导入
            </button>
          </div>
        )}

        {/* ── 手动录入 ── */}
        {tab === 'manual' && (
          isAnalyzing ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">AI 正在分析你的创意...</p>
                <p className="text-sm text-muted-foreground mt-1">正在生成需求分析和 MVP 规划，约需 10-30 秒</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">创意名称 <span className="text-destructive">*</span></Label>
                <Input
                  id="title"
                  placeholder="比如：自动整理读书笔记的工具"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">详细描述 <span className="text-destructive">*</span></Label>
                <Textarea
                  id="description"
                  placeholder="具体描述你想做什么、解决什么问题..."
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUser">目标用户 / 痛点 <span className="text-destructive">*</span></Label>
                <Input
                  id="targetUser"
                  placeholder="比如：20-35岁知识工作者，读完书记不住..."
                  value={targetUser}
                  onChange={(e) => setTargetUser(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                <Button onClick={handleManualSubmit} className="gap-1">
                  <Lightbulb className="h-4 w-4" />
                  开始分析
                </Button>
              </div>
            </div>
          )
        )}

        {/* ── 抖音导入 ── */}
        {tab === 'douyin' && (
          douyinLoading ? (
            <div className="py-12 text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <div>
                <p className="font-medium">{douyinLoadingText}</p>
                <p className="text-sm text-muted-foreground mt-1">请稍候...</p>
              </div>
            </div>
          ) : douyinStage === 'input' ? (
            <div className="space-y-4 pt-1">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}
              <div className="space-y-2">
                <Label htmlFor="douyin-url">抖音视频链接 <span className="text-destructive">*</span></Label>
                <Textarea
                  id="douyin-url"
                  placeholder={"粘贴抖音分享文字或链接，例如：\n2.00 复制打开抖音，看看【...】 https://v.douyin.com/xxx/"}
                  rows={3}
                  value={douyinUrl}
                  onChange={(e) => setDouyinUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  直接粘贴抖音 App 的「复制链接」或「分享文字」均可，系统会自动提取链接
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                <Button onClick={handleDouyinExtract} className="gap-1">
                  <ArrowRight className="h-4 w-4" />
                  提取视频信息
                </Button>
              </div>
            </div>
          ) : (
            // preview
            <div className="space-y-4 pt-1">
              {error && (
                <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
              )}
              <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                AI 已根据视频内容生成草稿，你可以直接编辑后确认
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-title">创意名称 <span className="text-destructive">*</span></Label>
                <Input id="preview-title" value={douyinTitle} onChange={(e) => setDouyinTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-description">详细描述 <span className="text-destructive">*</span></Label>
                <Textarea
                  id="preview-description"
                  rows={4}
                  value={douyinDescription}
                  onChange={(e) => setDouyinDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preview-target">目标用户 / 痛点 <span className="text-destructive">*</span></Label>
                <Input id="preview-target" value={douyinTargetUser} onChange={(e) => setDouyinTargetUser(e.target.value)} />
              </div>
              <div className="flex justify-between gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => { setDouyinStage('input'); setError('') }}>
                  重新输入链接
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                  <Button onClick={handleDouyinConfirm} className="gap-1">
                    <Sparkles className="h-4 w-4" />
                    确认创建并分析
                  </Button>
                </div>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
