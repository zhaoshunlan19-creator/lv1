// ============================================
// IdeaForge 类型定义
// ============================================

// ── 用户系统 ────────────────────────────────

export type UserRole = 'admin' | 'user'

export interface User {
  id: string
  email: string
  displayName: string
  passwordHash: string
  role: UserRole
  createdAt: number
  updatedAt: number
}

/** 对外暴露的安全用户对象（不含密码哈希） */
export type SafeUser = Omit<User, 'passwordHash'>

/**
 * 创意来源类型
 * 用字符串联合而非枚举，便于后续扩展新来源时只改注册表，不影响类型系统
 */
export type IdeaSourceType = 'manual' | 'douyin' | (string & {})

export interface IdeaSource {
  type: IdeaSourceType
  // 抖音专用字段
  videoId?: string
  shareUrl?: string
  videoTitle?: string
  coverImage?: string
  authorName?: string
  stats?: {
    playCount: number
    likeCount: number
    commentCount: number
    shareCount: number
  }
}

/**
 * 来源注册表 — 新增来源只需在此处添加一条记录
 */
export const SOURCE_REGISTRY: Record<string, { label: string; color: string }> = {
  manual:  { label: '手动录入', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300' },
  douyin:  { label: '抖音',     color: 'bg-pink-100 text-pink-600 dark:bg-pink-950 dark:text-pink-300' },
}

/** 未注册来源的兜底样式 */
export const SOURCE_FALLBACK = { label: '未知来源', color: 'bg-muted text-muted-foreground' }

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
  source?: IdeaSource
}
