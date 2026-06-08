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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EditIdeaDialog } from '@/components/edit-idea-dialog'
import { CreateIdeaDialog } from '@/components/create-idea-dialog'
import { SourceBadge } from '@/components/source-badge'
import type { Idea, IdeaStatus } from '@/lib/types'

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

export default function AdminPage() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [editIdea, setEditIdea] = useState<Idea | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reAnalyzingId, setReAnalyzingId] = useState<string | null>(null)

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas')
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
    fetchIdeas()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个创意吗？')) return
    setDeletingId(id)
    try {
      await fetch(`/api/ideas/${id}`, { method: 'DELETE' })
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

  const openEdit = (idea: Idea) => {
    setEditIdea(idea)
    setEditOpen(true)
  }

  return (
    <main className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">创意管理</h1>
        <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
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
            <p className="text-muted-foreground">还没有录入任何创意</p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              录入第一个创意
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
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">创建时间</th>
                    <th className="text-right px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {ideas.map((idea) => (
                    <tr key={idea.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/idea/${idea.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {idea.title}
                        </Link>
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
                            onClick={() => openEdit(idea)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleReanalyze(idea)}
                            disabled={reAnalyzingId === idea.id}
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
                            disabled={deletingId === idea.id}
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

      {/* Create Dialog */}
      <CreateIdeaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchIdeas}
      />

      {/* Edit Dialog */}
      <EditIdeaDialog
        idea={editIdea}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={fetchIdeas}
      />
    </main>
  )
}
