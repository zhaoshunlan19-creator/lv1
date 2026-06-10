import { SOURCE_REGISTRY, SOURCE_FALLBACK } from '@/lib/types'

interface SourceBadgeProps {
  type: string
}

/**
 * 来源徽章
 * 样式从 SOURCE_REGISTRY 读取，未注册的来源显示兜底样式。
 * 新增来源：只需在 lib/types.ts 的 SOURCE_REGISTRY 中添加一条记录。
 */
export function SourceBadge({ type }: SourceBadgeProps) {
  const def = SOURCE_REGISTRY[type] ?? SOURCE_FALLBACK
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${def.color}`}>
      {def.label}
    </span>
  )
}
