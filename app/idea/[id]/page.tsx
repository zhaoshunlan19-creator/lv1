'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Lightbulb,
  Users,
  ClipboardList,
  Target,
  Loader2,
  Trash2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AnalysisSection } from '@/components/analysis-section'
import { MVPSection } from '@/components/mvp-section'
import type { Idea } from '@/lib/types'

export default function IdeaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [idea, setIdea] = useState<Idea | null>(null)
  const [loading, setLoading] = useState(true)
  const [reAnalyzing, setReAnalyzing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchIdea = async () => {
    try {
      const res = await fetch(`/api/ideas/${id}`)
      if (res.ok) {
        const data = await res.json()
        setIdea(data)
      } else if (res.status === 404) {
        router.push('/')
      }
    } catch (error) {
      console.error('获取创意详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIdea()
  }, [id])

  const handleReanalyze = async () => {
    if (!idea) return
    setReAnalyzing(true)

    try {
      // 更新状态为分析中
      await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'analyzing' }),
      })
      setIdea({ ...idea, status: 'analyzing' })

      // 调用 AI 分析
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          description: idea.description,
          targetUser: idea.targetUser,
        }),
      })

      if (!res.ok) throw new Error('AI 分析失败')

      const result = await res.json()

      // 更新结果
      await fetch(`/api/ideas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          analysis: result.analysis || null,
          mvpPlan: result.mvpPlan || null,
        }),
      })

      await fetchIdea()
    } catch (error) {
      console.error('重新分析失败:', error)
      alert('重新分析失败，请重试')
    } finally {
      setReAnalyzing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('确定要删除这个创意吗？')) return
    setDeleting(true)

    try {
      await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
      router.push('/')
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </main>
    )
  }

  if (!idea) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">创意不存在或已被删除</p>
          <Button asChild>
            <Link href="/">返回首页</Link>
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              返回首页
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReanalyze}
              disabled={reAnalyzing}
              className="gap-1"
            >
              {reAnalyzing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              {reAnalyzing ? '分析中...' : '重新分析'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="gap-1 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              删除
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Idea Info */}
        <section className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-primary/10 p-3">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{idea.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(idea.createdAt).toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-start gap-3">
              <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm">创意描述</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {idea.description}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <h3 className="font-medium text-sm">目标用户 / 痛点</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {idea.targetUser}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* AI Analysis */}
        {idea.status === 'analyzing' && (
          <div className="rounded-xl border bg-card p-8 text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="font-medium">AI 正在分析中...</p>
            <p className="text-sm text-muted-foreground">
              正在生成需求分析和 MVP 规划，请稍候
            </p>
          </div>
        )}

        {idea.status === 'completed' && idea.analysis && (
          <section className="rounded-xl border bg-card">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">AI 需求分析</h2>
              </div>
            </div>
            <div className="p-5">
              <AnalysisSection analysis={idea.analysis} />
            </div>
          </section>
        )}

        {idea.status === 'completed' && idea.mvpPlan && (
          <section className="rounded-xl border bg-card">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">MVP 方案</h2>
              </div>
            </div>
            <div className="p-5">
              <MVPSection mvpPlan={idea.mvpPlan} />
            </div>
          </section>
        )}

        {/* Tech Suggestion Placeholder */}
        {idea.status === 'completed' && (
          <section className="rounded-xl border border-dashed border-muted-foreground/30 p-5 text-center">
            <p className="text-sm text-muted-foreground">
              🛠️ 详细技术选型分析即将上线...
            </p>
          </section>
        )}
      </div>
    </main>
  )
}
