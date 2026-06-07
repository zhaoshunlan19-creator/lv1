'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
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

interface IdeaCardFocusProps {
  idea: Idea
}

export function IdeaCardFocus({ idea }: IdeaCardFocusProps) {
  const idx = getIndex(idea.title)
  const gradient = GRADIENTS[idx]
  const emoji = EMOJIS[idx]

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-2xl font-bold leading-tight">{idea.title}</h2>
      </div>

      <div className={`bg-gradient-to-br ${gradient} h-96 flex items-center justify-center`}>
        <span className="text-8xl">{emoji}</span>
      </div>

      <div className="px-6 py-4 flex items-start gap-3">
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">{idea.description}</p>
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href={`/idea/${idea.id}`}>查看详情</Link>
        </Button>
      </div>
    </div>
  )
}
