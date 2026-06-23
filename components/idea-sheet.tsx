'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Music2, Loader2, ArrowRight, Sparkles,
  Brain, Rocket, FileText, RefreshCw, Users,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { AnalysisSection } from '@/components/analysis-section'
import { MVPSection } from '@/components/mvp-section'
import { SourceBadge } from '@/components/source-badge'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import type { Idea, AnalysisResult, MVPPlan, IdeaSource } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────────

type DocPhase = 'idle' | 'submitting' | 'analyzing' | 'complete' | 'saving' | 're-analyzing'
type ExtractStage = 'input' | 'extracting' | 'generating'
type ImportType = 'douyin' | 'xiaohongshu'
type ActiveField = 'title' | 'description' | 'targetUser' | null

interface IdeaSheetProps {
  mode: 'create' | 'edit'
  open: boolean
  onOpenChange: (open: boolean) => void
  idea?: Idea
  onSuccess?: () => void
}

// ── Internal helpers ───────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-0.5 h-4 rounded-full bg-border" />
      <div className="text-muted-foreground/70">{icon}</div>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
    </div>
  )
}

function AiEmptyPlaceholder({ text }: { text: string }) {
  return (
    <p className="text-sm italic text-muted-foreground/40 px-2 py-1">{text}</p>
  )
}

function AiLoadingPlaceholder({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function IdeaSheet({ mode, open, onOpenChange, idea, onSuccess }: IdeaSheetProps) {
  const router = useRouter()

  // Document fields
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetUser, setTargetUser] = useState('')

  // Main phase
  const [docPhase, setDocPhase] = useState<DocPhase>('idle')

  // AI results
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [mvpResult, setMvpResult] = useState<MVPPlan | null>(null)
  const [ideaId, setIdeaId] = useState<string | null>(null)

  // Source
  const [source, setSource] = useState<IdeaSource | null>(null)

  // Import popover (shared for Douyin / Xiaohongshu)
  const [importType, setImportType] = useState<ImportType | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [importStage, setImportStage] = useState<ExtractStage>('input')

  const [error, setError] = useState('')

  // Inline editing
  const [activeField, setActiveField] = useState<ActiveField>(null)

  // ── Init for edit mode ──────────────────────────────────────────────────────

  useEffect(() => {
    if (mode === 'edit' && idea && open) {
      setTitle(idea.title)
      setDescription(idea.description)
      setTargetUser(idea.targetUser)
      setAnalysisResult(idea.analysis ?? null)
      setMvpResult(idea.mvpPlan ?? null)
      setSource(idea.source ?? null)
      setIdeaId(idea.id)
      setDocPhase(idea.analysis ? 'complete' : 'idle')
      setError('')
    }
  }, [idea, open, mode])

  // ── Reset on close ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) {
      setTitle('')
      setDescription('')
      setTargetUser('')
      setDocPhase('idle')
      setAnalysisResult(null)
      setMvpResult(null)
      setIdeaId(null)
      setSource(null)
      setImportType(null)
      setImportUrl('')
      setImportStage('input')
      setError('')
      setActiveField(null)
    }
  }, [open])

  // ── Derived ─────────────────────────────────────────────────────────────────

  const anyBusy = ['submitting', 'analyzing', 'saving', 're-analyzing'].includes(docPhase)
  const importLoading = importStage === 'extracting' || importStage === 'generating'
  const fieldsReadOnly = mode === 'create' && docPhase === 'complete'
  // ── Handlers ────────────────────────────────────────────────────────────────

  const runAnalysis = async (id: string, t: string, d: string, u: string) => {
    setDocPhase('analyzing')
    const analyzeRes = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: t, description: d, targetUser: u }),
    })
    if (!analyzeRes.ok) throw new Error('AI 分析失败')
    const result = await analyzeRes.json()
    await fetch(`/api/ideas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed',
        analysis: result.analysis || null,
        mvpPlan: result.mvpPlan || null,
      }),
    })
    setAnalysisResult(result.analysis || null)
    setMvpResult(result.mvpPlan || null)
    setDocPhase('complete')
  }

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }
    setError('')
    setDocPhase('submitting')
    try {
      const createRes = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, targetUser,
          source: source ?? undefined,
        }),
      })
      if (!createRes.ok) throw new Error('创建创意失败')
      const created = await createRes.json()
      setIdeaId(created.id)
      await runAnalysis(created.id, title, description, targetUser)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setDocPhase('idle')
    }
  }

  const handleExtract = async () => {
    if (!importType) return
    if (!importUrl.trim()) {
      setError(importType === 'douyin' ? '请输入抖音视频链接' : '请输入小红书笔记链接')
      return
    }
    setError('')
    setImportStage('extracting')
    try {
      const extractRes = await fetch(`/api/${importType}/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl }),
      })
      const extractData = await extractRes.json()
      if (!extractRes.ok) throw new Error(extractData.error || '提取失败')

      setImportStage('generating')
      const draftRes = await fetch(`/api/${importType}/draft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: extractData.title, description: extractData.description }),
      })
      const draftData = await draftRes.json()
      if (!draftRes.ok) throw new Error(draftData.error || 'AI 生成草稿失败')

      // Fill document fields and close the import popover
      setTitle(draftData.title || extractData.title || '')
      setDescription(draftData.description || '')
      setTargetUser(draftData.targetUser || '')

      if (importType === 'douyin') {
        setSource({
          type: 'douyin',
          videoId: extractData.videoId,
          shareUrl: extractData.shareUrl,
          videoTitle: extractData.title,
          coverImage: extractData.coverImage,
          authorName: extractData.authorName,
          stats: extractData.stats,
        })
      } else {
        setSource({
          type: 'xiaohongshu',
          noteId: extractData.noteId,
          shareUrl: extractData.shareUrl,
          noteTitle: extractData.title,
          coverImage: extractData.coverImage,
          authorName: extractData.authorName,
          authorId: extractData.authorId,
          stats: extractData.stats,
        })
      }

      setImportType(null)
      setImportUrl('')
      setImportStage('input')
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setImportStage('input')
    }
  }

  const handleSave = async () => {
    if (!ideaId) return
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }
    setError('')
    setDocPhase('saving')
    try {
      const res = await fetch(`/api/ideas/${ideaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim(), targetUser: targetUser.trim() }),
      })
      if (!res.ok) throw new Error('保存失败')
      onSuccess?.()
      setDocPhase('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
      setDocPhase('complete')
    }
  }

  const handleReanalyze = async () => {
    if (!ideaId) return
    setError('')
    try {
      await runAnalysis(ideaId, title, description, targetUser)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 分析失败')
      setDocPhase('complete')
    }
  }

  // ── Import trigger renderer ─────────────────────────────────────────────────

  const renderImportTrigger = (type: ImportType, icon: React.ReactNode, label: string) => (
    <Popover
      open={importType === type}
      onOpenChange={(v) => {
        if (!importLoading) {
          if (v) {
            setImportType(type)
            setImportUrl('')
            setImportStage('input')
          } else {
            setImportType(null)
            setImportUrl('')
            setImportStage('input')
          }
        }
      }}
    >
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {icon}
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4 space-y-3">
        {importLoading ? (
          <div className="py-4 text-center space-y-2">
            <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
            <p className="text-xs text-muted-foreground">
              {importStage === 'extracting'
                ? type === 'douyin' ? '正在提取视频信息...' : '正在提取笔记信息...'
                : 'AI 正在生成草稿...'}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">
              {type === 'douyin'
                ? '粘贴抖音分享文字或链接，AI 自动提取并预填字段'
                : '粘贴小红书分享文字或链接，AI 自动提取并预填字段'}
            </p>
            <Textarea
              placeholder={type === 'douyin'
                ? "例如：\n2.00 复制打开抖音，看看【...】 https://v.douyin.com/xxx/"
                : "例如：\n99 生活达人发布了一篇小红书笔记，快来看吧！ 😆 ... http://xhslink.com/xxx/，复制本条信息，打开【小红书】App查看精彩内容！"}
              rows={3}
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="text-sm resize-none"
              autoFocus
            />
            <Button size="sm" className="w-full gap-1.5" onClick={handleExtract}>
              <ArrowRight className="h-3.5 w-3.5" />
              提取并预填
            </Button>
          </>
        )}
      </PopoverContent>
    </Popover>
  )

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!anyBusy && !importLoading) onOpenChange(v) }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0">

        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2">
            {mode === 'create'
              ? <><Sparkles className="h-5 w-5 text-primary" />新建创意</>
              : <><FileText className="h-5 w-5 text-primary" />{title || '编辑创意'}</>
            }
          </SheetTitle>
          {source && (
            <div className="mt-1">
              <SourceBadge type={source.type} />
            </div>
          )}
        </SheetHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          {/* Section: 基本信息 — Notion-style inline editing */}
          <section className="space-y-1">

            {/* Import triggers — floats top-right, only in create+idle */}
            {mode === 'create' && docPhase === 'idle' && (
              <div className="flex justify-end gap-3 mb-1">
                {renderImportTrigger('douyin', <Music2 className="h-3.5 w-3.5" />, '从抖音导入')}
                {renderImportTrigger('xiaohongshu', <BookOpen className="h-3.5 w-3.5" />, '从小红书导入')}
              </div>
            )}

            {/* Import draft hint */}
            {mode === 'create' && (source?.type === 'douyin' || source?.type === 'xiaohongshu') && docPhase === 'idle' && (
              <div className="mb-3 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-sm flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                AI 已根据{source?.type === 'douyin' ? '视频' : '笔记'}内容预填字段，可直接编辑后提交
              </div>
            )}

            {/* Title — H1 level */}
            <div className="-mx-2">
              {activeField === 'title' && !fieldsReadOnly ? (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setActiveField(null)}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveField('targetUser')}
                  placeholder="输入创意名称..."
                  className="w-full bg-transparent outline-none px-2 py-1 text-2xl font-semibold tracking-tight leading-snug rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground/40 placeholder:italic placeholder:font-semibold placeholder:text-2xl"
                />
              ) : (
                <div
                  onClick={() => !fieldsReadOnly && setActiveField('title')}
                  className={cn(
                    'px-2 py-1 rounded-lg min-h-10',
                    !fieldsReadOnly && 'hover:bg-muted/40 cursor-text transition-colors',
                  )}
                >
                  {title ? (
                    <h1 className="text-2xl font-semibold tracking-tight leading-snug">{title}</h1>
                  ) : (
                    <p className="text-2xl font-semibold italic text-muted-foreground/40">输入创意名称...</p>
                  )}
                </div>
              )}
            </div>

            {/* Target user — metadata line under title */}
            <div className="-mx-2">
              {activeField === 'targetUser' && !fieldsReadOnly ? (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg focus-within:ring-2 focus-within:ring-ring/50">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <input
                    autoFocus
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    onBlur={() => setActiveField(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveField('description')}
                    placeholder="目标用户 / 痛点..."
                    className="flex-1 bg-transparent outline-none text-sm text-muted-foreground placeholder:text-muted-foreground/40 placeholder:italic"
                  />
                </div>
              ) : (
                <div
                  onClick={() => !fieldsReadOnly && setActiveField('targetUser')}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded-lg min-h-7',
                    !fieldsReadOnly && 'hover:bg-muted/40 cursor-text transition-colors',
                  )}
                >
                  <Users className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  {targetUser ? (
                    <span className="text-sm text-muted-foreground">{targetUser}</span>
                  ) : (
                    <span className="text-sm italic text-muted-foreground/40">目标用户 / 痛点...</span>
                  )}
                </div>
              )}
            </div>

            <div className="border-b border-border/40 my-3" />

            {/* Description — document body */}
            <div className="-mx-2">
              {activeField === 'description' && !fieldsReadOnly ? (
                <textarea
                  autoFocus
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => setActiveField(null)}
                  placeholder="详细描述你的创意，解决什么问题、怎么做..."
                  rows={7}
                  className="w-full bg-transparent outline-none px-2 py-1 text-sm leading-relaxed resize-none rounded-lg focus-visible:ring-2 focus-visible:ring-ring/50 placeholder:text-muted-foreground/40 placeholder:italic"
                />
              ) : (
                <div
                  onClick={() => !fieldsReadOnly && setActiveField('description')}
                  className={cn(
                    'px-2 py-1 rounded-lg min-h-32',
                    !fieldsReadOnly && 'hover:bg-muted/40 cursor-text transition-colors',
                  )}
                >
                  {description ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{description}</p>
                  ) : (
                    <p className="text-sm italic text-muted-foreground/40">详细描述你的创意，解决什么问题、怎么做...</p>
                  )}
                </div>
              )}
            </div>

          </section>

          {/* Section: 需求分析 */}
          <section>
            <SectionHeader icon={<Brain className="h-4 w-4" />} title="需求分析" />
            <div className="px-2">
              {(docPhase === 'analyzing' || docPhase === 're-analyzing')
                ? <AiLoadingPlaceholder text="正在生成需求分析..." />
                : analysisResult
                  ? <AnalysisSection analysis={analysisResult} />
                  : <AiEmptyPlaceholder text="提交后将自动生成需求分析" />
              }
            </div>
          </section>

          {/* Section: MVP 方案 */}
          <section>
            <SectionHeader icon={<Rocket className="h-4 w-4" />} title="MVP 方案" />
            <div className="px-2">
              {(docPhase === 'analyzing' || docPhase === 're-analyzing')
                ? <AiLoadingPlaceholder text="正在生成 MVP 方案..." />
                : mvpResult
                  ? <MVPSection mvpPlan={mvpResult} />
                  : <AiEmptyPlaceholder text="提交后将自动生成 MVP 方案" />
              }
            </div>
          </section>

        </div>

        {/* Sticky footer */}
        <div className="shrink-0 border-t px-6 py-4">
          {mode === 'create' ? (
            (docPhase === 'analyzing' || docPhase === 'submitting') ? (
              <div className="flex justify-end">
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {docPhase === 'submitting' ? '正在创建...' : 'AI 分析中...'}
                </Button>
              </div>
            ) : docPhase === 'complete' ? (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>关闭</Button>
                <Button onClick={() => { if (ideaId) router.push(`/idea/${ideaId}`); onOpenChange(false) }} className="gap-1.5">
                  <FileText className="h-4 w-4" />
                  查看详情
                </Button>
              </div>
            ) : (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                <Button onClick={handleSubmit} disabled={importLoading} className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  创建并分析
                </Button>
              </div>
            )
          ) : (
            (docPhase === 'saving' || docPhase === 're-analyzing') ? (
              <div className="flex justify-end">
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  {docPhase === 'saving' ? '保存中...' : 'AI 分析中...'}
                </Button>
              </div>
            ) : (
              <div className="flex justify-between gap-2">
                <Button variant="outline" size="sm" onClick={handleReanalyze} className="gap-1.5">
                  <RefreshCw className="h-4 w-4" />
                  重新分析
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
                  <Button onClick={handleSave}>保存</Button>
                </div>
              </div>
            )
          )}
        </div>

      </SheetContent>
    </Sheet>
  )
}
