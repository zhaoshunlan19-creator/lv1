'use client'

import { Target, Users, Sparkles, AlertTriangle, Compass } from 'lucide-react'
import type { AnalysisResult } from '@/lib/types'

interface AnalysisSectionProps {
  analysis: AnalysisResult
}

export function AnalysisSection({ analysis }: AnalysisSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-red-50 p-1.5 dark:bg-red-950/30">
          <Target className="h-4 w-4 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">核心痛点</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {analysis.painPoints}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/30">
          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">目标用户</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {analysis.targetUsers}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 dark:bg-emerald-950/30">
          <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">关键功能建议</h4>
          <ul className="mt-1.5 space-y-1.5">
            {analysis.keyFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-50 p-1.5 dark:bg-amber-950/30">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">潜在风险</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {analysis.risks}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-violet-50 p-1.5 dark:bg-violet-950/30">
          <Compass className="h-4 w-4 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">差异化机会</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            {analysis.opportunities}
          </p>
        </div>
      </div>
    </div>
  )
}
