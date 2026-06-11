/**
 * 浏览历史数据存储层
 * 数据存储在 data/history.json 中
 * 格式: Record<string, HistoryEntry[]>
 */

import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const HISTORY_FILE = path.join(DATA_DIR, 'history.json')

const MAX_HISTORY_PER_USER = 50

interface HistoryEntry {
  ideaId: string
  viewedAt: number
}

async function ensureDataFile(): Promise<void> {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
  try {
    await fs.access(HISTORY_FILE)
  } catch {
    await fs.writeFile(HISTORY_FILE, JSON.stringify({}, null, 2))
  }
}

async function getHistoryMap(): Promise<Record<string, HistoryEntry[]>> {
  await ensureDataFile()
  const data = await fs.readFile(HISTORY_FILE, 'utf-8')
  return JSON.parse(data) as Record<string, HistoryEntry[]>
}

async function saveHistoryMap(map: Record<string, HistoryEntry[]>): Promise<void> {
  await fs.writeFile(HISTORY_FILE, JSON.stringify(map, null, 2))
}

/**
 * 获取用户的浏览历史（按 viewedAt 倒序）
 */
export async function getHistory(userId: string): Promise<HistoryEntry[]> {
  const map = await getHistoryMap()
  const list = map[userId] || []
  return list.sort((a, b) => b.viewedAt - a.viewedAt)
}

/**
 * 添加一条浏览记录。
 * 若同一创意已存在，更新 viewedAt 并提到最前面；
 * 超出 MAX_HISTORY_PER_USER 时淘汰最旧的。
 */
export async function addHistory(userId: string, ideaId: string): Promise<void> {
  const map = await getHistoryMap()
  let list = map[userId] || []

  // 移除已有的同一创意记录
  list = list.filter((e) => e.ideaId !== ideaId)

  // 新记录放最前面
  list.unshift({ ideaId, viewedAt: Date.now() })

  // 限制条数
  if (list.length > MAX_HISTORY_PER_USER) {
    list = list.slice(0, MAX_HISTORY_PER_USER)
  }

  map[userId] = list
  await saveHistoryMap(map)
}

/**
 * 清空用户的浏览历史
 */
export async function clearHistory(userId: string): Promise<void> {
  const map = await getHistoryMap()
  delete map[userId]
  await saveHistoryMap(map)
}
