'use client'

import { useState, useEffect } from 'react'
import { Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { Idea } from '@/lib/types'

interface EditIdeaDialogProps {
  idea: Idea | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

export function EditIdeaDialog({ idea, open, onOpenChange, onUpdated }: EditIdeaDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetUser, setTargetUser] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (idea) {
      setTitle(idea.title)
      setDescription(idea.description)
      setTargetUser(idea.targetUser)
      setError('')
    }
  }, [idea])

  const handleSave = async () => {
    if (!idea) return
    if (!title.trim() || !description.trim() || !targetUser.trim()) {
      setError('请填写所有必填字段')
      return
    }

    setError('')
    setSaving(true)

    try {
      const res = await fetch(`/api/ideas/${idea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          targetUser: targetUser.trim(),
        }),
      })

      if (!res.ok) throw new Error('保存失败')

      onOpenChange(false)
      onUpdated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => {
      if (!saving) onOpenChange(v)
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            编辑创意
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-title">
              创意名称 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">
              详细描述 <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="edit-desc"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-target">
              目标用户 / 痛点 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-target"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  保存中...
                </>
              ) : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
