'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Clock,
  Loader2,
  ExternalLink,
  BookmarkX,
  Sparkles,
  ArrowLeft,
  User,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SourceBadge } from '@/components/source-badge'
import type { Idea } from '@/lib/types'
import type { SessionUser } from '@/lib/session'

interface HistoryItem {
  ideaId: string
  viewedAt: number
  idea?: Idea
}

const PROFILE_NAV_ITEMS = [
  {
    label: '我的关注',
    value: 'follows',
    icon: Heart,
  },
  {
    label: '浏览历史',
    value: 'history',
    icon: Clock,
  },
  {
    label: '账号设置',
    value: 'settings',
    icon: User,
  },
]

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

  // 账号设置相关
  const [user, setUser] = useState<SessionUser | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaveResult, setProfileSaveResult] = useState<'ok' | 'error' | null>(null)
  const [profileError, setProfileError] = useState('')

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
    // 获取用户信息
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) {
          setUser(u)
          setDisplayName(u.displayName || '')
        }
      })
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

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    setProfileSaveResult(null)
    setProfileError('')

    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('两次输入的密码不一致')
      setProfileSaving(false)
      return
    }

    if (newPassword && newPassword.length < 8) {
      setProfileError('密码至少 8 位')
      setProfileSaving(false)
      return
    }

    try {
      const body: { displayName?: string; password?: string } = {}
      if (displayName.trim() && displayName.trim() !== user?.displayName) {
        body.displayName = displayName.trim()
      }
      if (newPassword) {
        body.password = newPassword
      }

      if (!body.displayName && !body.password) {
        setProfileError('没有需要保存的更改')
        setProfileSaving(false)
        return
      }

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()

      setProfileSaveResult('ok')
      setNewPassword('')
      setConfirmPassword('')
      // 刷新用户信息
      const updatedUser = await fetch('/api/me').then((r) => r.json())
      setUser(updatedUser)
      setDisplayName(updatedUser.displayName || '')
    } catch {
      setProfileSaveResult('error')
    } finally {
      setProfileSaving(false)
    }
  }

  const hasProfileChange =
    displayName.trim() !== (user?.displayName || '') ||
    newPassword !== '' ||
    confirmPassword !== ''

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
    <main className="flex min-h-screen bg-background">
      <aside className="w-52 shrink-0 border-r bg-card flex flex-col sticky top-0 h-screen">
        <div className="px-4 py-5 border-b">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold text-sm">个人中心</span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {PROFILE_NAV_ITEMS.map(({ label, value, icon: Icon }) => {
            const active = activeTab === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setActiveTab(value)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            )
          })}
        </nav>

        <div className="px-2 py-3 border-t">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            返回首页
          </Link>
        </div>
      </aside>

      <section className="flex-1 min-w-0 overflow-y-auto">
        <div className="p-6 max-w-3xl">
          <h1 className="text-xl font-bold mb-6">
            {activeTab === 'follows' ? '我的关注' : activeTab === 'history' ? '浏览历史' : '账号设置'}
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* ── 我的关注 ── */}
            <TabsContent value="follows" className="space-y-4 mt-0">
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
            <TabsContent value="history" className="space-y-4 mt-0">
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

            {/* ── 账号设置 ── */}
            <TabsContent value="settings" className="space-y-6 mt-0">
              <div className="rounded-xl border bg-card p-6 space-y-6">
                <div>
                  <h2 className="font-semibold text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    个人资料
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    修改你的显示名称或密码
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">邮箱</Label>
                    <Input id="email" value={user?.email || ''} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">邮箱不可修改</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="displayName">显示名称</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="你的显示名称"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">新密码</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="留空则不修改"
                      />
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">密码至少 8 位，留空则不修改</p>
                  </div>

                  {newPassword && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">确认密码</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入新密码"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-sm">
                    {profileSaveResult === 'ok' && (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        保存成功
                      </span>
                    )}
                    {profileSaveResult === 'error' && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        保存失败，请重试
                      </span>
                    )}
                    {profileError && (
                      <span className="flex items-center gap-1.5 text-destructive">
                        <AlertCircle className="h-4 w-4" />
                        {profileError}
                      </span>
                    )}
                  </div>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={profileSaving || !hasProfileChange}
                    className="gap-1.5"
                  >
                    {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    保存资料
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </main>
  )
}
