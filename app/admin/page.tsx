'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Trash2,
  Pencil,
  RefreshCw,
  Loader2,
  Eye,
  Sparkles,
  LayoutGrid,
  Plus,
  Lightbulb,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EditIdeaDialog } from '@/components/edit-idea-dialog'
import { CreateIdeaDialog } from '@/components/create-idea-dialog'
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
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all')
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

  const filteredIdeas = ideas.filter((idea) => {
    const matchSearch =
      search === '' ||
      idea.title.toLowerCase().includes(search.toLowerCase()) ||
      idea.description.toLowerCase().includes(search.toLowerCase()) ||
      idea.targetUser.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || idea.status === statusFilter
    return matchSearch && matchStatus
  })

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

  const stats = {
    total: ideas.length,
    pending: ideas.filter((i) => i.status === 'pending').length,
    analyzing: ideas.filter((i) => i.status === 'analyzing').length,
    completed: ideas.filter((i) => i.status === 'completed').length,
  }

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="gap-1">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                返回首页
              </Link>
            </Button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold text-lg">管理后台</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/">
                <LayoutGrid className="h-4 w-4" />
                卡片视图
              </Link>
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
              <Plus className="h-4 w-4" />
              新建创意
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">全部创意</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold text-slate-600">{stats.pending}</p>
            <p className="text-sm text-muted-foreground">待分析</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold text-amber-600">{stats.analyzing}</p>
            <p className="text-sm text-muted-foreground">分析中</p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
            <p className="text-sm text-muted-foreground">已完成</p>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索创意标题、描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'pending', 'analyzing', 'completed'] as const).map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' && '全部'}
                {s === 'pending' && '待分析'}
                {s === 'analyzing' && '分析中'}
                {s === 'completed' && '已完成'}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredIdeas.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <Lightbulb className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {search || statusFilter !== 'all' ? '没有匹配的创意' : '还没有录入任何创意'}
            </p>
            {!search && statusFilter === 'all' && (
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                录入第一个创意
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">创意名称</th>
                    <th className="text-left px-4 py-3 font-medium hidden md:table-cell">描述摘要</th>
                    <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">目标用户</th>
                    <th className="text-left px-4 py-3 font-medium">状态</th>
                    <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">创建时间</th>
                    <th className="text-right px-4 py-3 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIdeas.map((idea) => (
                    <tr key={idea.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/idea/${idea.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {idea.title}
                        </Link>
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
              共 {filteredIdeas.length} 条记录
              {search && `（搜索："${search}"）`}
              {statusFilter !== 'all' && ` · 状态筛选`}
            </div>
          </div>
        )}
      </div>

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
