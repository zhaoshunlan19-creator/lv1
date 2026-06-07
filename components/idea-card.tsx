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

  return (
    <Link href={`/idea/${idea.id}`} className="block mb-4 break-inside-avoid">
      <div className="group rounded-xl border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20">
        <div className={`bg-gradient-to-br ${gradient} aspect-[3/4] flex items-center justify-center`}>
          <span className="text-5xl">{emoji}</span>
        </div>
        <div className="p-4 space-y-1.5">
          <h3 className="font-semibold text-base group-hover:text-primary transition-colors leading-snug">
            {idea.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {idea.description}
          </p>
        </div>
      </div>
    </Link>
  )
}
