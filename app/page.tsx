'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, ListFilter, LayoutGrid, Maximize2, Lightbulb, BookOpen, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { IdeaCard } from '@/components/idea-card'
import { IdeaCardFocus } from '@/components/idea-card-focus'
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

function getIndex(title: string) {
  return (title.charCodeAt(0) || 0) % 6
}

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'focus' | 'grid'>('focus')
  const [history, setHistory] = useState<string[]>([])

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

  const handleNext = useCallback(() => {
    setHistory((hist) => {
      const currentId = hist[hist.length - 1]
      const candidates = ideas.filter((i) => i.id !== currentId)
      const source = candidates.length ? candidates : ideas
      const next = source[Math.floor(Math.random() * source.length)]
      return [...hist.filter((id) => id !== next.id), next.id]
    })
  }, [ideas])

  const handleHistoryClick = useCallback((id: string) => {
    setHistory((hist) => [...hist.filter((h) => h !== id), id])
    setViewMode('focus')
  }, [])

  const handleGridCardClick = useCallback((id: string) => {
    setHistory((hist) => [...hist.filter((h) => h !== id), id])
    setViewMode('focus')
  }, [])

  const currentId = history[history.length - 1]
  const currentIdea = ideas.find((i) => i.id === currentId)
  const historyIdeas = [...new Set([...history].reverse())]
    .map((id) => ideas.find((i) => i.id === id))
    .filter((i): i is Idea => !!i)

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
            <Button variant="outline" size="sm" asChild className="gap-1.5 ml-1">
              <Link href="/admin">
                <ListFilter className="h-4 w-4" />
                管理后台
              </Link>
            </Button>
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
              {historyIdeas.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="default" className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      浏览历史
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 overflow-y-auto">
                    <SheetHeader className="mb-4">
                      <SheetTitle>浏览历史</SheetTitle>
                    </SheetHeader>
                    <div className="space-y-3">
                      {historyIdeas.map((idea, i) => {
                        const idx = getIndex(idea.title)
                        return (
                          <button
                            key={`${idea.id}-${i}`}
                            onClick={() => handleHistoryClick(idea.id)}
                            className="w-full text-left rounded-lg border bg-card overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all"
                          >
                            <div className={`bg-gradient-to-br ${GRADIENTS[idx]} h-8 flex items-center px-3 gap-2`}>
                              <span className="text-sm">{EMOJIS[idx]}</span>
                              <span className="text-xs text-white/90 font-medium truncate">{idea.title}</span>
                            </div>
                            <p className="px-3 py-2 text-xs text-muted-foreground line-clamp-2">{idea.description}</p>
                          </button>
                        )
                      })}
                    </div>
                  </SheetContent>
                </Sheet>
              )}
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
