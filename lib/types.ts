// ============================================
// IdeaForge 类型定义
// ============================================

export interface AnalysisResult {
  painPoints: string
  targetUsers: string
  keyFeatures: string[]
  risks: string
  opportunities: string
}

export interface MVPPlan {
  coreFeatures: string[]
  outOfScope: string[]
  successCriteria: string
  timeline: string
}

export type IdeaStatus = 'pending' | 'analyzing' | 'completed'

export interface Idea {
  id: string
  title: string
  description: string
  targetUser: string
  status: IdeaStatus
  createdAt: number
  updatedAt: number
  analysis?: AnalysisResult
  mvpPlan?: MVPPlan
}
