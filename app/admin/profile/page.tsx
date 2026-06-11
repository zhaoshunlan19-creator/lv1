'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Clock,
  Lightbulb,
  Loader2,
  ExternalLink,
  BookmarkX,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { SourceBadge } from '@/components/source-badge'
import type { Idea } from '@/lib/types'

interface HistoryItem {
  ideaId: string
  viewedAt: number
  idea?: Idea
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  if (hours < 24) return `${hours} 小时前`
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`

  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ProfilePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('follows')
  const [follows, setFollows] = useState<Idea[]>([])
  const [followsLoading, setFollowsLoading] = useState(true)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [unfollowingId, setUnfollowingId] = useState<string | null>(null)

  const fetchFollows = useCallback(async () => {
    setFollowsLoading(true)
    try {
      const res = await fetch('/api/me/follows')
      if (res.ok) {
        const data = await res.json()
        setFollows(data)
      }
    } catch (error) {
      console.error('获取关注列表失败:', error)
    } finally {
      setFollowsLoading(false)
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await fetch('/api/me/history')
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (error) {
      console.error('获取浏览历史失败:', error)
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchFollows()
    fetchHistory()
  }, [fetchFollows, fetchHistory])

  const handleUnfollow = async (ideaId: string) => {
    setUnfollowingId(ideaId)
    try {
      const res = await fetch(`/api/me/follows?ideaId=${ideaId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setFollows((prev) => prev.filter((i) => i.id !== ideaId))
      }
    } catch (error) {
      console.error('取消关注失败:', error)
    } finally {
      setUnfollowingId(null)
    }
  }

  const renderIdeaCard = (idea: Idea, extra?: React.ReactNode) => (
    <div
      key={idea.id}
      className="rounded-xl border bg-card overflow-hidden hover:border-primary/30 transition-colors"
    >
      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/idea/${idea.id}`}
            className="font-medium hover:text-primary transition-colors flex-1"
          >
            {idea.title}
          </Link>
          {extra}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{idea.description}</p>
        <div className="flex items-center gap-2">
          <SourceBadge type={idea.source?.type ?? 'manual'} />
        </div>
      </div>
    </div>
  )

  return (
    <main className="p-6 max-w-3xl">
      <h1 className="text-xl font-bold mb-6">个人中心</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="follows" className="gap-1.5">
            <Heart className="h-4 w-4" />
            我的关注
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <Clock className="h-4 w-4" />
            浏览历史
          </TabsTrigger>
        </TabsList>

        {/* ── 我的关注 ── */}
        <TabsContent value="follows" className="space-y-4">
          {followsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : follows.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">
                还没有关注任何创意，去广场逛逛吧
              </p>
              <Button onClick={() => router.push('/')} className="gap-1.5">
                <ExternalLink className="h-4 w-4" />
                去创意广场
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {follows.map((idea) =>
                renderIdeaCard(
                  idea,
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnfollow(idea.id)}
                    disabled={unfollowingId === idea.id}
                    title="取消关注"
                  >
                    {unfollowingId === idea.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <BookmarkX className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )
              )}
            </div>
          )}
        </TabsContent>

        {/* ── 浏览历史 ── */}
        <TabsContent value="history" className="space-y-4">
          {historyLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-20 space-y-4">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground/50" />
              <p className="text-muted-foreground">还没有浏览过任何创意</p>
              <Button onClick={() => router.push('/')} className="gap-1.5">
                <ExternalLink className="h-4 w-4" />
                去创意广场
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => {
                const idea = item.idea
                if (!idea) return null
                return (
                  <div
                    key={`${item.ideaId}-${item.viewedAt}`}
                    className="rounded-xl border bg-card overflow-hidden hover:border-primary/30 transition-colors"
                  >
                    <div className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <Link
                          href={`/idea/${idea.id}`}
                          className="font-medium hover:text-primary transition-colors flex-1"
                        >
                          {idea.title}
                        </Link>
                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                          {formatRelativeTime(item.viewedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <SourceBadge type={idea.source?.type ?? 'manual'} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </main>
  )
}
