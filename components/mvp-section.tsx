'use client'

import { CheckCircle2, XCircle, Target, Calendar } from 'lucide-react'
import type { MVPPlan } from '@/lib/types'

interface MVPSectionProps {
  mvpPlan: MVPPlan
}

export function MVPSection({ mvpPlan }: MVPSectionProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-emerald-50 p-1.5 dark:bg-emerald-950/30">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">核心功能（MVP 阶段）</h4>
          <ul className="mt-1.5 space-y-1.5">
            {mvpPlan.coreFeatures.map((feature, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-slate-100 p-1.5 dark:bg-slate-800">
          <XCircle className="h-4 w-4 text-slate-600 dark:text-slate-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">明确不做</h4>
          <ul className="mt-1.5 space-y-1.5">
            {mvpPlan.outOfScope.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-blue-50 p-1.5 dark:bg-blue-950/30">
          <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">成功标准</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {mvpPlan.successCriteria}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-amber-50 p-1.5 dark:bg-amber-950/30">
          <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-medium text-sm">时间线</h4>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {mvpPlan.timeline}
          </p>
        </div>
      </div>
    </div>
  )
}
