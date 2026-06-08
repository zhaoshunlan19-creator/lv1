'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Save, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Source = 'settings' | 'env' | 'none'

interface KeyState {
  // 当前服务端保存的脱敏值 + 来源
  masked: string
  source: Source
  // 用户正在编辑的明文值
  draft: string
  // 是否显示明文输入
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
  const [aitoll, setAitoll] = useState<KeyState>({ masked: '', source: 'none', draft: '', reveal: false })
  const [justoneapi, setJustoneapi] = useState<KeyState>({ masked: '', source: 'none', draft: '', reveal: false })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveResult, setSaveResult] = useState<'ok' | 'error' | null>(null)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setAitoll((s) => ({ ...s, masked: data.AITOLL_API_KEY.masked, source: data.AITOLL_API_KEY.source }))
        setJustoneapi((s) => ({ ...s, masked: data.JUSTONEAPI_TOKEN.masked, source: data.JUSTONEAPI_TOKEN.source }))
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveResult(null)
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

      // 重新拉取脱敏后的最新值
      const updated = await fetch('/api/settings').then((r) => r.json())
      setAitoll((s) => ({ ...s, masked: updated.AITOLL_API_KEY.masked, source: updated.AITOLL_API_KEY.source, draft: '', reveal: false }))
      setJustoneapi((s) => ({ ...s, masked: updated.JUSTONEAPI_TOKEN.masked, source: updated.JUSTONEAPI_TOKEN.source, draft: '', reveal: false }))
      setSaveResult('ok')
    } catch {
      setSaveResult('error')
    } finally {
      setSaving(false)
    }
  }

  const hasDraft = aitoll.draft !== '' || justoneapi.draft !== ''

  return (
    <main className="p-6 max-w-2xl space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Page header */}
          <h1 className="text-xl font-bold">设置</h1>

            {/* API Keys */}
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

              {/* AITOLL_API_KEY */}
              <KeyField
                label="AITOLL_API_KEY"
                description="用于 AI 创意分析和抖音草稿生成"
                state={aitoll}
                onChange={(draft) => setAitoll((s) => ({ ...s, draft }))}
                onToggleReveal={() => setAitoll((s) => ({ ...s, reveal: !s.reveal }))}
              />

              {/* JUSTONEAPI_TOKEN */}
              <KeyField
                label="JUSTONEAPI_TOKEN"
                description="用于抖音视频数据提取"
                state={justoneapi}
                onChange={(draft) => setJustoneapi((s) => ({ ...s, draft }))}
                onToggleReveal={() => setJustoneapi((s) => ({ ...s, reveal: !s.reveal }))}
              />
            </div>

            {/* Save */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                {saveResult === 'ok' && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    保存成功
                  </span>
                )}
                {saveResult === 'error' && (
                  <span className="flex items-center gap-1.5 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    保存失败，请重试
                  </span>
                )}
              </div>
              <Button onClick={handleSave} disabled={saving || !hasDraft} className="gap-1.5">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存设置
              </Button>
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
