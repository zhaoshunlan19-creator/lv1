'use client'

import Link from 'next/link'
import type { Idea } from '@/lib/types'

const GRADIENTS = [
  'from-indigo-400 to-purple-500',
  'from-rose-400 to-pink-500',
  'from-amber-400 to-orange-500',
  'from-teal-400 to-cyan-500',
  'from-violet-400 to-fuchsia-500',
  'from-emerald-400 to-green-500',
]

const EMOJIS = ['💡', '🚀', '🎯', '🔧', '🌱', '✨']

function getIndex(title: string): number {
  return (title.charCodeAt(0) || 0) % 6
}

interface IdeaCardProps {
  idea: Idea
}

export function IdeaCard({ idea }: IdeaCardProps) {
  const idx = getIndex(idea.title)
  const gradient = GRADIENTS[idx]
  const emoji = EMOJIS[idx]
  const dateStr = new Date(idea.createdAt).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link href={`/idea/${idea.id}`}>
      <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
        <div className={`bg-gradient-to-br ${gradient} h-20 flex items-center justify-center`}>
          <span className="text-3xl">{emoji}</span>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
            {idea.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {idea.description}
          </p>
          {idea.targetUser && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>👤</span>
              <span className="truncate">{idea.targetUser}</span>
            </p>
          )}
          <div className="pt-1 text-right">
            <span className="text-xs text-muted-foreground">{dateStr}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
