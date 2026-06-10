/**
 * 应用设置存储层
 *
 * 优先级：data/settings.json > 环境变量（.env.local）
 *
 * 支持的 key：
 *   AITOLL_API_KEY   — AI 分析和草稿生成
 *   JUSTONEAPI_TOKEN — 抖音数据提取
 */

import fs from 'fs/promises'
import path from 'path'

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json')

export interface AppSettings {
  AITOLL_API_KEY?: string
  JUSTONEAPI_TOKEN?: string
}

// ─── 读 / 写 ──────────────────────────────────────────────────────────────────

async function readSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf-8')
    return JSON.parse(raw) as AppSettings
  } catch {
    return {}
  }
}

export async function getSettings(): Promise<AppSettings> {
  return readSettings()
}

export async function saveSettings(patch: Partial<AppSettings>): Promise<void> {
  const current = await readSettings()
  // 空字符串视为"删除此项，回退到环境变量"
  const next: AppSettings = { ...current }
  for (const [k, v] of Object.entries(patch) as [keyof AppSettings, string | undefined][]) {
    if (v && v.trim()) {
      next[k] = v.trim()
    } else {
      delete next[k]
    }
  }
  await fs.mkdir(path.dirname(SETTINGS_FILE), { recursive: true })
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2))
}

// ─── 公共工具 ─────────────────────────────────────────────────────────────────

/**
 * 读取指定 key，优先使用 settings.json，回退到 process.env
 */
export async function getApiKey(key: keyof AppSettings): Promise<string | undefined> {
  const settings = await readSettings()
  return settings[key] || process.env[key] || undefined
}

/**
 * 返回脱敏后的 key 值（用于前端展示）
 * 前 4 位 + *** + 后 4 位，不足 8 位则全部遮盖
 */
export function maskKey(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return value.slice(0, 4) + '••••••••' + value.slice(-4)
}
