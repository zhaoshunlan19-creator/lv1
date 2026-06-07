'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Lightbulb, Sparkles, ListFilter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { IdeaCard } from '@/components/idea-card'
import type { Idea } from '@/lib/types'

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)

  const fetchIdeas = async () => {
    try {
      const res = await fetch('/api/ideas')
      if (res.ok) {
        const data = await res.json()
        setIdeas(data)
      }
    } catch (error) {
      console.error('获取创意列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIdeas()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-1.5">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">IdeaForge</span>
          </div>
          <Button variant="outline" size="sm" asChild className="gap-1.5">
            <Link href="/admin">
              <ListFilter className="h-4 w-4" />
              管理后台
            </Link>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        {ideas.length === 0 && !loading && (
          <div className="text-center py-16 space-y-6">
            <div className="inline-flex items-center justify-center rounded-2xl bg-primary/5 p-6">
              <Lightbulb className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                IdeaForge 创意工坊
              </h1>
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                探索创意，发现灵感。每个想法背后都有一份 AI 生成的产品规划。
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              管理员正在录入创意中，敬请期待...
            </p>
          </div>
        )}

        {/* Ideas List */}
        {ideas.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">创意广场</h2>
              <span className="text-sm text-muted-foreground">
                共 {ideas.length} 个创意
              </span>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="rounded-xl border bg-card p-5 h-32 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ideas.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
