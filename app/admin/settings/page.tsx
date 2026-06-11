'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, Sparkles, User, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SessionUser } from '@/lib/session'

type Source = 'settings' | 'env' | 'none'

interface KeyState {
  masked: string
  source: Source
  draft: string
  reveal: boolean
}

const SOURCE_LABEL: Record<Source, string> = {
  settings: '已在设置中配置',
  env: '来自环境变量',
  none: '未配置',
}

const SOURCE_COLOR: Record<Source, string> = {
  settings: 'text-emerald-600 dark:text-emerald-400',
  env: 'text-amber-600 dark:text-amber-400',
  none: 'text-destructive',
}

export default function SettingsPage() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  // API Keys
  const [aitoll, setAitoll] = useState<KeyState>({ masked: '', source: 'none', draft: '', reveal: false })
  const [justoneapi, setJustoneapi] = useState<KeyState>({ masked: '', source: 'none', draft: '', reveal: false })
  const [apiSaving, setApiSaving] = useState(false)
  const [apiSaveResult, setApiSaveResult] = useState<'ok' | 'error' | null>(null)

  // Profile
  const [displayName, setDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaveResult, setProfileSaveResult] = useState<'ok' | 'error' | null>(null)
  const [profileError, setProfileError] = useState('')

  useEffect(() => {
    fetch('/api/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => {
        if (u) {
          setUser(u)
          setIsAdmin(u.role === 'admin')
          setDisplayName(u.displayName || '')
        }
      })
      .then(() =>
        fetch('/api/settings')
          .then((r) => r.json())
          .then((data) => {
            setAitoll((s) => ({ ...s, masked: data.AITOLL_API_KEY.masked, source: data.AITOLL_API_KEY.source }))
            setJustoneapi((s) => ({ ...s, masked: data.JUSTONEAPI_TOKEN.masked, source: data.JUSTONEAPI_TOKEN.source }))
          })
      )
      .finally(() => setLoading(false))
  }, [])

  const handleSaveApiKeys = async () => {
    setApiSaving(true)
    setApiSaveResult(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          AITOLL_API_KEY: aitoll.draft,
          JUSTONEAPI_TOKEN: justoneapi.draft,
        }),
      })
      if (!res.ok) throw new Error()

      const updated = await fetch('/api/settings').then((r) => r.json())
      setAitoll((s) => ({ ...s, masked: updated.AITOLL_API_KEY.masked, source: updated.AITOLL_API_KEY.source, draft: '', reveal: false }))
      setJustoneapi((s) => ({ ...s, masked: updated.JUSTONEAPI_TOKEN.masked, source: updated.JUSTONEAPI_TOKEN.source, draft: '', reveal: false }))
      setApiSaveResult('ok')
    } catch {
      setApiSaveResult('error')
    } finally {
      setApiSaving(false)
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
    } catch {
      setProfileSaveResult('error')
    } finally {
      setProfileSaving(false)
    }
  }

  const hasApiDraft = aitoll.draft !== '' || justoneapi.draft !== ''
  const hasProfileChange =
    displayName.trim() !== (user?.displayName || '') ||
    newPassword !== '' ||
    confirmPassword !== ''

  return (
    <main className="p-6 max-w-2xl space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <h1 className="text-xl font-bold">设置</h1>

          {/* ── API 密钥 ── */}
          {isAdmin && (
            <div className="rounded-xl border bg-card p-6 space-y-6">
              <div>
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  API 密钥
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  此处配置的值优先于环境变量（.env.local）。留空则回退到环境变量。
                </p>
              </div>

              <KeyField
                label="AITOLL_API_KEY"
                description="用于 AI 创意分析和抖音草稿生成"
                state={aitoll}
                onChange={(draft) => setAitoll((s) => ({ ...s, draft }))}
                onToggleReveal={() => setAitoll((s) => ({ ...s, reveal: !s.reveal }))}
              />

              <KeyField
                label="JUSTONEAPI_TOKEN"
                description="用于抖音视频数据提取"
                state={justoneapi}
                onChange={(draft) => setJustoneapi((s) => ({ ...s, draft }))}
                onToggleReveal={() => setJustoneapi((s) => ({ ...s, reveal: !s.reveal }))}
              />

              <div className="flex items-center justify-between pt-2">
                <div className="text-sm">
                  {apiSaveResult === 'ok' && (
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      保存成功
                    </span>
                  )}
                  {apiSaveResult === 'error' && (
                    <span className="flex items-center gap-1.5 text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      保存失败，请重试
                    </span>
                  )}
                </div>
                <Button onClick={handleSaveApiKeys} disabled={apiSaving || !hasApiDraft} className="gap-1.5">
                  {apiSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  保存设置
                </Button>
              </div>
            </div>
          )}

          {/* ── 个人资料 ── */}
          <div className="rounded-xl border bg-card p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                个人资料
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                修改你的显示名称或密码。
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
        </>
      )}
    </main>
  )
}

// ─── KeyField 子组件 ─────────────────────────────────────────────────────────

function KeyField({
  label,
  description,
  state,
  onChange,
  onToggleReveal,
}: {
  label: string
  description: string
  state: KeyState
  onChange: (v: string) => void
  onToggleReveal: () => void
}) {
  const sourceLabel = SOURCE_LABEL[state.source]
  const sourceColor = SOURCE_COLOR[state.source]

  return (
    <div className="space-y-2">
      <Label htmlFor={label}>{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <div className="relative">
        <Input
          id={label}
          type={state.reveal ? 'text' : 'password'}
          placeholder={state.masked || '输入新的值…'}
          value={state.draft}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10 font-mono text-sm"
          autoComplete="off"
        />
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          tabIndex={-1}
        >
          {state.reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      <p className={`text-xs ${sourceColor}`}>
        当前：{sourceLabel}
        {state.masked && state.source !== 'none' && (
          <span className="text-muted-foreground ml-1 font-mono">({state.masked})</span>
        )}
      </p>
    </div>
  )
}
