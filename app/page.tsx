'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles, LayoutGrid, Maximize2, Lightbulb, ChevronRight, LogOut, Shield, Loader2, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IdeaCard } from '@/components/idea-card'
import { IdeaCardFocus } from '@/components/idea-card-focus'
import type { Idea } from '@/lib/types'
import type { SessionUser } from '@/lib/session'

export default function Home() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus')
  const [history, setHistory] = useState<string[]>([])
  const [user, setUser] = useState<SessionUser | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/ideas')
        if (res.ok) {
          const data: Idea[] = await res.json()
          setIdeas(data)
          if (data.length > 0) {
            const first = data[Math.floor(Math.random() * data.length)]
            setHistory([first.id])
          }
        }
      } catch (error) {
        console.error('获取创意列表失败:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // 获取当前登录用户信息
  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then(setUser)
      .finally(() => setUserLoading(false))
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    setLoggingOut(false)
    router.refresh()
  }

  const handleNext = useCallback(() => {
    setHistory((hist) => {
      const currentId = hist[hist.length - 1]
      const candidates = ideas.filter((i) => i.id !== currentId)
      const source = candidates.length ? candidates : ideas
      const next = source[Math.floor(Math.random() * source.length)]
      return [...hist.filter((id) => id !== next.id), next.id]
    })
  }, [ideas])

  const handleGridCardClick = useCallback((id: string) => {
    setHistory((hist) => [...hist.filter((h) => h !== id), id])
    setViewMode('focus')
  }, [])

  const currentId = history[history.length - 1]
  const currentIdea = ideas.find((i) => i.id === currentId)

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">lv1.today</span>
          </div>
          <div className="flex items-center gap-2">
            {ideas.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode(viewMode === 'focus' ? 'grid' : 'focus')}
                title={viewMode === 'focus' ? '切换到网格模式' : '切换到聚焦模式'}
              >
                {viewMode === 'focus' ? <LayoutGrid className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            )}

            {/* 分隔线 */}
            <div className="h-4 w-px bg-border mx-1" />

            {/* 用户入口 */}
            {userLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {user.displayName?.[0]?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm hidden sm:inline">{user.displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.displayName}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin/profile" className="cursor-pointer flex items-center gap-2">
                      <User className="h-4 w-4" />
                      个人中心
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} disabled={loggingOut}>
                    {loggingOut ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <LogOut className="h-4 w-4 mr-2" />
                    )}
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="ghost" size="sm" asChild className="h-8">
                <Link href="/login">登录</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {ideas.length === 0 && !loading && (
          <div className="text-center py-16 space-y-6">
            <div className="inline-flex items-center justify-center rounded-2xl bg-primary/5 p-6">
              <Lightbulb className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">IdeaForge 创意工坊</h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                探索创意，发现灵感。每个想法背后都有一份 AI 生成的产品规划。
              </p>
            </div>
            <p className="text-sm text-muted-foreground">管理员正在录入创意中，敬请期待...</p>
          </div>
        )}

        {loading && (
          <div className="rounded-xl border bg-card overflow-hidden animate-pulse">
            <div className="h-48 bg-muted" />
            <div className="p-6 space-y-3">
              <div className="h-7 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
            </div>
          </div>
        )}

        {!loading && ideas.length > 0 && viewMode === 'focus' && currentIdea && (
          <div className="space-y-4">
            <IdeaCardFocus idea={currentIdea} />
            <div className="flex items-center justify-center gap-3">
              <Button size="default" onClick={handleNext} className="gap-2 px-8">
                探索下一个
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {!loading && ideas.length > 0 && viewMode === 'grid' && (
          <div className="columns-2 gap-4">
            {ideas.map((idea) => (
              <div key={idea.id} onClick={() => handleGridCardClick(idea.id)} className="cursor-pointer">
                <IdeaCard idea={idea} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
