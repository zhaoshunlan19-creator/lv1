'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Trash2,
  Pencil,
  RefreshCw,
  Loader2,
  Eye,
  Plus,
  Lightbulb,
  Globe,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IdeaSheet } from '@/components/idea-sheet'
import { SourceBadge } from '@/components/source-badge'
import type { Idea, IdeaStatus } from '@/lib/types'
import type { SessionUser } from '@/lib/session'

function StatusBadge({ status }: { status: IdeaStatus }) {
  const styles = {
    pending: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    analyzing: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  }
  const labels = {
    pending: '待分析',
    analyzing: '分析中',
    completed: '已完成',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function OwnerBadge({ idea, isAdmin }: { idea: Idea; isAdmin: boolean }) {
  if (isAdmin) {
    return idea.userId ? (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded" title="个人创意">
        <Lock className="h-3 w-3" />
        个人
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-primary/5 px-1.5 py-0.5 rounded" title="公共创意">
        <Globe className="h-3 w-3" />
        公共
      </span>
    )
  }
  return null
}

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)
  const [sheet, setSheet] = useState<
    | { open: false }
    | { open: true; mode: 'create' }
    | { open: true; mode: 'edit'; idea: Idea }
  >({ open: false })
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reAnalyzingId, setReAnalyzingId] = useState<string | null>(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
  }, [])

  const fetchIdeas = async () => {
    try {
      const url = isAdmin ? '/api/ideas' : '/api/me/ideas'
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setIdeas(data)
      }
    } catch (error) {
      console.error('获取创意列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchIdeas()
    }
  }, [user])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个创意吗？')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: '删除失败' }))
        alert(err.error || '删除失败')
        return
      }
      setIdeas((prev) => prev.filter((i) => i.id !== id))
    } catch (error) {
      console.error('删除失败:', error)
      alert('删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const handleReanalyze = async (idea: Idea) => {
    setReAnalyzingId(idea.id)
    try {
      await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'analyzing' }),
      })
      setIdeas((prev) =>
        prev.map((i) => (i.id === idea.id ? { ...i, status: 'analyzing' as const } : i))
      )

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

      await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          analysis: result.analysis || null,
          mvpPlan: result.mvpPlan || null,
        }),
      })

      await fetchIdeas()
    } catch (error) {
      console.error('重新分析失败:', error)
      alert('重新分析失败')
    } finally {
      setReAnalyzingId(null)
    }
  }

  const canEdit = (idea: Idea) => isAdmin || idea.userId === user?.id

  return (
    <main className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isAdmin ? '创意管理' : '我的创意'}</h1>
        <Button size="sm" onClick={() => setSheet({ open: true, mode: 'create' })} className="gap-1.5">
          <Plus className="h-4 w-4" />
          新建创意
        </Button>
      </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {isAdmin ? '还没有录入任何创意' : '还没有创建过创意'}
            </p>
            <Button onClick={() => setSheet({ open: true, mode: 'create' })}>
              <Plus className="h-4 w-4 mr-1" />
              {isAdmin ? '录入第一个创意' : '创建第一个创意'}
            </Button>
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">创意名称</th>
                    <th className="text-left px-4 py-3 font-medium">来源</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">描述摘要</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">目标用户</th>
                    <th className="text-left px-4 py-3 font-medium">状态</th>
                    {isAdmin && (
                      <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">归属</th>
                    )}
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">创建时间</th>
                    <th className="text-right px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/idea/${idea.id}`}
                            className="font-medium hover:text-primary transition-colors"
                          >
                            {idea.title}
                          </Link>
                          <OwnerBadge idea={idea} isAdmin={isAdmin} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <SourceBadge type={idea.source?.type ?? 'manual'} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-muted-foreground line-clamp-2 max-w-xs">
                          {idea.description}
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-muted-foreground line-clamp-1 max-w-[150px]">
                          {idea.targetUser}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={idea.status} />
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <OwnerBadge idea={idea} isAdmin={isAdmin} />
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell whitespace-nowrap">
                        {new Date(idea.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                            <Link href={`/idea/${idea.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSheet({ open: true, mode: 'edit', idea })}
                            disabled={!canEdit(idea)}
                            title={canEdit(idea) ? '编辑' : '无权编辑'}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReanalyze(idea)}
                            disabled={reAnalyzingId === idea.id || !canEdit(idea)}
                            title={canEdit(idea) ? '重新分析' : '无权分析'}
                          >
                            {reAnalyzingId === idea.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(idea.id)}
                            disabled={deletingId === idea.id || !canEdit(idea)}
                            title={canEdit(idea) ? '删除' : '无权删除'}
                          >
                            {deletingId === idea.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t text-sm text-muted-foreground">
              共 {ideas.length} 条记录
            </div>
          </div>
        )}

      {/* Idea Sheet */}
      <IdeaSheet
        mode={sheet.open ? sheet.mode : 'create'}
        open={sheet.open}
        onOpenChange={(v) => { if (!v) setSheet({ open: false }) }}
        idea={sheet.open && sheet.mode === 'edit' ? sheet.idea : undefined}
        onSuccess={fetchIdeas}
      />
    </main>
  )
}
