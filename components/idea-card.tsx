'use client'

import { Lightbulb, Clock, CheckCircle2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import type { Idea, IdeaStatus } from '@/lib/types'

interface IdeaCardProps {
  idea: Idea
}

function StatusBadge({ status }: { status: IdeaStatus }) {
  if (status === 'analyzing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        <Loader2 className="h-3 w-3 animate-spin" />
        分析中
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
        <CheckCircle2 className="h-3 w-3" />
        分析已完成
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      待分析
    </span>
  )
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const dateStr = new Date(idea.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/idea/${idea.id}`}>
      <div className="group rounded-xl border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
            <Lightbulb className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
              {idea.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {idea.description}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <StatusBadge status={idea.status} />
              <span className="text-xs text-muted-foreground">{dateStr}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
